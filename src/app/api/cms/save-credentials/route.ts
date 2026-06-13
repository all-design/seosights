import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/cms/save-credentials
 * Saves CMS credentials for a project
 *
 * Body: {
 *   projectId: string
 *   credentials: {
 *     platform: 'wordpress' | 'webflow' | 'shopify'
 *     siteUrl: string
 *     wp_username?: string
 *     wp_application_password?: string
 *   }
 * }
 */

interface CMSCredentialsInput {
  platform: 'wordpress' | 'webflow' | 'shopify'
  siteUrl: string
  wp_username?: string
  wp_application_password?: string
}

interface SaveCredentialsRequestBody {
  projectId: string
  credentials: CMSCredentialsInput
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveCredentialsRequestBody = await request.json()
    const { projectId, credentials } = body

    // ── Validate required fields ──────────────────────────────────────
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      )
    }

    if (!credentials?.platform || !credentials?.siteUrl) {
      return NextResponse.json(
        { success: false, error: 'credentials must include platform and siteUrl' },
        { status: 400 }
      )
    }

    const validPlatforms = ['wordpress', 'webflow', 'shopify']
    if (!validPlatforms.includes(credentials.platform)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid platform "${credentials.platform}". Must be one of: ${validPlatforms.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // ── WordPress-specific validation ────────────────────────────────
    if (credentials.platform === 'wordpress') {
      if (!credentials.wp_username || !credentials.wp_application_password) {
        return NextResponse.json(
          {
            success: false,
            error: 'WordPress credentials require wp_username and wp_application_password',
          },
          { status: 400 }
        )
      }
    }

    // ── Verify project exists ────────────────────────────────────────
    const project = await db.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // ── Normalize site URL ───────────────────────────────────────────
    const normalizedSiteUrl = credentials.siteUrl.replace(/\/+$/, '')

    // ── Build credentials object for storage ─────────────────────────
    const credentialsToStore: Record<string, string> = {
      platform: credentials.platform,
      siteUrl: normalizedSiteUrl,
    }

    if (credentials.wp_username) {
      credentialsToStore.wp_username = credentials.wp_username
    }

    if (credentials.wp_application_password) {
      credentialsToStore.wp_application_password = credentials.wp_application_password
    }

    // ── Save credentials to project ──────────────────────────────────
    // NOTE: In production, the application password should be encrypted
    // before storage. For now, we store as JSON string (Prisma field).
    await db.project.update({
      where: { id: projectId },
      data: {
        cmsPlatform: credentials.platform,
        cmsCredentials: JSON.stringify(credentialsToStore),
      },
    })

    console.log(
      `[CMS Save] Saved ${credentials.platform} credentials for project: ${projectId}`
    )

    return NextResponse.json({
      success: true,
      platform: credentials.platform,
      siteUrl: normalizedSiteUrl,
    })
  } catch (error) {
    console.error('[CMS Save] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while saving credentials' },
      { status: 500 }
    )
  }
}
