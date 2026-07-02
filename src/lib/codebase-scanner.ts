/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Codebase Scanner — AI Software Factory™
 *  Real introspection of the project source tree.
 *
 *  Pure server-side module. Uses Node.js `fs/promises` + `path` to walk the
 *  `/src/` directory and extract real data about:
 *    • Components  (src/components/**)
 *    • Hooks       (src/hooks/**)
 *    • Libs        (src/lib/**)
 *    • API routes  (any src/app/api/route.ts file)
 *    • Pages       (any src/app/page.tsx file)
 *    • Prisma models (prisma/schema.prisma)
 *
 *  Design goals:
 *    - NEVER throws: every file is wrapped in try/catch; one bad file never
 *      breaks the whole scan.
 *    - Reads in parallel using Promise.all for performance.
 *    - Pure regex parsing — no AST, no extra dependencies.
 *    - Works inside the Next.js server runtime (uses process.cwd()).
 * ────────────────────────────────────────────────────────────────────────────
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Public Types ───────────────────────────────────────────────────────────

export interface ComponentInfo {
  name: string
  path: string
  type: 'page' | 'component' | 'hook' | 'lib' | 'api'
  isClient: boolean // has 'use client' directive
  lineCount: number
  exports: string[]
}

export interface APIRouteInfo {
  path: string // e.g., '/api/observatory/crawl'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'MIXED'
  file: string // relative path
  hasAuth: boolean
  lineCount: number
}

export interface PrismaModelInfo {
  name: string
  fields: { name: string; type: string; isRequired: boolean; isUnique: boolean }[]
  relations: string[]
  indexes: string[]
}

export interface PageRouteInfo {
  path: string // e.g., '/control/governor'
  file: string
  title: string | null // extracted from <title> or h1
  isClient: boolean
}

export interface ScanResult {
  timestamp: Date
  components: ComponentInfo[]
  apiRoutes: APIRouteInfo[]
  prismaModels: PrismaModelInfo[]
  pages: PageRouteInfo[]
  hooks: ComponentInfo[]
  libs: ComponentInfo[]
  stats: {
    totalComponents: number
    totalAPIRoutes: number
    totalPrismaModels: number
    totalPages: number
    totalHooks: number
    totalLibs: number
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const PROJECT_ROOT = process.cwd()
const SRC_DIR = path.join(PROJECT_ROOT, 'src')
const APP_DIR = path.join(SRC_DIR, 'app')
const COMPONENTS_DIR = path.join(SRC_DIR, 'components')
const HOOKS_DIR = path.join(SRC_DIR, 'hooks')
const LIB_DIR = path.join(SRC_DIR, 'lib')
const PRISMA_SCHEMA_PATH = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma')

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx'])
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'fonts',
  'public',
  'extensions',
  'plugins',
  'download',
  'mini-services',
  'scripts',
  'examples',
])

// Prisma scalar types — used to distinguish fields from relations.
const PRISMA_SCALAR_TYPES = new Set([
  'String',
  'Int',
  'BigInt',
  'Float',
  'Decimal',
  'Boolean',
  'DateTime',
  'Json',
  'Bytes',
  'Unsupported',
])

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Recursively walk a directory and return all file paths whose extension is in
 * SCAN_EXTENSIONS. Skips EXCLUDED_DIRS. Never throws — returns [] on failure.
 */
async function walkDirectory(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries: Awaited<ReturnType<typeof fs.readdir>>
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out // directory doesn't exist or not readable
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    try {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue
        // Recurse — awaited sequentially to keep memory predictable.
        const nested = await walkDirectory(full)
        out.push(...nested)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (SCAN_EXTENSIONS.has(ext)) out.push(full)
      }
    } catch {
      // skip unreadable entries silently
    }
  }
  return out
}

/**
 * Safely read a file's contents. Returns null on any error.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return null
  }
}

/**
 * Detect 'use client' directive. Looks at the first ~5 non-empty lines for
 * the directive (covers most file headers).
 */
function isClientComponent(content: string): boolean {
  const lines = content.split('\n').slice(0, 10)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("'use client'") || line.startsWith('"use client"')) {
      return true
    }
    if (line.startsWith("'use server'") || line.startsWith('"use server"')) {
      return false
    }
    // First non-blank, non-comment, non-import line means we're past the
    // directive zone — no 'use client' present.
    if (
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('import')
    ) {
      continue
    }
    break
  }
  return false
}

/** Count the number of lines in a string (matches editor line count). */
function countLines(content: string): number {
  if (!content) return 0
  return content.split('\n').length
}

/**
 * Extract exported identifiers using a lightweight regex sweep. Captures:
 *   - export function Name
 *   - export async function Name
 *   - export const Name
 *   - export let Name / export var Name
 *   - export default function Name (optional name)
 *   - export class Name
 * Returns a de-duplicated list.
 */
function extractExports(content: string): string[] {
  const names = new Set<string>()

  // named function/async function
  const fnRe = /export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
  let m: RegExpExecArray | null
  while ((m = fnRe.exec(content)) !== null) names.add(m[1])

  // const/let/var (skip arrow consts that are inline-defined inline later)
  const varRe =
    /export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g
  while ((m = varRe.exec(content)) !== null) names.add(m[1])

  // class
  const clsRe = /export\s+class\s+([A-Za-z_$][\w$]*)/g
  while ((m = clsRe.exec(content)) !== null) names.add(m[1])

  // export default function Name
  const defFnRe = /export\s+default\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g
  while ((m = defFnRe.exec(content)) !== null) names.add(m[1])

  // mark "default" if there's a bare `export default`
  if (/export\s+default\s+[^A-Za-z_$]/.test(content) || /export\s+default\s*$/m.test(content)) {
    names.add('default')
  }

  return Array.from(names)
}

/**
 * Derive a clean component/lib name from a file path.
 * - For `Foo.tsx` → `Foo`
 * - For `foo-bar.ts` → `fooBar` (kept as-is otherwise)
 */
function deriveName(filePath: string): string {
  const base = path.basename(filePath)
  const ext = path.extname(base)
  return base.slice(0, base.length - ext.length)
}

/**
 * Convert an absolute file path under the project root into a project-relative
 * POSIX path (e.g. `src/components/landing/Navbar.tsx`).
 */
function toRelativePath(absPath: string): string {
  let rel = path.relative(PROJECT_ROOT, absPath)
  if (path.sep !== '/') rel = rel.split(path.sep).join('/')
  return rel
}

/**
 * Given an API route file (always named `route.ts` or `route.tsx`), compute the
 * public-facing URL path. Drops the leading `app/` segment and the trailing
 * `route.ts(x)`. Dynamic segments like `[slug]` are kept as `:slug`.
 */
function apiFilePathToRoute(absPath: string): string {
  let rel = path.relative(APP_DIR, absPath)
  if (path.sep !== '/') rel = rel.split(path.sep).join('/')
  // strip filename
  rel = rel.replace(/\/route\.(ts|tsx)$/, '')
  // strip filename-only case (root route)
  rel = rel.replace(/^(route\.(ts|tsx))$/, '')
  if (!rel) return '/api'
  // dynamic segments: [slug] → :slug, [...rest] → :rest*
  rel = rel.replace(/\[\[\.\.\.([^\]]+)\]\]/g, ':$1*')
  rel = rel.replace(/\[\.\.\.([^\]]+)\]/g, ':$1*')
  rel = rel.replace(/\[([^\]]+)\]/g, ':$1')
  return '/' + rel
}

/**
 * Given a page file (always named `page.tsx` or `page.ts`), compute the
 * public-facing URL path. Drops the `app/` segment and trailing `page.tsx`.
 * Root `app/page.tsx` becomes `/`.
 */
function pageFilePathToRoute(absPath: string): string {
  let rel = path.relative(APP_DIR, absPath)
  if (path.sep !== '/') rel = rel.split(path.sep).join('/')
  rel = rel.replace(/\/page\.(ts|tsx)$/, '')
  rel = rel.replace(/^page\.(ts|tsx)$/, '')
  if (!rel) return '/'
  // dynamic segments preserved as-is (visual cue that it's dynamic)
  return '/' + rel
}

/**
 * Inspect the source of an API route file and determine which HTTP verbs are
 * exported. Returns 'MIXED' when more than one verb is exported.
 */
function detectHttpMethods(content: string): APIRouteInfo['method'] {
  const found = new Set<Exclude<APIRouteInfo['method'], 'MIXED'>>()
  const verbs: Exclude<APIRouteInfo['method'], 'MIXED'>[] = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ]
  for (const v of verbs) {
    const re = new RegExp(`export\\s+(?:async\\s+)?function\\s+${v}\\b`)
    if (re.test(content)) found.add(v)
  }
  if (found.size === 0) return 'GET' // default assumption
  if (found.size === 1) return Array.from(found)[0]
  return 'MIXED'
}

/**
 * Heuristic auth detection. Returns true if the file appears to enforce auth
 * via NextAuth, a custom session getter, or middleware-style guards.
 */
function detectAuth(content: string): boolean {
  const markers = [
    /\bgetServerSession\b/,
    /\brequireAuth\b/,
    /\brequireUser\b/,
    /\brequireSession\b/,
    /\bgetSession\b/,
    /\bvalidateSession\b/,
    /\bauth\(\s*\)/,
    /\bgetCurrentUser\b/,
    /\bgetLoggedInUser\b/,
    /\bcheckAuth\b/,
    /\bverifyAuth\b/,
    /from\s+['"]@\/lib\/auth['"]/,
    /from\s+['"]next-auth['"]/,
    /from\s+['"]@\/lib\/auth-context['"]/,
  ]
  return markers.some((re) => re.test(content))
}

/**
 * Extract a human-readable title for a page.tsx file. Strategy:
 *   1. `export const metadata = { title: "Foo" }` (Next.js metadata API)
 *   2. First `<h1>...</h1>` text content
 *   3. `const TITLE = "Foo"`
 *   4. null
 */
function extractPageTitle(content: string): string | null {
  // 1. metadata.title
  const metaRe =
    /export\s+const\s+metadata\s*[:=]\s*\{[^}]*?title\s*:\s*['"]([^'"]+)['"]/s
  const m1 = metaRe.exec(content)
  if (m1) return m1[1].trim()

  // 2. <h1>...</h1>
  const h1Re = /<h1[^>]*>([^<]+)<\/h1>/i
  const m2 = h1Re.exec(content)
  if (m2) {
    const text = m2[1].trim()
    if (text) return text
  }

  // 3. const TITLE = "..."
  const titleConstRe = /const\s+TITLE\s*=\s*['"]([^'"]+)['"]/i
  const m3 = titleConstRe.exec(content)
  if (m3) return m3[1].trim()

  return null
}

// ─── Prisma Schema Parser ───────────────────────────────────────────────────

/**
 * Parse `prisma/schema.prisma` and extract every `model` block. Fields that
 * reference other models (non-scalar, non-enum types) are collected as
 * relations. `@@index` and `@@unique` directives are collected as indexes.
 *
 * Never throws — returns [] on parse failure.
 */
function parsePrismaSchema(content: string): PrismaModelInfo[] {
  const models: PrismaModelInfo[] = []
  if (!content) return models

  // Match `model Name { ... }` blocks. Prisma model bodies don't nest
  // braces, so a non-greedy `[^}]*` is safe.
  const modelRe = /model\s+([A-Za-z_][\w]*)\s*\{([^}]*)\}/g
  let mm: RegExpExecArray | null

  while ((mm = modelRe.exec(content)) !== null) {
    const modelName = mm[1]
    const body = mm[2]
    const fields: PrismaModelInfo['fields'] = []
    const relations: string[] = []
    const indexes: string[] = []

    const lines = body.split('\n')
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line) continue
      if (line.startsWith('//')) continue
      if (line.startsWith('@@')) {
        // Block-level directive: @@index, @@unique, @@map, @@id
        const m = line.match(/@@\w+/)
        if (m) indexes.push(line)
        continue
      }
      if (line.startsWith('}')) continue

      // Field definition: `name  Type?  @attrs...`
      // First token = field name, second token = type (with optional `?` or `[]`)
      const tokens = line.split(/\s+/).filter(Boolean)
      if (tokens.length < 2) continue
      const fieldName = tokens[0]
      const rawType = tokens[1]

      // Strip `?` / `[]` modifiers to get the base type
      const baseType = rawType.replace(/[?\[\]]/g, '')
      const isRequired = !rawType.endsWith('?') && !rawType.includes('[]')
      const isUnique = line.includes('@unique')

      // Skip non-field lines (e.g. enum-style, but enums are handled elsewhere)
      // Skip Prisma block attribute lines that didn't start with @@
      if (fieldName.startsWith('@')) continue

      fields.push({
        name: fieldName,
        type: rawType,
        isRequired,
        isUnique,
      })

      // Relations: type is not a Prisma scalar AND starts uppercase
      const isRelation =
        !PRISMA_SCALAR_TYPES.has(baseType) &&
        /^[A-Z]/.test(baseType) &&
        baseType !== 'Unsupported'
      if (isRelation && !relations.includes(baseType)) {
        relations.push(baseType)
      }
    }

    models.push({ name: modelName, fields, relations, indexes })
  }

  return models
}

// ─── File-level processors (each wrapped in try/catch) ──────────────────────

interface ScannedFile {
  absPath: string
  content: string | null
}

/**
 * Process a single source file and return the appropriate descriptor(s).
 * A file can produce multiple descriptors (e.g. a `route.ts` is an API route
 * AND a lib). For our purposes:
 *   - API routes (path under /api/ AND filename is `route.ts`) → APIRouteInfo
 *   - Pages (filename is `page.tsx`) → PageRouteInfo
 *   - Files in src/components → ComponentInfo (component)
 *   - Files in src/hooks → ComponentInfo (hook)
 *   - Files in src/lib → ComponentInfo (lib)
 *   - Files in src/app (non-route, non-page, e.g. layouts) → ComponentInfo
 */
async function processSourceFile(
  sf: ScannedFile,
): Promise<{
  apiRoute?: APIRouteInfo
  page?: PageRouteInfo
  component?: ComponentInfo
}> {
  const { absPath, content } = sf
  if (content === null) return {}

  const relPath = toRelativePath(absPath)
  const baseName = path.basename(absPath)
  const ext = path.extname(baseName)
  const name = baseName.slice(0, baseName.length - ext.length)
  const isClient = isClientComponent(content)
  const lineCount = countLines(content)
  const exports = extractExports(content)

  const result: {
    apiRoute?: APIRouteInfo
    page?: PageRouteInfo
    component?: ComponentInfo
  } = {}

  // Determine classification
  const isApiRoute =
    relPath.includes('/api/') && baseName.startsWith('route.')
  const isPage =
    baseName.startsWith('page.') &&
    (relPath.startsWith('src/app/') || relPath.startsWith('app/'))

  if (isApiRoute) {
    result.apiRoute = {
      path: apiFilePathToRoute(absPath),
      method: detectHttpMethods(content),
      file: relPath,
      hasAuth: detectAuth(content),
      lineCount,
    }
  }

  if (isPage) {
    result.page = {
      path: pageFilePathToRoute(absPath),
      file: relPath,
      title: extractPageTitle(content),
      isClient,
    }
  }

  // Classify as component / hook / lib / api by directory
  let type: ComponentInfo['type'] | null = null
  if (relPath.startsWith('src/components/')) type = 'component'
  else if (relPath.startsWith('src/hooks/')) type = 'hook'
  else if (relPath.startsWith('src/lib/')) type = 'lib'
  else if (relPath.startsWith('src/app/api/') && baseName.startsWith('route.'))
    type = 'api'
  else if (relPath.startsWith('src/app/') && baseName.startsWith('page.'))
    type = 'page'

  if (type) {
    result.component = {
      name,
      path: relPath,
      type,
      isClient,
      lineCount,
      exports,
    }
  }

  return result
}

// ─── Main public API ────────────────────────────────────────────────────────

/**
 * Scan the project source tree and return a structured snapshot.
 *
 * Never throws. On partial failures, returns whatever was successfully scanned
 * with the corresponding arrays simply omitting the failed files.
 */
export async function scanCodebase(): Promise<ScanResult> {
  const timestamp = new Date()

  // Collect file lists from each scanned root.
  const fileLists = await Promise.all([
    walkDirectory(APP_DIR),
    walkDirectory(COMPONENTS_DIR),
    walkDirectory(HOOKS_DIR),
    walkDirectory(LIB_DIR),
  ])
  const allFiles = Array.from(new Set(fileLists.flat()))

  // Read all file contents in parallel (bounded implicitly by the event loop).
  const readResults: ScannedFile[] = await Promise.all(
    allFiles.map(async (absPath) => ({
      absPath,
      content: await readFileSafe(absPath),
    })),
  )

  // Process each file (CPU-bound regex work — parallel via Promise.all).
  const components: ComponentInfo[] = []
  const apiRoutes: APIRouteInfo[] = []
  const pages: PageRouteInfo[] = []
  const hooks: ComponentInfo[] = []
  const libs: ComponentInfo[] = []

  const processed = await Promise.all(
    readResults.map((sf) =>
      processSourceFile(sf).catch(() => ({} as Awaited<ReturnType<typeof processSourceFile>>)),
    ),
  )

  for (const r of processed) {
    if (!r) continue
    if (r.apiRoute) apiRoutes.push(r.apiRoute)
    if (r.page) pages.push(r.page)
    if (r.component) {
      switch (r.component.type) {
        case 'component':
          components.push(r.component)
          break
        case 'hook':
          hooks.push(r.component)
          break
        case 'lib':
          libs.push(r.component)
          break
        default:
          // 'page' and 'api' typed components are tracked via the dedicated
          // arrays above; we don't duplicate them into `components`.
          break
      }
    }
  }

  // Parse Prisma schema (separate path).
  let prismaModels: PrismaModelInfo[] = []
  try {
    const schemaContent = await readFileSafe(PRISMA_SCHEMA_PATH)
    if (schemaContent !== null) {
      prismaModels = parsePrismaSchema(schemaContent)
    }
  } catch {
    prismaModels = []
  }

  // De-duplicate API routes (a single route file could be matched twice if
  // walkDirectory visits the same path via two roots — unlikely but safe).
  const seenApi = new Set<string>()
  const dedupedApi = apiRoutes.filter((r) => {
    if (seenApi.has(r.file)) return false
    seenApi.add(r.file)
    return true
  })

  const seenPage = new Set<string>()
  const dedupedPages = pages.filter((p) => {
    if (seenPage.has(p.file)) return false
    seenPage.add(p.file)
    return true
  })

  return {
    timestamp,
    components,
    apiRoutes: dedupedApi,
    prismaModels,
    pages: dedupedPages,
    hooks,
    libs,
    stats: {
      totalComponents: components.length,
      totalAPIRoutes: dedupedApi.length,
      totalPrismaModels: prismaModels.length,
      totalPages: dedupedPages.length,
      totalHooks: hooks.length,
      totalLibs: libs.length,
    },
  }
}

/**
 * Scan the codebase AND persist the result into the `CodebaseSnapshot` table.
 *
 * The database schema provides three JSON columns (components, apiRoutes,
 * prismaModels) plus count columns for every category. Pages, hooks, and libs
 * arrays are NOT persisted as JSON in the current schema — only their counts
 * are recorded. (The in-memory ScanResult returned by this function still
 * contains all six arrays for caller use.)
 *
 * Never throws — on DB failure the scan result is still returned.
 */
export async function scanAndSaveSnapshot(): Promise<ScanResult> {
  const result = await scanCodebase()

  try {
    // Lazy import to avoid forcing a DB connection when callers only need
    // `scanCodebase()`. Also avoids loading Prisma in build-time contexts
    // where DATABASE_URL may not be available.
    const { db } = await import('@/lib/db')

    await db.codebaseSnapshot.create({
      data: {
        timestamp: result.timestamp,
        totalComponents: result.stats.totalComponents,
        totalAPIRoutes: result.stats.totalAPIRoutes,
        totalPrismaModels: result.stats.totalPrismaModels,
        totalPages: result.stats.totalPages,
        totalHooks: result.stats.totalHooks,
        totalLibs: result.stats.totalLibs,
        // Lint / TS quality stats are intentionally 0 here — they are
        // populated by a separate quality-pipeline task. Keeping the column
        // defaults intact would also work, but explicit zeros make the intent
        // clearer.
        lintErrors: 0,
        lintWarnings: 0,
        typescriptErrors: 0,
        components: JSON.stringify(result.components),
        apiRoutes: JSON.stringify(result.apiRoutes),
        prismaModels: JSON.stringify(result.prismaModels),
      },
    })
  } catch (err) {
    // Surface the failure in logs but never break the caller — the in-memory
    // scan result is still useful and the DB write can be retried later.
    console.error('[codebase-scanner] Failed to persist snapshot:', err)
  }

  return result
}
