/**
 * WordPress REST API Integration for Auto-Execute
 *
 * Handles authentication via Application Passwords and provides methods for:
 * - Updating posts (content, meta, schema)
 * - Updating post meta tags
 * - Injecting/updating schema markup
 * - Updating robots.txt / llms.txt via the SeoSights plugin endpoint
 * - Creating redirects
 * - Rolling back changes
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WordPressCredentials {
  siteUrl: string
  username: string
  applicationPassword: string
}

export interface WordPressPost {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  link: string
  status: string
  meta?: Record<string, unknown>
}

export interface CMSExecutionResult {
  success: boolean
  platform: 'wordpress'
  actionType: string
  responseData?: Record<string, unknown>
  rollbackPayload?: Record<string, unknown>
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAuthHeader(credentials: WordPressCredentials): string {
  return `Basic ${Buffer.from(`${credentials.username}:${credentials.applicationPassword}`).toString('base64')}`
}

function buildApiUrl(credentials: WordPressCredentials, path: string): string {
  const base = credentials.siteUrl.replace(/\/+$/, '')
  return `${base}/wp-json/${path.replace(/^\/+/, '')}`
}

async function wpRequest(
  credentials: WordPressCredentials,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  timeoutMs = 15_000
): Promise<{ status: number; data: Record<string, unknown> }> {
  const url = buildApiUrl(credentials, path)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers: Record<string, string> = {
      'Authorization': buildAuthHeader(credentials),
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    let data: Record<string, unknown> = {}
    try {
      data = await response.json() as Record<string, unknown>
    } catch {
      // Non-JSON response (e.g., 204 No Content)
    }

    return { status: response.status, data }
  } catch (fetchError) {
    if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
      throw new Error('WordPress request timed out after 15 seconds')
    }
    throw new Error('Failed to connect to WordPress site')
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Action Mappers ────────────────────────────────────────────────────────────

/**
 * Maps an ActionItem actionType to an AutoExecution actionType
 */
export function mapActionTypeToExecutionType(actionType: string): string {
  const mapping: Record<string, string> = {
    fix_schema: 'schema_update',
    content_update: 'content_publish',
    create_faq: 'content_publish',
    add_author: 'meta_tag',
    create_llms_txt: 'robots_update',
    crawl_fix: 'robots_update',
    redirect_create: 'redirect_create',
  }
  return mapping[actionType] || 'content_publish'
}

// ── Core Execution Functions ──────────────────────────────────────────────────

/**
 * Execute a schema update on WordPress.
 * Adds or replaces JSON-LD schema markup in a post's content or meta.
 */
export async function executeSchemaUpdate(
  credentials: WordPressCredentials,
  payload: {
    postId?: number
    postSlug?: string
    schemaJson: string
    schemaType: string
  }
): Promise<CMSExecutionResult> {
  try {
    let postId = payload.postId

    // If no postId, look up by slug
    if (!postId && payload.postSlug) {
      const slugResult = await wpRequest(
        credentials,
        'GET',
        `wp/v2/posts?slug=${encodeURIComponent(payload.postSlug)}&_fields=id,title,content,meta`
      )
      const posts = slugResult.data as unknown as WordPressPost[]
      if (!Array.isArray(posts) || posts.length === 0) {
        return {
          success: false,
          platform: 'wordpress',
          actionType: 'schema_update',
          error: `Post not found with slug: ${payload.postSlug}`,
        }
      }
      postId = posts[0].id
    }

    if (!postId) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'schema_update',
        error: 'postId or postSlug is required',
      }
    }

    // Fetch current post to get existing content for rollback
    const currentPost = await wpRequest(
      credentials,
      'GET',
      `wp/v2/posts/${postId}?_fields=id,content,meta`
    )

    if (currentPost.status !== 200) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'schema_update',
        error: `Failed to fetch post ${postId}: HTTP ${currentPost.status}`,
      }
    }

    const existingContent = (currentPost.data as Record<string, unknown>).content as string | { rendered: string } | undefined
    const contentStr = typeof existingContent === 'string'
      ? existingContent
      : existingContent && typeof existingContent === 'object' && 'rendered' in existingContent
        ? existingContent.rendered
        : ''

    // Build schema script tag
    const schemaScript = `<script type="application/ld+json">${payload.schemaJson}</script>`

    // Remove any existing schema of the same type
    const schemaTypePattern = new RegExp(
      `<script type="application/ld\\+json">[^<]*"@type"\\s*:\\s*"${payload.schemaType}"[^<]*<\\/script>`,
      'g'
    )
    const cleanedContent = contentStr.replace(schemaTypePattern, '')

    // Append the new schema
    const updatedContent = cleanedContent + '\n' + schemaScript

    // Update the post
    const updateResult = await wpRequest(credentials, 'PUT', `wp/v2/posts/${postId}`, {
      content: updatedContent,
    })

    if (updateResult.status !== 200) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'schema_update',
        error: `Failed to update post: HTTP ${updateResult.status}`,
      }
    }

    return {
      success: true,
      platform: 'wordpress',
      actionType: 'schema_update',
      responseData: {
        postId,
        schemaType: payload.schemaType,
        updatedContent: updatedContent.substring(0, 500) + '...',
      },
      rollbackPayload: {
        postId,
        originalContent: contentStr,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType: 'schema_update',
      error: err instanceof Error ? err.message : 'Unknown error during schema update',
    }
  }
}

/**
 * Execute a meta tag update on WordPress.
 * Updates meta description, title, or other meta fields via Yoast/SEO plugin or post meta.
 */
export async function executeMetaTagUpdate(
  credentials: WordPressCredentials,
  payload: {
    postId?: number
    postSlug?: string
    metaKey: string
    metaValue: string
  }
): Promise<CMSExecutionResult> {
  try {
    let postId = payload.postId

    if (!postId && payload.postSlug) {
      const slugResult = await wpRequest(
        credentials,
        'GET',
        `wp/v2/posts?slug=${encodeURIComponent(payload.postSlug)}&_fields=id`
      )
      const posts = slugResult.data as unknown as { id: number }[]
      if (!Array.isArray(posts) || posts.length === 0) {
        return {
          success: false,
          platform: 'wordpress',
          actionType: 'meta_tag',
          error: `Post not found with slug: ${payload.postSlug}`,
        }
      }
      postId = posts[0].id
    }

    if (!postId) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'meta_tag',
        error: 'postId or postSlug is required',
      }
    }

    // Fetch current meta for rollback
    const currentPost = await wpRequest(
      credentials,
      'GET',
      `wp/v2/posts/${postId}?_fields=id,meta`
    )

    if (currentPost.status !== 200) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'meta_tag',
        error: `Failed to fetch post ${postId}: HTTP ${currentPost.status}`,
      }
    }

    const existingMeta = ((currentPost.data as Record<string, unknown>).meta || {}) as Record<string, unknown>
    const previousValue = existingMeta[payload.metaKey]

    // Update meta via REST API
    const updateResult = await wpRequest(credentials, 'PUT', `wp/v2/posts/${postId}`, {
      meta: { [payload.metaKey]: payload.metaValue },
    })

    if (updateResult.status !== 200) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'meta_tag',
        error: `Failed to update meta: HTTP ${updateResult.status}`,
      }
    }

    return {
      success: true,
      platform: 'wordpress',
      actionType: 'meta_tag',
      responseData: {
        postId,
        metaKey: payload.metaKey,
        metaValue: payload.metaValue,
      },
      rollbackPayload: {
        postId,
        metaKey: payload.metaKey,
        previousValue: previousValue ?? null,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType: 'meta_tag',
      error: err instanceof Error ? err.message : 'Unknown error during meta tag update',
    }
  }
}

/**
 * Execute a content publish on WordPress.
 * Creates a new post or updates an existing one.
 */
export async function executeContentPublish(
  credentials: WordPressCredentials,
  payload: {
    postId?: number
    title: string
    content: string
    excerpt?: string
    status?: 'draft' | 'publish'
    postType?: string
  }
): Promise<CMSExecutionResult> {
  try {
    const publishStatus = payload.status || 'draft'

    if (payload.postId) {
      // Update existing post
      const currentPost = await wpRequest(
        credentials,
        'GET',
        `wp/v2/posts/${payload.postId}?_fields=id,title,content,excerpt,status`
      )

      if (currentPost.status !== 200) {
        return {
          success: false,
          platform: 'wordpress',
          actionType: 'content_publish',
          error: `Post ${payload.postId} not found: HTTP ${currentPost.status}`,
        }
      }

      const originalData = currentPost.data as Record<string, unknown>

      const updateResult = await wpRequest(credentials, 'PUT', `wp/v2/posts/${payload.postId}`, {
        title: payload.title,
        content: payload.content,
        excerpt: payload.excerpt || '',
        status: publishStatus,
      })

      if (updateResult.status !== 200) {
        return {
          success: false,
          platform: 'wordpress',
          actionType: 'content_publish',
          error: `Failed to update post: HTTP ${updateResult.status}`,
        }
      }

      const updatedData = updateResult.data as Record<string, unknown>

      return {
        success: true,
        platform: 'wordpress',
        actionType: 'content_publish',
        responseData: {
          postId: payload.postId,
          postUrl: (updatedData.link as string) || '',
          status: publishStatus,
          action: 'updated',
        },
        rollbackPayload: {
          postId: payload.postId,
          originalTitle: (originalData.title as string) || '',
          originalContent: typeof originalData.content === 'object' && originalData.content !== null && 'rendered' in (originalData.content as Record<string, unknown>)
            ? ((originalData.content as { rendered: string }).rendered)
            : String(originalData.content || ''),
          originalExcerpt: typeof originalData.excerpt === 'object' && originalData.excerpt !== null && 'rendered' in (originalData.excerpt as Record<string, unknown>)
            ? ((originalData.excerpt as { rendered: string }).rendered)
            : String(originalData.excerpt || ''),
          originalStatus: (originalData.status as string) || 'draft',
        },
      }
    }

    // Create new post
    const createResult = await wpRequest(credentials, 'POST', 'wp/v2/posts', {
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt || '',
      status: publishStatus,
      comment_status: 'open',
    })

    if (createResult.status !== 200 && createResult.status !== 201) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'content_publish',
        error: `Failed to create post: HTTP ${createResult.status}`,
      }
    }

    const newData = createResult.data as Record<string, unknown>

    return {
      success: true,
      platform: 'wordpress',
      actionType: 'content_publish',
      responseData: {
        postId: newData.id,
        postUrl: (newData.link as string) || '',
        status: publishStatus,
        action: 'created',
      },
      rollbackPayload: {
        postId: newData.id,
        action: 'delete',
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType: 'content_publish',
      error: err instanceof Error ? err.message : 'Unknown error during content publish',
    }
  }
}

/**
 * Execute a robots.txt or llms.txt update on WordPress.
 * Uses the SeoSights WordPress plugin custom endpoint.
 */
export async function executeRobotsUpdate(
  credentials: WordPressCredentials,
  payload: {
    fileType: 'robots_txt' | 'llms_txt'
    content: string
  }
): Promise<CMSExecutionResult> {
  try {
    // Fetch current file content for rollback
    let originalContent = ''
    try {
      const siteUrl = credentials.siteUrl.replace(/\/+$/, '')
      const fileUrl = payload.fileType === 'robots_txt'
        ? `${siteUrl}/robots.txt`
        : `${siteUrl}/llms.txt`
      const currentResponse = await fetch(fileUrl, { signal: AbortSignal.timeout(10_000) })
      if (currentResponse.ok) {
        originalContent = await currentResponse.text()
      }
    } catch {
      // File may not exist yet, that's ok
    }

    // Update via SeoSights plugin endpoint
    const updateResult = await wpRequest(
      credentials,
      'POST',
      'seosights/v1/update-file',
      {
        file_type: payload.fileType,
        content: payload.content,
      }
    )

    if (updateResult.status !== 200) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'robots_update',
        error: `Failed to update ${payload.fileType}: HTTP ${updateResult.status}`,
      }
    }

    return {
      success: true,
      platform: 'wordpress',
      actionType: 'robots_update',
      responseData: {
        fileType: payload.fileType,
        contentLength: payload.content.length,
      },
      rollbackPayload: {
        fileType: payload.fileType,
        originalContent,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType: 'robots_update',
      error: err instanceof Error ? err.message : 'Unknown error during robots update',
    }
  }
}

/**
 * Execute a redirect creation on WordPress.
 * Uses the SeoSights WordPress plugin custom endpoint for redirect management.
 */
export async function executeRedirectCreate(
  credentials: WordPressCredentials,
  payload: {
    fromPath: string
    toUrl: string
    statusCode?: number // 301 (default) or 302
  }
): Promise<CMSExecutionResult> {
  try {
    const statusCode = payload.statusCode || 301

    const result = await wpRequest(
      credentials,
      'POST',
      'seosights/v1/redirects',
      {
        from: payload.fromPath,
        to: payload.toUrl,
        status_code: statusCode,
      }
    )

    if (result.status !== 200 && result.status !== 201) {
      return {
        success: false,
        platform: 'wordpress',
        actionType: 'redirect_create',
        error: `Failed to create redirect: HTTP ${result.status}`,
      }
    }

    const data = result.data as Record<string, unknown>

    return {
      success: true,
      platform: 'wordpress',
      actionType: 'redirect_create',
      responseData: {
        redirectId: data.id || data.redirect_id,
        fromPath: payload.fromPath,
        toUrl: payload.toUrl,
        statusCode,
      },
      rollbackPayload: {
        redirectId: data.id || data.redirect_id,
        action: 'delete_redirect',
        fromPath: payload.fromPath,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType: 'redirect_create',
      error: err instanceof Error ? err.message : 'Unknown error during redirect creation',
    }
  }
}

// ── Rollback Functions ────────────────────────────────────────────────────────

/**
 * Roll back a WordPress change using the rollback payload.
 */
export async function rollbackWordPress(
  credentials: WordPressCredentials,
  actionType: string,
  rollbackPayload: Record<string, unknown>
): Promise<CMSExecutionResult> {
  try {
    switch (actionType) {
      case 'schema_update': {
        const postId = rollbackPayload.postId as number
        const originalContent = rollbackPayload.originalContent as string
        if (!postId || originalContent === undefined) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'schema_update',
            error: 'Missing rollback data: postId or originalContent',
          }
        }
        const result = await wpRequest(credentials, 'PUT', `wp/v2/posts/${postId}`, {
          content: originalContent,
        })
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'schema_update',
            error: `Rollback failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'wordpress',
          actionType: 'schema_update',
          responseData: { postId, rolledBack: true },
        }
      }

      case 'meta_tag': {
        const postId = rollbackPayload.postId as number
        const metaKey = rollbackPayload.metaKey as string
        const previousValue = rollbackPayload.previousValue
        if (!postId || !metaKey) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'meta_tag',
            error: 'Missing rollback data: postId or metaKey',
          }
        }
        const result = await wpRequest(credentials, 'PUT', `wp/v2/posts/${postId}`, {
          meta: { [metaKey]: previousValue ?? '' },
        })
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'meta_tag',
            error: `Rollback failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'wordpress',
          actionType: 'meta_tag',
          responseData: { postId, metaKey, rolledBack: true },
        }
      }

      case 'content_publish': {
        const action = rollbackPayload.action as string
        const postId = rollbackPayload.postId as number

        if (action === 'delete') {
          // Delete the newly created post
          const result = await wpRequest(credentials, 'DELETE', `wp/v2/posts/${postId}`, {
            force: true,
          })
          if (result.status !== 200) {
            return {
              success: false,
              platform: 'wordpress',
              actionType: 'content_publish',
              error: `Rollback (delete) failed: HTTP ${result.status}`,
            }
          }
          return {
            success: true,
            platform: 'wordpress',
            actionType: 'content_publish',
            responseData: { postId, action: 'deleted', rolledBack: true },
          }
        }

        // Restore original content
        const originalTitle = rollbackPayload.originalTitle as string
        const originalContent = rollbackPayload.originalContent as string
        const originalExcerpt = rollbackPayload.originalExcerpt as string
        const originalStatus = rollbackPayload.originalStatus as string

        const result = await wpRequest(credentials, 'PUT', `wp/v2/posts/${postId}`, {
          title: originalTitle,
          content: originalContent,
          excerpt: originalExcerpt,
          status: originalStatus,
        })
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'content_publish',
            error: `Rollback (restore) failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'wordpress',
          actionType: 'content_publish',
          responseData: { postId, action: 'restored', rolledBack: true },
        }
      }

      case 'robots_update': {
        const fileType = rollbackPayload.fileType as string
        const originalContent = rollbackPayload.originalContent as string
        const result = await wpRequest(credentials, 'POST', 'seosights/v1/update-file', {
          file_type: fileType,
          content: originalContent,
        })
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'wordpress',
            actionType: 'robots_update',
            error: `Rollback failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'wordpress',
          actionType: 'robots_update',
          responseData: { fileType, rolledBack: true },
        }
      }

      case 'redirect_create': {
        const action = rollbackPayload.action as string
        const redirectId = rollbackPayload.redirectId

        if (action === 'delete_redirect' && redirectId) {
          const result = await wpRequest(
            credentials,
            'DELETE',
            `seosights/v1/redirects/${redirectId}`,
            { force: true }
          )
          if (result.status !== 200) {
            return {
              success: false,
              platform: 'wordpress',
              actionType: 'redirect_create',
              error: `Rollback (delete redirect) failed: HTTP ${result.status}`,
            }
          }
          return {
            success: true,
            platform: 'wordpress',
            actionType: 'redirect_create',
            responseData: { redirectId, action: 'deleted', rolledBack: true },
          }
        }

        return {
          success: false,
          platform: 'wordpress',
          actionType: 'redirect_create',
          error: 'Invalid rollback payload for redirect',
        }
      }

      default:
        return {
          success: false,
          platform: 'wordpress',
          actionType,
          error: `Unknown action type for rollback: ${actionType}`,
        }
    }
  } catch (err) {
    return {
      success: false,
      platform: 'wordpress',
      actionType,
      error: err instanceof Error ? err.message : 'Unknown error during rollback',
    }
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Main dispatcher: executes an action on WordPress based on actionType.
 */
export async function executeWordPressAction(
  credentials: WordPressCredentials,
  actionType: string,
  payload: Record<string, unknown>
): Promise<CMSExecutionResult> {
  switch (actionType) {
    case 'schema_update':
      return executeSchemaUpdate(credentials, payload as Parameters<typeof executeSchemaUpdate>[1])

    case 'meta_tag':
      return executeMetaTagUpdate(credentials, payload as Parameters<typeof executeMetaTagUpdate>[1])

    case 'content_publish':
      return executeContentPublish(credentials, payload as Parameters<typeof executeContentPublish>[1])

    case 'robots_update':
      return executeRobotsUpdate(credentials, payload as Parameters<typeof executeRobotsUpdate>[1])

    case 'redirect_create':
      return executeRedirectCreate(credentials, payload as Parameters<typeof executeRedirectCreate>[1])

    default:
      return {
        success: false,
        platform: 'wordpress',
        actionType,
        error: `Unsupported WordPress action type: ${actionType}`,
      }
  }
}
