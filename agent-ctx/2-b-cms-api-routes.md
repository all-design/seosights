# Task 2-b: WordPress CMS Integration API Routes

## Agent: CMS API Routes Agent

## Status: COMPLETED

## Summary
Created three API routes for WordPress CMS integration: publish (publishes AI-generated content to WordPress), test-connection (validates WordPress REST API credentials), and save-credentials (persists CMS credentials to the project).

## Files Created
1. `/src/app/api/cms/publish/route.ts` - POST endpoint that publishes blog content to WordPress via REST API
2. `/src/app/api/cms/test-connection/route.ts` - POST endpoint that validates WordPress credentials by hitting /wp-json/wp/v2/users/me
3. `/src/app/api/cms/save-credentials/route.ts` - POST endpoint that stores CMS credentials as JSON in the Project model

## Dependencies
- Prisma schema (cmsPlatform, cmsCredentials fields on Project model, CMSPublishLog model) — already set up by Task 1-a
- CMSIntegrationPanel.tsx (Task 2-a) — frontend component that calls these endpoints

## Key Implementation Details

### publish/route.ts
- Reads projectId + articleData (title, html_content, meta_description, publish_immediately) from body
- Looks up project, parses cmsCredentials JSON for WordPress credentials
- Base64 encodes wp_username:wp_application_password for Authorization header
- POSTs to {siteUrl}/wp-json/wp/v2/posts with status "draft" (default, Co-Pilot) or "publish" (Auto-Pilot)
- On success: creates CMSPublishLog record with externalPostId, postUrl, publishedAt
- On failure: creates CMSPublishLog with status "failed"
- 15-second AbortController timeout on external fetch
- Returns: { success, postUrl, postId, status } or { success: false, error }

### test-connection/route.ts
- Takes siteUrl, username, applicationPassword from body
- GETs {siteUrl}/wp-json/wp/v2/users/me with Basic auth
- Returns { success, siteName, userRole, username } on success
- Specific error messages for 401 (auth failed), 404 (API not found), timeout
- 15-second timeout via AbortController

### save-credentials/route.ts
- Takes projectId + credentials (platform, siteUrl, wp_username?, wp_application_password?)
- Validates platform is wordpress|webflow|shopify
- WordPress requires wp_username and wp_application_password
- Normalizes siteUrl (trims trailing slashes)
- Updates project.cmsPlatform and project.cmsCredentials (JSON stringified)
- NOTE: Production should encrypt the application password before storage

## Prisma Schema Used
```prisma
model Project {
  cmsPlatform     String    @default("none") // none | wordpress | webflow | shopify
  cmsCredentials  String?   // JSON string with CMS credentials
  ...
}

model CMSPublishLog {
  id, projectId, agentId, contentType, title, externalPostId, postUrl, status, publishedAt, createdAt
}
```
