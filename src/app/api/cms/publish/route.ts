import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/cms/publish
 * Publishes AI-generated content to a client's WordPress site
 *
 * Body: {
 *   projectId: string
 *   articleData: {
 *     title: string
 *     html_content: string
 *     meta_description: string
 *     publish_immediately?: boolean  // default: false (draft mode for Co-Pilot)
 *   }
 * }
 */

interface CMSCredentials {
  platform: string
  siteUrl: string
  wp_username: string
  wp_application_password: string
}

interface PublishRequestBody {
  projectId: string
  articleData: {
    title: string
    html_content: string
    meta_description: string
    publish_immediately?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequestBody = await request.json()
    const { projectId, articleData } = body

    // ── Validate required fields ──────────────────────────────────────
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      )
    }

    if (!articleData?.title || !articleData?.html_content) {
      return NextResponse.json(
        { success: false, error: 'articleData must include title and html_content' },
        { status: 400 }
      )
    }

    // ── Look up the project and its CMS credentials ──────────────────
    const project = await db.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (!project.cmsCredentials) {
      return NextResponse.json(
        { success: false, error: 'WordPress integration not configured' },
        { status: 400 }
      )
    }

    // ── Parse CMS credentials ────────────────────────────────────────
    let credentials: CMSCredentials
    try {
      credentials = JSON.parse(project.cmsCredentials) as CMSCredentials
    } catch {
      console.error('[CMS Publish] Failed to parse cmsCredentials for project:', projectId)
      return NextResponse.json(
        { success: false, error: 'Invalid CMS credentials stored for this project' },
        { status: 500 }
      )
    }

    if (credentials.platform !== 'wordpress') {
      return NextResponse.json(
        { success: false, error: `Publishing to ${credentials.platform} is not yet supported` },
        { status: 400 }
      )
    }

    if (!credentials.siteUrl || !credentials.wp_username || !credentials.wp_application_password) {
      return NextResponse.json(
        { success: false, error: 'WordPress credentials are incomplete' },
        { status: 400 }
      )
    }

    // ── Create Base64 auth header ────────────────────────────────────
    const authString = Buffer.from(
      `${credentials.wp_username}:${credentials.wp_application_password}`
    ).toString('base64')

    // ── Determine publish status ─────────────────────────────────────
    const publishStatus = articleData.publish_immediately === true ? 'publish' : 'draft'

    // ── Build WordPress REST API URL ─────────────────────────────────
    const siteUrl = credentials.siteUrl.replace(/\/+$/, '') // trim trailing slashes
    const wpApiUrl = `${siteUrl}/wp-json/wp/v2/posts`

    console.log(`[CMS Publish] Publishing to WordPress: ${wpApiUrl} (status: ${publishStatus})`)

    // ── POST to WordPress REST API with 15-second timeout ────────────
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

      console.error('[CMS Publish] Fetch error:', message)

      // Create a failed publish log entry
      await db.cMSPublishLog.create({
        data: {
          projectId,
          agentId: 'cms-publisher',
          contentType: 'blog_post',
          title: articleData.title,
          status: 'failed',
        },
      })

      return NextResponse.json(
        { success: false, error: message },
        { status: 502 }
      )
    } finally {
      clearTimeout(timeoutId)
    }

    // ── Handle WordPress response ────────────────────────────────────
    if (!wpResponse.ok) {
      let errorDetail: string
      try {
        const errorBody = await wpResponse.json()
        errorDetail =
          errorBody?.message ||
          errorBody?.code ||
          `WordPress returned status ${wpResponse.status}`
      } catch {
        errorDetail = `WordPress returned status ${wpResponse.status}`
      }

      console.error('[CMS Publish] WordPress error:', wpResponse.status, errorDetail)

      // Create a failed publish log entry
      await db.cMSPublishLog.create({
        data: {
          projectId,
          agentId: 'cms-publisher',
          contentType: 'blog_post',
          title: articleData.title,
          status: 'failed',
        },
      })

      if (wpResponse.status === 401 || wpResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: `Authentication failed: ${errorDetail}` },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { success: false, error: `WordPress API error: ${errorDetail}` },
        { status: 502 }
      )
    }

    // ── Parse successful response ────────────────────────────────────
    const postData = await wpResponse.json() as { id?: number; link?: string }
    const postUrl = postData.link || ''
    const externalPostId = postData.id?.toString() || null

    console.log(`[CMS Publish] Successfully published post ID ${externalPostId} at ${postUrl}`)

    // ── Create a publish log entry ───────────────────────────────────
    await db.cMSPublishLog.create({
      data: {
        projectId,
        agentId: 'cms-publisher',
        contentType: 'blog_post',
        title: articleData.title,
        externalPostId,
        postUrl,
        status: publishStatus === 'publish' ? 'published' : 'draft',
        publishedAt: publishStatus === 'publish' ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      postUrl,
      postId: externalPostId,
      status: publishStatus,
    })
  } catch (error) {
    console.error('[CMS Publish] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while publishing' },
      { status: 500 }
    )
  }
}
