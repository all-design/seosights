/**
 * CMS Publishing Utility — WordPress REST API Integration
 *
 * Publishes AI-generated content (blog posts, pages, robots.txt updates, llms.txt)
 * directly to a client's WordPress site via the REST API.
 *
 * Used by:
 * - Auto-Pilot mode (agents auto-publish weekly)
 * - Co-Pilot mode (after user clicks "Approve & Publish")
 * - CMS Publish API route (/api/cms/publish)
 */

import { db } from '@/lib/db'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CMSCredentials {
  platform: string
  siteUrl: string
  wp_username: string
  wp_application_password: string
}

interface ArticleData {
  title: string
  html_content: string
  meta_description: string
  publish_immediately?: boolean // default: false (draft for Co-Pilot)
}

interface PublishResult {
  success: boolean
  postUrl?: string
  postId?: string
  status?: string
  error?: string
}

// ── Main Function ─────────────────────────────────────────────────────────────

/**
 * publishToWordPress — Sends generated content to client's WordPress site
 *
 * @param projectId - The project ID (used to look up CMS credentials)
 * @param articleData - The article data to publish
 * @param agentId - Which agent generated the content (for logging)
 * @returns PublishResult with success status and post URL or error
 */
export async function publishToWordPress(
  projectId: string,
  articleData: ArticleData,
  agentId: string = 'cms-publisher'
): Promise<PublishResult> {
  // 1. Fetch CMS credentials from projects table
  const project = await db.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  if (!project.cmsCredentials) {
    return { success: false, error: 'WordPress integration not configured for this project' }
  }

  // 2. Parse CMS credentials
  let credentials: CMSCredentials
  try {
    credentials = JSON.parse(project.cmsCredentials) as CMSCredentials
  } catch {
    console.error('[cms-publish] Failed to parse cmsCredentials for project:', projectId)
    return { success: false, error: 'Invalid CMS credentials stored for this project' }
  }

  if (credentials.platform !== 'wordpress') {
    return { success: false, error: `Publishing to ${credentials.platform} is not yet supported` }
  }

  if (!credentials.siteUrl || !credentials.wp_username || !credentials.wp_application_password) {
    return { success: false, error: 'WordPress credentials are incomplete' }
  }

  // 3. Create Base64 auth string from wp_username + wp_application_password
  const authString = Buffer.from(
    `${credentials.wp_username}:${credentials.wp_application_password}`
  ).toString('base64')

  // 4. Determine publish status (draft for Co-Pilot, publish for Auto-Pilot)
  const publishStatus = articleData.publish_immediately === true ? 'publish' : 'draft'

  // 5. POST to {url}/wp-json/wp/v2/posts with title, content, status, excerpt
  const siteUrl = credentials.siteUrl.replace(/\/+$/, '')
  const wpApiUrl = `${siteUrl}/wp-json/wp/v2/posts`

  console.log(`[cms-publish] Publishing to WordPress: ${wpApiUrl} (status: ${publishStatus}, agent: ${agentId})`)

  // Timeout: 15000ms
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  let wpResponse: Response
  try {
    wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: articleData.title,
        content: articleData.html_content,
        excerpt: articleData.meta_description,
        status: publishStatus,
        comment_status: 'open', // Enable comments for engagement signals (SEO/AEO benefit)
      }),
      signal: controller.signal,
    })
  } catch (fetchError) {
    clearTimeout(timeoutId)
    const message =
      fetchError instanceof DOMException && fetchError.name === 'AbortError'
        ? 'Request to WordPress timed out after 15 seconds'
        : 'Failed to connect to WordPress site'

    console.error('[cms-publish] Fetch error:', message)

    // Log to cms_publish_logs table (failed)
    await db.cMSPublishLog.create({
      data: {
        projectId,
        agentId,
        contentType: 'blog_post',
        title: articleData.title,
        status: 'failed',
      },
    })

    return { success: false, error: message }
  } finally {
    clearTimeout(timeoutId)
  }

  // 6. Handle WordPress response
  if (!wpResponse.ok) {
    let errorDetail: string
    try {
      const errorBody = await wpResponse.json()
      errorDetail =
        (errorBody as Record<string, string>)?.message ||
        (errorBody as Record<string, string>)?.code ||
        `WordPress returned status ${wpResponse.status}`
    } catch {
      errorDetail = `WordPress returned status ${wpResponse.status}`
    }

    console.error('[cms-publish] WordPress error:', wpResponse.status, errorDetail)

    // Log to cms_publish_logs table (failed)
    await db.cMSPublishLog.create({
      data: {
        projectId,
        agentId,
        contentType: 'blog_post',
        title: articleData.title,
        status: 'failed',
      },
    })

    return { success: false, error: `WordPress API error: ${errorDetail}` }
  }

  // 7. Parse successful response
  const postData = (await wpResponse.json()) as { id?: number; link?: string }
  const postUrl = postData.link || ''
  const externalPostId = postData.id?.toString() || null

  console.log(`[cms-publish] Successfully published post ID ${externalPostId} at ${postUrl}`)

  // 8. Log to cms_publish_logs table (success)
  await db.cMSPublishLog.create({
    data: {
      projectId,
      agentId,
      contentType: 'blog_post',
      title: articleData.title,
      externalPostId,
      postUrl,
      status: publishStatus === 'publish' ? 'published' : 'draft',
      publishedAt: publishStatus === 'publish' ? new Date() : null,
    },
  })

  // 9. Return success
  return {
    success: true,
    postUrl,
    postId: externalPostId || undefined,
    status: publishStatus,
  }
}

/**
 * publishTechnicalUpdate — Sends robots.txt or llms.txt updates via WordPress plugin endpoint
 *
 * This requires the seosights WordPress plugin to be installed on the client's site.
 * The plugin exposes a custom REST endpoint at /wp-json/seosights/v1/update-file
 *
 * @param projectId - The project ID
 * @param fileType - 'robots_txt' | 'llms_txt'
 * @param content - The file content to write
 * @param agentId - Which agent generated the update
 * @returns PublishResult with success status
 */
export async function publishTechnicalUpdate(
  projectId: string,
  fileType: 'robots_txt' | 'llms_txt',
  content: string,
  agentId: string = 'tech-schema-auditor'
): Promise<PublishResult> {
  const project = await db.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  if (!project.cmsCredentials) {
    return { success: false, error: 'WordPress integration not configured' }
  }

  let credentials: CMSCredentials
  try {
    credentials = JSON.parse(project.cmsCredentials) as CMSCredentials
  } catch {
    return { success: false, error: 'Invalid CMS credentials' }
  }

  const authString = Buffer.from(
    `${credentials.wp_username}:${credentials.wp_application_password}`
  ).toString('base64')

  const siteUrl = credentials.siteUrl.replace(/\/+$/, '')
  const wpApiUrl = `${siteUrl}/wp-json/seosights/v1/update-file`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  let wpResponse: Response
  try {
    wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_type: fileType,
        content,
      }),
      signal: controller.signal,
    })
  } catch (fetchError) {
    clearTimeout(timeoutId)
    const message =
      fetchError instanceof DOMException && fetchError.name === 'AbortError'
        ? 'Request to WordPress timed out after 15 seconds'
        : 'Failed to connect to WordPress site'

    await db.cMSPublishLog.create({
      data: {
        projectId,
        agentId,
        contentType: fileType === 'robots_txt' ? 'robots_update' : 'llms_txt',
        title: `${fileType} update`,
        status: 'failed',
      },
    })

    return { success: false, error: message }
  } finally {
    clearTimeout(timeoutId)
  }

  if (!wpResponse.ok) {
    await db.cMSPublishLog.create({
      data: {
        projectId,
        agentId,
        contentType: fileType === 'robots_txt' ? 'robots_update' : 'llms_txt',
        title: `${fileType} update`,
        status: 'failed',
      },
    })

    return { success: false, error: `WordPress returned status ${wpResponse.status}` }
  }

  await db.cMSPublishLog.create({
    data: {
      projectId,
      agentId,
      contentType: fileType === 'robots_txt' ? 'robots_update' : 'llms_txt',
      title: `${fileType} update`,
      status: 'published',
      publishedAt: new Date(),
    },
  })

  return { success: true, status: 'published' }
}
