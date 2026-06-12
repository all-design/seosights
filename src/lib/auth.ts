/**
 * Authentication & Session Management
 *
 * JWT-based auth with role-based access control.
 * Roles: user | agency | affiliate | superadmin
 *
 * - Registration: user/agency/affiliate can self-register
 * - Superadmin: assigned directly in database (no public registration)
 * - Universal login: single endpoint, role determines dashboard redirect
 */

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// ── Configuration ──────────────────────────────────────────────────────────

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'seosights-jwt-secret-change-in-production-2025'
)

const JWT_EXPIRY = '7d' // Session lasts 7 days
const BCRYPT_ROUNDS = 12

// ── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'agency' | 'affiliate' | 'superadmin'

export interface AuthToken {
  userId: string
  email: string
  role: UserRole
  name: string | null
  tier: string
}

export interface AuthResult {
  success: boolean
  token?: string
  user?: {
    id: string
    email: string
    name: string | null
    role: UserRole
    tier: string
    avatarUrl: string | null
  }
  error?: string
}

// ── Password Hashing ───────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── JWT Token Management ───────────────────────────────────────────────────

export async function createToken(payload: AuthToken): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .setIssuer('seosights')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<AuthToken | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'seosights',
    })
    return payload as unknown as AuthToken
  } catch {
    return null
  }
}

// ── Registration ───────────────────────────────────────────────────────────

export async function registerUser(params: {
  email: string
  password: string
  name?: string
  role?: UserRole
  referralCode?: string
}): Promise<AuthResult> {
  const { email, password, name, role = 'user', referralCode } = params

  // Validate role — superadmin cannot self-register
  if (role === 'superadmin') {
    return { success: false, error: 'Superadmin accounts cannot be created via registration' }
  }

  // Check if user already exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: 'An account with this email already exists' }
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Resolve referral code if provided
  let referredByAffiliateId: string | null = null
  if (referralCode) {
    const affiliate = await db.affiliate.findUnique({
      where: { affiliateCode: referralCode },
    })
    if (affiliate) {
      referredByAffiliateId = affiliate.id
    }
  }

  // Create user with appropriate role
  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      role,
      referredByAffiliateId,
      // If registering as agency, set tier to pro
      tier: role === 'agency' ? 'pro' : 'trial',
      subscriptionStatus: role === 'agency' ? 'active' : 'trial',
    },
  })

  // If user registered as affiliate, create affiliate record
  if (role === 'affiliate') {
    const affiliateCode = generateAffiliateCode(name || email)
    await db.affiliate.create({
      data: {
        userId: user.id,
        affiliateCode,
        status: 'active',
      },
    })
  }

  // Create referral record if came via affiliate
  if (referredByAffiliateId) {
    await db.affiliateReferral.create({
      data: {
        affiliateId: referredByAffiliateId,
        referredUserId: user.id,
        status: 'registered',
      },
    })
  }

  // Create session token
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name,
    tier: user.tier,
  })

  // Store session in database
  await db.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  })

  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tier: user.tier,
      avatarUrl: user.avatarUrl,
    },
  }
}

// ── Login ──────────────────────────────────────────────────────────────────

export async function loginUser(params: {
  email: string
  password: string
  userAgent?: string
  ipAddress?: string
}): Promise<AuthResult> {
  const { email, password, userAgent, ipAddress } = params

  // Find user
  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Check password
  if (!user.passwordHash) {
    return { success: false, error: 'This account uses OAuth. Please log in with your provider.' }
  }

  const validPassword = await verifyPassword(password, user.passwordHash)
  if (!validPassword) {
    return { success: false, error: 'Invalid email or password' }
  }

  // Create JWT token
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    name: user.name,
    tier: user.tier,
  })

  // Store session
  await db.session.create({
    data: {
      userId: user.id,
      token,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  // Update last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tier: user.tier,
      avatarUrl: user.avatarUrl,
    },
  }
}

// ── Logout ─────────────────────────────────────────────────────────────────

export async function logoutUser(token: string): Promise<void> {
  try {
    await db.session.deleteMany({ where: { token } })
  } catch {
    // Session might not exist, that's fine
  }
}

// ── Get Current User ───────────────────────────────────────────────────────

export async function getCurrentUser(token: string): Promise<AuthResult> {
  const payload = await verifyToken(token)
  if (!payload) {
    return { success: false, error: 'Invalid or expired token' }
  }

  // Check session in database
  const session = await db.session.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) {
    return { success: false, error: 'Session expired' }
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return { success: false, error: 'User not found' }
  }

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      tier: user.tier,
      avatarUrl: user.avatarUrl,
    },
  }
}

// ── Role-Based Redirect ────────────────────────────────────────────────────

export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'superadmin':
      return '/admin-portal'
    case 'affiliate':
      return '/affiliate-portal/dashboard'
    case 'agency':
      return '/agency/dashboard'
    default:
      return '/dashboard'
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateAffiliateCode(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8)
  const random = Math.random().toString(36).slice(2, 6)
  return `${base}${random}`
}
