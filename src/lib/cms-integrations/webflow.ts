/**
 * Webflow API Integration for Auto-Execute
 *
 * Handles authentication via API token and provides methods for:
 * - Updating collection items (content, meta, schema)
 * - Updating site-level settings (robots, redirects)
 * - Publishing changes
 * - Rolling back changes
 *
 * Webflow API v2 Reference: https://developers.webflow.com/data/docs
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WebflowCredentials {
  siteId: string
  apiToken: string
}

export interface WebflowCollectionItem {
  id: string
  cmsItemId?: string
  fieldData: Record<string, unknown>
  isArchived: boolean
  isDraft: boolean
}

export interface CMSExecutionResult {
  success: boolean
  platform: 'webflow'
  actionType: string
  responseData?: Record<string, unknown>
  rollbackPayload?: Record<string, unknown>
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildAuthHeader(credentials: WebflowCredentials): string {
  return `Bearer ${credentials.apiToken}`
}

async function webflowRequest(
  credentials: WebflowCredentials,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  timeoutMs = 15_000
): Promise<{ status: number; data: Record<string, unknown> }> {
  const baseUrl = 'https://api.webflow.com/v2'
  const url = `${baseUrl}/${path.replace(/^\/+/, '')}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers: Record<string, string> = {
      'Authorization': buildAuthHeader(credentials),
      'Content-Type': 'application/json',
      'Accept-Version': '2.0.0',
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
      // Non-JSON response
    }

    return { status: response.status, data }
  } catch (fetchError) {
    if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
      throw new Error('Webflow request timed out after 15 seconds')
    }
    throw new Error('Failed to connect to Webflow API')
  } finally {
    clearTimeout(timeoutId)
  }
}

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
 * Execute a schema update on Webflow.
 * Adds JSON-LD schema to a collection item's custom code field.
 */
export async function executeSchemaUpdate(
  credentials: WebflowCredentials,
  payload: {
    collectionId: string
    itemId: string
    schemaJson: string
    schemaType: string
    customCodeField?: string // default: 'schema-markup'
  }
): Promise<CMSExecutionResult> {
  try {
    const customCodeField = payload.customCodeField || 'schema-markup'

    // Fetch current item for rollback
    const currentItem = await webflowRequest(
      credentials,
      'GET',
      `collections/${payload.collectionId}/items/${payload.itemId}`
    )

    if (currentItem.status !== 200) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'schema_update',
        error: `Item not found: HTTP ${currentItem.status}`,
      }
    }

    const itemData = currentItem.data as Record<string, unknown>
    const fieldData = (itemData.fieldData || {}) as Record<string, unknown>
    const existingSchema = (fieldData[customCodeField] as string) || ''

    // Build new schema markup
    const schemaScript = `<script type="application/ld+json">${payload.schemaJson}</script>`

    // Remove existing schema of same type and append new
    const schemaTypePattern = new RegExp(
      `<script type="application/ld\\+json">[^<]*"@type"\\s*:\\s*"${payload.schemaType}"[^<]*<\\/script>`,
      'g'
    )
    const cleanedSchema = existingSchema.replace(schemaTypePattern, '')
    const updatedSchema = cleanedSchema + '\n' + schemaScript

    // Update the item
    const updateResult = await webflowRequest(
      credentials,
      'PATCH',
      `collections/${payload.collectionId}/items/${payload.itemId}`,
      {
        fieldData: {
          [customCodeField]: updatedSchema,
        },
        isDraft: false,
      }
    )

    if (updateResult.status !== 200) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'schema_update',
        error: `Failed to update item: HTTP ${updateResult.status}`,
      }
    }

    return {
      success: true,
      platform: 'webflow',
      actionType: 'schema_update',
      responseData: {
        collectionId: payload.collectionId,
        itemId: payload.itemId,
        schemaType: payload.schemaType,
      },
      rollbackPayload: {
        collectionId: payload.collectionId,
        itemId: payload.itemId,
        customCodeField,
        originalSchema: existingSchema,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType: 'schema_update',
      error: err instanceof Error ? err.message : 'Unknown error during schema update',
    }
  }
}

/**
 * Execute a meta tag update on Webflow.
 * Updates SEO fields on a collection item (meta title, meta description, og fields).
 */
export async function executeMetaTagUpdate(
  credentials: WebflowCredentials,
  payload: {
    collectionId: string
    itemId: string
    fieldKey: string
    fieldValue: string
  }
): Promise<CMSExecutionResult> {
  try {
    // Fetch current item for rollback
    const currentItem = await webflowRequest(
      credentials,
      'GET',
      `collections/${payload.collectionId}/items/${payload.itemId}`
    )

    if (currentItem.status !== 200) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'meta_tag',
        error: `Item not found: HTTP ${currentItem.status}`,
      }
    }

    const itemData = currentItem.data as Record<string, unknown>
    const fieldData = (itemData.fieldData || {}) as Record<string, unknown>
    const previousValue = (fieldData[payload.fieldKey] as string) || ''

    // Update the item
    const updateResult = await webflowRequest(
      credentials,
      'PATCH',
      `collections/${payload.collectionId}/items/${payload.itemId}`,
      {
        fieldData: {
          [payload.fieldKey]: payload.fieldValue,
        },
        isDraft: false,
      }
    )

    if (updateResult.status !== 200) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'meta_tag',
        error: `Failed to update meta: HTTP ${updateResult.status}`,
      }
    }

    return {
      success: true,
      platform: 'webflow',
      actionType: 'meta_tag',
      responseData: {
        collectionId: payload.collectionId,
        itemId: payload.itemId,
        fieldKey: payload.fieldKey,
        fieldValue: payload.fieldValue,
      },
      rollbackPayload: {
        collectionId: payload.collectionId,
        itemId: payload.itemId,
        fieldKey: payload.fieldKey,
        previousValue,
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType: 'meta_tag',
      error: err instanceof Error ? err.message : 'Unknown error during meta tag update',
    }
  }
}

/**
 * Execute a content publish on Webflow.
 * Creates or updates a collection item with content.
 */
export async function executeContentPublish(
  credentials: WebflowCredentials,
  payload: {
    collectionId: string
    itemId?: string
    name: string
    slug: string
    fieldData: Record<string, unknown>
    isDraft?: boolean
  }
): Promise<CMSExecutionResult> {
  try {
    if (payload.itemId) {
      // Update existing item — fetch current for rollback
      const currentItem = await webflowRequest(
        credentials,
        'GET',
        `collections/${payload.collectionId}/items/${payload.itemId}`
      )

      if (currentItem.status !== 200) {
        return {
          success: false,
          platform: 'webflow',
          actionType: 'content_publish',
          error: `Item not found: HTTP ${currentItem.status}`,
        }
      }

      const originalData = currentItem.data as Record<string, unknown>
      const originalFieldData = (originalData.fieldData || {}) as Record<string, unknown>

      // Update item
      const updateResult = await webflowRequest(
        credentials,
        'PATCH',
        `collections/${payload.collectionId}/items/${payload.itemId}`,
        {
          fieldData: {
            ...payload.fieldData,
            name: payload.name,
            slug: payload.slug,
          },
          isDraft: payload.isDraft ?? false,
        }
      )

      if (updateResult.status !== 200) {
        return {
          success: false,
          platform: 'webflow',
          actionType: 'content_publish',
          error: `Failed to update item: HTTP ${updateResult.status}`,
        }
      }

      return {
        success: true,
        platform: 'webflow',
        actionType: 'content_publish',
        responseData: {
          collectionId: payload.collectionId,
          itemId: payload.itemId,
          action: 'updated',
        },
        rollbackPayload: {
          collectionId: payload.collectionId,
          itemId: payload.itemId,
          action: 'restore',
          originalFieldData,
        },
      }
    }

    // Create new item
    const createResult = await webflowRequest(
      credentials,
      'POST',
      `collections/${payload.collectionId}/items`,
      {
        fieldData: {
          ...payload.fieldData,
          name: payload.name,
          slug: payload.slug,
        },
        isDraft: payload.isDraft ?? true,
      }
    )

    if (createResult.status !== 200 && createResult.status !== 201) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'content_publish',
        error: `Failed to create item: HTTP ${createResult.status}`,
      }
    }

    const newData = createResult.data as Record<string, unknown>
    const newId = (newData.id as string) || ((newData.cmsItemId as string) || '')

    return {
      success: true,
      platform: 'webflow',
      actionType: 'content_publish',
      responseData: {
        collectionId: payload.collectionId,
        itemId: newId,
        action: 'created',
      },
      rollbackPayload: {
        collectionId: payload.collectionId,
        itemId: newId,
        action: 'delete',
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType: 'content_publish',
      error: err instanceof Error ? err.message : 'Unknown error during content publish',
    }
  }
}

/**
 * Execute a robots.txt or llms.txt update on Webflow.
 * Uses custom code injection at the site level.
 */
export async function executeRobotsUpdate(
  credentials: WebflowCredentials,
  payload: {
    fileType: 'robots_txt' | 'llms_txt'
    content: string
  }
): Promise<CMSExecutionResult> {
  try {
    // Webflow doesn't have a direct robots.txt API.
    // We use the custom code endpoint for site-level SEO settings.
    // For robots.txt, Webflow allows it via Project Settings > SEO > Robots.txt
    // API: PUT /sites/{siteId}/seo

    // Fetch current SEO settings for rollback
    const currentSettings = await webflowRequest(
      credentials,
      'GET',
      `sites/${credentials.siteId}`
    )

    if (currentSettings.status !== 200) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'robots_update',
        error: `Failed to fetch site settings: HTTP ${currentSettings.status}`,
      }
    }

    const siteData = currentSettings.data as Record<string, unknown>
    const originalRobots = (siteData.robotsTxt as string) || ''

    if (payload.fileType === 'robots_txt') {
      // Update robots.txt via site settings
      const updateResult = await webflowRequest(
        credentials,
        'PATCH',
        `sites/${credentials.siteId}`,
        {
          robotsTxt: payload.content,
        }
      )

      if (updateResult.status !== 200) {
        return {
          success: false,
          platform: 'webflow',
          actionType: 'robots_update',
          error: `Failed to update robots.txt: HTTP ${updateResult.status}`,
        }
      }

      return {
        success: true,
        platform: 'webflow',
        actionType: 'robots_update',
        responseData: {
          fileType: payload.fileType,
          contentLength: payload.content.length,
        },
        rollbackPayload: {
          fileType: payload.fileType,
          originalContent: originalRobots,
        },
      }
    }

    // For llms.txt, Webflow doesn't natively support it.
    // We store it as a custom code field at the site level.
    return {
      success: false,
      platform: 'webflow',
      actionType: 'robots_update',
      error: 'llms.txt is not directly supported on Webflow. Use a custom 301 redirect or hosting-level configuration.',
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType: 'robots_update',
      error: err instanceof Error ? err.message : 'Unknown error during robots update',
    }
  }
}

/**
 * Execute a redirect creation on Webflow.
 * Uses the Webflow redirects API.
 */
export async function executeRedirectCreate(
  credentials: WebflowCredentials,
  payload: {
    fromPath: string
    toUrl: string
    statusCode?: number // 301 (default) or 302
  }
): Promise<CMSExecutionResult> {
  try {
    const statusCode = payload.statusCode || 301

    const result = await webflowRequest(
      credentials,
      'POST',
      `sites/${credentials.siteId}/redirects`,
      {
        sourcePath: payload.fromPath,
        targetPath: payload.toUrl,
        statusCode,
      }
    )

    if (result.status !== 200 && result.status !== 201) {
      return {
        success: false,
        platform: 'webflow',
        actionType: 'redirect_create',
        error: `Failed to create redirect: HTTP ${result.status}`,
      }
    }

    const data = result.data as Record<string, unknown>
    const redirectId = (data.id as string) || ''

    return {
      success: true,
      platform: 'webflow',
      actionType: 'redirect_create',
      responseData: {
        redirectId,
        fromPath: payload.fromPath,
        toUrl: payload.toUrl,
        statusCode,
      },
      rollbackPayload: {
        redirectId,
        action: 'delete_redirect',
      },
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType: 'redirect_create',
      error: err instanceof Error ? err.message : 'Unknown error during redirect creation',
    }
  }
}

/**
 * Publish the site after changes.
 * Webflow requires an explicit publish step for changes to go live.
 */
export async function publishWebflowSite(
  credentials: WebflowCredentials
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await webflowRequest(
      credentials,
      'POST',
      `sites/${credentials.siteId}/publish`,
      {}
    )

    if (result.status !== 200 && result.status !== 202) {
      return {
        success: false,
        error: `Failed to publish site: HTTP ${result.status}`,
      }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error during publish',
    }
  }
}

// ── Rollback Functions ────────────────────────────────────────────────────────

/**
 * Roll back a Webflow change using the rollback payload.
 */
export async function rollbackWebflow(
  credentials: WebflowCredentials,
  actionType: string,
  rollbackPayload: Record<string, unknown>
): Promise<CMSExecutionResult> {
  try {
    switch (actionType) {
      case 'schema_update': {
        const collectionId = rollbackPayload.collectionId as string
        const itemId = rollbackPayload.itemId as string
        const customCodeField = rollbackPayload.customCodeField as string
        const originalSchema = rollbackPayload.originalSchema as string

        if (!collectionId || !itemId || !customCodeField) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'schema_update',
            error: 'Missing rollback data',
          }
        }

        const result = await webflowRequest(
          credentials,
          'PATCH',
          `collections/${collectionId}/items/${itemId}`,
          {
            fieldData: { [customCodeField]: originalSchema },
            isDraft: false,
          }
        )
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'schema_update',
            error: `Rollback failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'webflow',
          actionType: 'schema_update',
          responseData: { collectionId, itemId, rolledBack: true },
        }
      }

      case 'meta_tag': {
        const collectionId = rollbackPayload.collectionId as string
        const itemId = rollbackPayload.itemId as string
        const fieldKey = rollbackPayload.fieldKey as string
        const previousValue = rollbackPayload.previousValue as string

        if (!collectionId || !itemId || !fieldKey) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'meta_tag',
            error: 'Missing rollback data',
          }
        }

        const result = await webflowRequest(
          credentials,
          'PATCH',
          `collections/${collectionId}/items/${itemId}`,
          {
            fieldData: { [fieldKey]: previousValue },
            isDraft: false,
          }
        )
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'meta_tag',
            error: `Rollback failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'webflow',
          actionType: 'meta_tag',
          responseData: { collectionId, itemId, fieldKey, rolledBack: true },
        }
      }

      case 'content_publish': {
        const action = rollbackPayload.action as string
        const collectionId = rollbackPayload.collectionId as string
        const itemId = rollbackPayload.itemId as string

        if (action === 'delete') {
          const result = await webflowRequest(
            credentials,
            'DELETE',
            `collections/${collectionId}/items/${itemId}`
          )
          if (result.status !== 200) {
            return {
              success: false,
              platform: 'webflow',
              actionType: 'content_publish',
              error: `Rollback (delete) failed: HTTP ${result.status}`,
            }
          }
          return {
            success: true,
            platform: 'webflow',
            actionType: 'content_publish',
            responseData: { itemId, action: 'deleted', rolledBack: true },
          }
        }

        // Restore original content
        const originalFieldData = rollbackPayload.originalFieldData as Record<string, unknown>
        if (!originalFieldData) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'content_publish',
            error: 'Missing originalFieldData in rollback payload',
          }
        }

        const result = await webflowRequest(
          credentials,
          'PATCH',
          `collections/${collectionId}/items/${itemId}`,
          {
            fieldData: originalFieldData,
            isDraft: false,
          }
        )
        if (result.status !== 200) {
          return {
            success: false,
            platform: 'webflow',
            actionType: 'content_publish',
            error: `Rollback (restore) failed: HTTP ${result.status}`,
          }
        }
        return {
          success: true,
          platform: 'webflow',
          actionType: 'content_publish',
          responseData: { itemId, action: 'restored', rolledBack: true },
        }
      }

      case 'robots_update': {
        const fileType = rollbackPayload.fileType as string
        const originalContent = rollbackPayload.originalContent as string

        if (fileType === 'robots_txt') {
          const result = await webflowRequest(
            credentials,
            'PATCH',
            `sites/${credentials.siteId}`,
            { robotsTxt: originalContent }
          )
          if (result.status !== 200) {
            return {
              success: false,
              platform: 'webflow',
              actionType: 'robots_update',
              error: `Rollback failed: HTTP ${result.status}`,
            }
          }
        }

        return {
          success: true,
          platform: 'webflow',
          actionType: 'robots_update',
          responseData: { fileType, rolledBack: true },
        }
      }

      case 'redirect_create': {
        const redirectId = rollbackPayload.redirectId as string
        const action = rollbackPayload.action as string

        if (action === 'delete_redirect' && redirectId) {
          const result = await webflowRequest(
            credentials,
            'DELETE',
            `sites/${credentials.siteId}/redirects/${redirectId}`
          )
          if (result.status !== 200) {
            return {
              success: false,
              platform: 'webflow',
              actionType: 'redirect_create',
              error: `Rollback (delete redirect) failed: HTTP ${result.status}`,
            }
          }
          return {
            success: true,
            platform: 'webflow',
            actionType: 'redirect_create',
            responseData: { redirectId, action: 'deleted', rolledBack: true },
          }
        }

        return {
          success: false,
          platform: 'webflow',
          actionType: 'redirect_create',
          error: 'Invalid rollback payload for redirect',
        }
      }

      default:
        return {
          success: false,
          platform: 'webflow',
          actionType,
          error: `Unknown action type for rollback: ${actionType}`,
        }
    }
  } catch (err) {
    return {
      success: false,
      platform: 'webflow',
      actionType,
      error: err instanceof Error ? err.message : 'Unknown error during rollback',
    }
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

/**
 * Main dispatcher: executes an action on Webflow based on actionType.
 */
export async function executeWebflowAction(
  credentials: WebflowCredentials,
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
        platform: 'webflow',
        actionType,
        error: `Unsupported Webflow action type: ${actionType}`,
      }
  }
}
