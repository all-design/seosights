/**
 * AI QA Center — Seed Database
 *
 * POST /api/qa/seed
 * Seeds the database with realistic demo data for the QA Center dashboard.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Data Pools ────────────────────────────────────────────────────────────────

const REVIEWERS = [
  'functional_qa',
  'ux_reviewer',
  'product_reviewer',
  'growth_reviewer',
  'copy_reviewer',
  'accessibility_reviewer',
  'performance_reviewer',
  'security_reviewer',
  'seo_reviewer',
  'observatory_reviewer',
] as const

const REVIEWER_SCORES: Record<string, number> = {
  functional_qa: 94,
  ux_reviewer: 88,
  product_reviewer: 85,
  growth_reviewer: 81,
  copy_reviewer: 90,
  accessibility_reviewer: 83,
  performance_reviewer: 92,
  security_reviewer: 97,
  seo_reviewer: 89,
  observatory_reviewer: 95,
}

const REVIEWER_SUMMARIES: Record<string, string> = {
  functional_qa: 'Core functionality is solid across most user flows. Billing and mobile login modals need immediate attention. Form validation and error handling are generally well-implemented with a few edge cases.',
  ux_reviewer: 'Overall UX is polished with consistent design language. Navigation patterns are intuitive but some micro-interactions feel sluggish. Mobile experience needs improvement, particularly with modal behaviors and touch targets.',
  product_reviewer: 'Product-market fit indicators are strong. Core value proposition is clearly communicated. Onboarding flow could be more streamlined — users drop off at the integration step. Feature discovery needs improvement.',
  growth_reviewer: 'Conversion funnel has several leaks, particularly between free trial and paid. CTA visibility is below benchmark. A/B testing infrastructure is solid but underutilized. Upsell touchpoints are too aggressive.',
  copy_reviewer: 'Messaging is generally clear and professional. Some technical jargon in onboarding could be simplified. Error messages are helpful but inconsistent in tone. Legal pages need a readability pass.',
  accessibility_reviewer: 'WCAG 2.1 AA compliance is partial. Color contrast issues on secondary text and several interactive elements lack proper ARIA labels. Keyboard navigation breaks on the dashboard filters. Screen reader experience needs significant work.',
  performance_reviewer: 'Core Web Vitals are strong on desktop but mobile LCP exceeds 2.5s on 3 pages. Bundle size is manageable. API response times are within SLA. Image optimization could be improved with next-gen formats.',
  security_reviewer: 'Security posture is excellent. CSP headers are properly configured. Rate limiting is in place. Minor: some API endpoints lack input validation edge cases. Session management follows best practices. 2FA implementation is solid.',
  seo_reviewer: 'Technical SEO foundation is strong with proper structured data. Meta descriptions are present but some could be more compelling. Internal linking structure is good but orphan pages exist. Hreflang tags are correctly implemented.',
  observatory_reviewer: 'Observability infrastructure is well-built. Alerting covers critical paths. Log aggregation works reliably. Minor gap: no synthetic monitoring for the billing flow. Dashboard latency metrics are comprehensive.',
}

const CATEGORIES = [
  'functional', 'ux', 'product', 'growth', 'copy',
  'accessibility', 'performance', 'security', 'seo', 'observatory',
] as const

const SEVERITIES = ['critical', 'major', 'medium', 'minor'] as const

const ROLES = [
  'ceo', 'cto', 'cmo', 'ux_lead', 'investor',
  'customer', 'competitor', 'hacker', 'enterprise_buyer',
] as const

const PAGES = [
  { route: '/', url: 'https://seosights.com/' },
  { route: '/pricing', url: 'https://seosights.com/pricing' },
  { route: '/dashboard', url: 'https://seosights.com/dashboard' },
  { route: '/dashboard/analytics', url: 'https://seosights.com/dashboard/analytics' },
  { route: '/dashboard/settings', url: 'https://seosights.com/dashboard/settings' },
  { route: '/dashboard/integrations', url: 'https://seosights.com/dashboard/integrations' },
  { route: '/dashboard/reports', url: 'https://seosights.com/dashboard/reports' },
  { route: '/dashboard/billing', url: 'https://seosights.com/dashboard/billing' },
  { route: '/login', url: 'https://seosights.com/login' },
  { route: '/register', url: 'https://seosights.com/register' },
  { route: '/forgot-password', url: 'https://seosights.com/forgot-password' },
  { route: '/audit', url: 'https://seosights.com/audit' },
  { route: '/audit/results', url: 'https://seosights.com/audit/results' },
  { route: '/blog', url: 'https://seosights.com/blog' },
  { route: '/blog/ai-visibility-guide', url: 'https://seosights.com/blog/ai-visibility-guide' },
  { route: '/docs/api', url: 'https://seosights.com/docs/api' },
  { route: '/docs/webhooks', url: 'https://seosights.com/docs/webhooks' },
  { route: '/changelog', url: 'https://seosights.com/changelog' },
  { route: '/contact', url: 'https://seosights.com/contact' },
  { route: '/enterprise', url: 'https://seosights.com/enterprise' },
] as const

// ── Issue Data ────────────────────────────────────────────────────────────────

interface IssueTemplate {
  title: string
  description: string
  severity: 'critical' | 'major' | 'medium' | 'minor'
  category: string
  reviewer: string
  page?: string
  element?: string
  expectedBehavior?: string
  actualBehavior?: string
  reproduction?: string
  userImpact?: string
  businessImpact?: string
  status?: string
  fixSuggestion?: string
}

const ISSUE_TEMPLATES: IssueTemplate[] = [
  // ── Critical (2) ──────────────────────────────────────────────────────
  {
    title: 'Billing page returns 500 on invalid card',
    description: 'When a user submits a payment with an invalid card number format (e.g., contains letters), the billing API returns a 500 Internal Server Error instead of a proper validation error. This prevents the user from correcting their input and blocks the payment flow entirely.',
    severity: 'critical',
    category: 'functional',
    reviewer: 'functional_qa',
    page: '/dashboard/billing',
    element: '#payment-form',
    expectedBehavior: 'Form should validate card number format client-side and show a clear error message. Server should return 422 with validation details.',
    actualBehavior: 'Server crashes with 500 error. User sees generic "Something went wrong" message. Payment flow is completely blocked.',
    reproduction: '1. Navigate to /dashboard/billing\n2. Enter card number "4242abcd4242424242"\n3. Fill other fields with valid data\n4. Click "Submit Payment"\n5. Observe 500 error in network tab',
    userImpact: 'high',
    businessImpact: 'revenue',
    fixSuggestion: 'Add server-side card number validation using Luhn algorithm. Return 422 with field-level error messages. Add client-side format validation as first line of defense.',
  },
  {
    title: 'Login modal doesn\'t close on mobile',
    description: 'On mobile devices (iOS Safari, Chrome Android), the login modal cannot be closed. Tapping the X button or the overlay does nothing. The only escape is refreshing the page, which loses any form data the user may have entered.',
    severity: 'critical',
    category: 'ux',
    reviewer: 'ux_reviewer',
    page: '/login',
    element: '.login-modal-overlay',
    expectedBehavior: 'Tapping the X button or overlay should close the modal and return to the previous view.',
    actualBehavior: 'Modal remains open. Touch events on the close button and overlay are not firing. Only page refresh works.',
    reproduction: '1. On mobile device (or Chrome DevTools mobile simulation)\n2. Navigate to any page requiring auth\n3. Login modal appears\n4. Tap X button or overlay\n5. Modal stays open',
    userImpact: 'high',
    businessImpact: 'retention',
    fixSuggestion: 'The issue is likely caused by touch event handling. Replace onClick with onPointerDown or add explicit onTouchEnd handlers. Check z-index stacking and ensure pointer-events are enabled.',
  },

  // ── Major (8) ─────────────────────────────────────────────────────────
  {
    title: 'Dashboard analytics charts fail to render on Safari 16',
    description: 'Charts on the analytics dashboard show blank areas on Safari 16. The data loads correctly (visible in network tab) but the canvas rendering fails silently.',
    severity: 'major',
    category: 'functional',
    reviewer: 'functional_qa',
    page: '/dashboard/analytics',
    element: '.analytics-chart-container',
    expectedBehavior: 'All charts should render correctly on Safari 16+.',
    actualBehavior: 'Charts appear as blank white areas. No error shown to user.',
    reproduction: '1. Open Safari 16\n2. Navigate to /dashboard/analytics\n3. Observe blank chart areas',
    userImpact: 'high',
    businessImpact: 'retention',
    fixSuggestion: 'Check for Safari-specific Canvas API incompatibilities. May need to add polyfill for OffscreenCanvas or use requestAnimationFrame for rendering.',
  },
  {
    title: 'Onboarding wizard skips integration step for some users',
    description: 'Approximately 15% of new users skip the integration configuration step during onboarding, even when they haven\'t configured any integrations. This leads to empty dashboards and poor first-time experience.',
    severity: 'major',
    category: 'product',
    reviewer: 'product_reviewer',
    page: '/register',
    element: '#onboarding-wizard',
    expectedBehavior: 'Integration step should be required until at least one integration is configured or explicitly skipped.',
    actualBehavior: 'Step is auto-skipped for some users due to race condition in wizard state management.',
    userImpact: 'high',
    businessImpact: 'retention',
    fixSuggestion: 'Add explicit guard in onboarding flow to prevent skipping integration step without user action. Track skip rate in analytics.',
  },
  {
    title: 'Free trial to paid conversion CTA is below the fold on mobile',
    description: 'The primary upgrade CTA on the free trial expired screen is positioned below the viewport on mobile devices, requiring scrolling past a wall of text to find it.',
    severity: 'major',
    category: 'growth',
    reviewer: 'growth_reviewer',
    page: '/dashboard',
    element: '#upgrade-cta',
    expectedBehavior: 'Primary upgrade CTA should be visible within the first viewport on mobile.',
    actualBehavior: 'CTA is 800px down the page, below 3 paragraphs of feature comparison text.',
    userImpact: 'medium',
    businessImpact: 'revenue',
    fixSuggestion: 'Move CTA to sticky bottom bar on mobile or show as first element above feature comparison. A/B test positioning.',
  },
  {
    title: 'Dashboard filter panel breaks keyboard navigation',
    description: 'When using Tab key to navigate the dashboard filter panel, focus gets trapped in the date picker component and cannot escape. This makes the filters completely inaccessible to keyboard-only users.',
    severity: 'major',
    category: 'accessibility',
    reviewer: 'accessibility_reviewer',
    page: '/dashboard',
    element: '.filter-panel',
    expectedBehavior: 'Tab key should cycle through all filter controls and exit the panel predictably.',
    actualBehavior: 'Focus gets trapped in the date picker. User cannot Tab or Shift+Tab out of it.',
    userImpact: 'high',
    businessImpact: 'compliance',
    fixSuggestion: 'Implement proper focus trap management with escape key support. Add aria-modal and role="dialog" to the date picker.',
  },
  {
    title: 'API response times exceed 2s on /api/audit/run during peak hours',
    description: 'The audit run endpoint takes over 2 seconds to respond during peak hours (9-11 AM EST), well above the 500ms SLA. This causes timeout errors in the client.',
    severity: 'major',
    category: 'performance',
    reviewer: 'performance_reviewer',
    page: '/audit',
    element: 'API: POST /api/audit/run',
    expectedBehavior: 'API response time should be under 500ms (p95).',
    actualBehavior: 'Peak hour p95 is 2.3s. p99 reaches 4.1s.',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Add request queuing with Redis. Implement horizontal scaling for audit workers. Cache common audit patterns.',
  },
  {
    title: 'Blog category pages have duplicate H1 tags',
    description: 'Blog category listing pages have both the site name and category name wrapped in H1 tags, violating SEO best practices and confusing search engines about the page\'s primary topic.',
    severity: 'major',
    category: 'seo',
    reviewer: 'seo_reviewer',
    page: '/blog',
    element: 'h1',
    expectedBehavior: 'Each page should have exactly one H1 tag containing the primary page topic.',
    actualBehavior: 'Two H1 tags: site name and category name.',
    userImpact: 'low',
    businessImpact: 'reputation',
    fixSuggestion: 'Change site name to use a div or span. Ensure only the category name is in the H1 tag.',
  },
  {
    title: 'No synthetic monitoring for billing flow',
    description: 'The billing and payment flow has no synthetic monitoring or alerting set up. If the payment provider goes down, there is no automated detection — the team only learns from user reports.',
    severity: 'major',
    category: 'observatory',
    reviewer: 'observatory_reviewer',
    page: '/dashboard/billing',
    expectedBehavior: 'Synthetic monitoring should cover the critical billing path with 1-minute check intervals.',
    actualBehavior: 'No synthetic monitors exist for billing. Only uptime checks on the homepage.',
    userImpact: 'medium',
    businessImpact: 'revenue',
    fixSuggestion: 'Set up synthetic monitoring for: billing page load, payment form submission (test mode), invoice generation, and subscription status checks.',
  },
  {
    title: 'Error messages have inconsistent tone and formatting',
    description: 'Some error messages use technical jargon ("Exception in handler"), others are friendly ("Oops! Something went wrong"), and some are just error codes ("ERR_4042"). This creates a disjointed user experience.',
    severity: 'major',
    category: 'copy',
    reviewer: 'copy_reviewer',
    page: '/dashboard',
    element: '.error-message',
    expectedBehavior: 'All error messages should follow a consistent tone: human-friendly, actionable, and on-brand.',
    actualBehavior: 'At least 4 distinct error message styles found across the app.',
    userImpact: 'medium',
    businessImpact: 'reputation',
    fixSuggestion: 'Create an error message style guide. Implement a centralized error message component with consistent formatting. Audit all error states.',
  },

  // ── Medium (14) ───────────────────────────────────────────────────────
  {
    title: 'Settings page doesn\'t persist timezone selection',
    description: 'After selecting a timezone in settings and clicking save, the selection reverts to UTC on page reload.',
    severity: 'medium',
    category: 'functional',
    reviewer: 'functional_qa',
    page: '/dashboard/settings',
    element: '#timezone-select',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Verify the timezone field is included in the save API payload and that the backend persists it correctly.',
  },
  {
    title: 'Report PDF export includes raw HTML in table cells',
    description: 'When exporting a report as PDF, some table cells contain raw HTML tags like <strong> and <br> instead of rendered content.',
    severity: 'medium',
    category: 'functional',
    reviewer: 'functional_qa',
    page: '/dashboard/reports',
    element: '.report-export-btn',
    userImpact: 'medium',
    businessImpact: 'reputation',
    fixSuggestion: 'Parse HTML content before PDF generation. Use a proper HTML-to-PDF library that supports inline styles.',
  },
  {
    title: 'Navigation menu overlaps content on iPad landscape',
    description: 'On iPad in landscape orientation, the side navigation menu partially overlaps the main content area by about 40px.',
    severity: 'medium',
    category: 'ux',
    reviewer: 'ux_reviewer',
    page: '/dashboard',
    element: '.sidebar-nav',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Add proper responsive breakpoint for iPad landscape (1024x768). Adjust content margin-left to match sidebar width.',
  },
  {
    title: 'Tooltip delay is too short on dashboard cards',
    description: 'Hover tooltips on dashboard metric cards appear after only 100ms, which causes flickering when moving the mouse across multiple cards quickly.',
    severity: 'medium',
    category: 'ux',
    reviewer: 'ux_reviewer',
    page: '/dashboard',
    element: '.metric-card',
    userImpact: 'low',
    businessImpact: 'reputation',
    fixSuggestion: 'Increase tooltip show delay to 300-500ms. Add debounce to prevent rapid tooltip switching.',
  },
  {
    title: 'Feature discovery tooltips appear for already-activated features',
    description: 'New feature discovery tooltips keep showing even after the user has already used the featured functionality multiple times.',
    severity: 'medium',
    category: 'product',
    reviewer: 'product_reviewer',
    page: '/dashboard',
    element: '.feature-tooltip',
    userImpact: 'low',
    businessImpact: 'retention',
    fixSuggestion: 'Track feature usage and dismiss tooltips after first interaction. Store dismissal state in user preferences.',
  },
  {
    title: 'Pricing page doesn\'t show annual discount clearly',
    description: 'The annual pricing option exists but the savings amount is not prominently displayed, leading to lower annual plan adoption.',
    severity: 'medium',
    category: 'growth',
    reviewer: 'growth_reviewer',
    page: '/pricing',
    element: '.pricing-annual-toggle',
    userImpact: 'low',
    businessImpact: 'revenue',
    fixSuggestion: 'Add "Save 20%" badge next to annual toggle. Show per-month price with strikethrough original price.',
  },
  {
    title: 'Contact form success message appears before submission completes',
    description: 'The contact form shows a "Message sent!" success toast before the API call completes, which can be misleading if the submission actually fails.',
    severity: 'medium',
    category: 'growth',
    reviewer: 'growth_reviewer',
    page: '/contact',
    element: '#contact-form',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Move success toast to after API response. Add loading state during submission. Show error toast on failure.',
  },
  {
    title: 'Legal page readability score is below 8th grade level',
    description: 'Terms of Service and Privacy Policy pages have Flesch-Kincaid grade levels of 14-16, making them inaccessible to most users.',
    severity: 'medium',
    category: 'copy',
    reviewer: 'copy_reviewer',
    page: '/terms',
    userImpact: 'medium',
    businessImpact: 'compliance',
    fixSuggestion: 'Rewrite legal pages in plain language. Add summary sections at the top. Target 8th grade reading level.',
  },
  {
    title: 'Color contrast insufficient on secondary text',
    description: 'Secondary text using text-gray-400 on white background has a contrast ratio of 2.1:1, below the WCAG AA requirement of 4.5:1.',
    severity: 'medium',
    category: 'accessibility',
    reviewer: 'accessibility_reviewer',
    page: '/dashboard',
    element: '.text-gray-400',
    userImpact: 'medium',
    businessImpact: 'compliance',
    fixSuggestion: 'Change secondary text color to text-gray-600 or darker to meet WCAG AA contrast ratio of 4.5:1.',
  },
  {
    title: 'Form inputs lack associated labels on integration page',
    description: 'Three form inputs on the integrations settings page use placeholder text instead of proper <label> elements, making them inaccessible to screen readers.',
    severity: 'medium',
    category: 'accessibility',
    reviewer: 'accessibility_reviewer',
    page: '/dashboard/integrations',
    element: '#integration-form input',
    userImpact: 'medium',
    businessImpact: 'compliance',
    fixSuggestion: 'Add visible <label> elements for each input. Use htmlFor/id association. Keep placeholders as supplementary hints.',
  },
  {
    title: 'Mobile LCP exceeds 2.5s on blog listing page',
    description: 'The blog listing page has a Largest Contentful Paint of 3.2s on mobile, primarily due to unoptimized hero images.',
    severity: 'medium',
    category: 'performance',
    reviewer: 'performance_reviewer',
    page: '/blog',
    element: '.blog-hero-image',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Convert hero images to WebP/AVIF format. Add width/height attributes. Implement lazy loading for below-fold images.',
  },
  {
    title: 'API rate limiting returns generic 500 instead of 429',
    description: 'When rate limits are exceeded, the API returns a generic 500 Internal Server Error instead of the standard 429 Too Many Requests status code.',
    severity: 'medium',
    category: 'security',
    reviewer: 'security_reviewer',
    page: 'API: all endpoints',
    userImpact: 'low',
    businessImpact: 'reputation',
    fixSuggestion: 'Return proper 429 status with Retry-After header. Include rate limit info in response headers (X-RateLimit-Remaining).',
  },
  {
    title: 'Orphan pages exist with no internal links pointing to them',
    description: 'Three pages (/docs/webhooks, /changelog, /enterprise) have no internal links pointing to them from anywhere on the site, making them only accessible via direct URL.',
    severity: 'medium',
    category: 'seo',
    reviewer: 'seo_reviewer',
    page: '/docs/webhooks',
    userImpact: 'low',
    businessImpact: 'reputation',
    fixSuggestion: 'Add internal links from relevant pages. Include in footer navigation. Add to sitemap.xml.',
  },
  {
    title: 'Alerting threshold too high for API error rate',
    description: 'The alerting threshold for API error rates is set at 10%, which means a significant number of users are affected before the team is notified.',
    severity: 'medium',
    category: 'observatory',
    reviewer: 'observatory_reviewer',
    page: 'API: all endpoints',
    userImpact: 'medium',
    businessImpact: 'retention',
    fixSuggestion: 'Lower error rate alert threshold to 3%. Add separate critical alert at 5%. Implement per-endpoint thresholds.',
  },

  // ── Minor (26 remaining from the 37 total — adding 37 total minor issues via batch) ──
  {
    title: 'Favicon missing on /audit subpages',
    description: 'The favicon is not loaded on pages under /audit/*, showing the default browser icon instead.',
    severity: 'minor', category: 'functional', reviewer: 'functional_qa', page: '/audit/results',
    fixSuggestion: 'Ensure favicon link is in the root layout, not just the home page layout.',
  },
  {
    title: 'Back button doesn\'t work correctly after login redirect',
    description: 'After being redirected to login and authenticating, pressing the browser back button takes you back to the login page instead of the previous page.',
    severity: 'minor', category: 'functional', reviewer: 'functional_qa', page: '/login',
    fixSuggestion: 'Use history.replaceState after successful login redirect to prevent login page from being in history stack.',
  },
  {
    title: 'Dark mode toggle animation is jarring',
    description: 'The transition between light and dark mode causes a visible flash/repaint across the entire page rather than a smooth transition.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/dashboard/settings',
    fixSuggestion: 'Add CSS transition on background-color and color properties with 200ms duration.',
  },
  {
    title: 'Sort indicator missing on analytics table columns',
    description: 'Table columns on the analytics page are sortable but there is no visual indicator showing which column is sorted and in which direction.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/dashboard/analytics',
    fixSuggestion: 'Add ascending/descending arrow icons to sorted column headers.',
  },
  {
    title: 'Empty state illustrations are generic',
    description: 'Empty states across the dashboard use the same generic "no data" illustration regardless of context (no reports, no integrations, no audits).',
    severity: 'minor', category: 'product', reviewer: 'product_reviewer', page: '/dashboard',
    fixSuggestion: 'Create contextual empty state illustrations and messaging for each section.',
  },
  {
    title: 'Trial expiration email sent to already-converted users',
    description: 'Some users who have already upgraded to paid plans are still receiving "Your trial is expiring" emails.',
    severity: 'minor', category: 'product', reviewer: 'product_reviewer', page: 'Email: trial-expiring',
    fixSuggestion: 'Add subscription status check to email sending logic. Exclude active paid users from trial email campaigns.',
  },
  {
    title: 'Newsletter signup CTA color blends with footer',
    description: 'The newsletter signup CTA button in the footer uses the same background color as the footer itself, making it nearly invisible.',
    severity: 'minor', category: 'growth', reviewer: 'growth_reviewer', page: '/',
    fixSuggestion: 'Change CTA button to use a contrasting accent color. Add subtle border or shadow.',
  },
  {
    title: 'Social proof section on homepage shows stale testimonials',
    description: 'The testimonial section on the homepage features a quote from a company that no longer uses the product.',
    severity: 'minor', category: 'growth', reviewer: 'growth_reviewer', page: '/',
    fixSuggestion: 'Implement testimonial rotation system. Add "last verified" date. Review quarterly.',
  },
  {
    title: 'Typo in API documentation: "recieve" instead of "receive"',
    description: 'The webhook documentation page contains a typo: "recieve" should be "receive" in the endpoint description.',
    severity: 'minor', category: 'copy', reviewer: 'copy_reviewer', page: '/docs/api',
    fixSuggestion: 'Run spell checker across all documentation. Add CI check for common typos.',
  },
  {
    title: 'Inconsistent date formatting across pages',
    description: 'Some pages display dates as "Mar 5, 2025" while others show "2025-03-05" or "05/03/2025". No consistent format is used.',
    severity: 'minor', category: 'copy', reviewer: 'copy_reviewer', page: '/dashboard',
    fixSuggestion: 'Create a shared formatDate utility function. Apply consistently across all date displays. Respect user locale.',
  },
  {
    title: 'Focus indicator barely visible on blue buttons',
    description: 'The default focus ring on primary (blue) buttons is very hard to see due to low contrast between the ring color and button background.',
    severity: 'minor', category: 'accessibility', reviewer: 'accessibility_reviewer', page: '/dashboard',
    fixSuggestion: 'Use a high-contrast focus ring (e.g., white outline with offset) on colored buttons.',
  },
  {
    title: 'Skip to content link missing on dashboard',
    description: 'The dashboard pages lack a "Skip to main content" link, requiring keyboard users to tab through the entire navigation on every page load.',
    severity: 'minor', category: 'accessibility', reviewer: 'accessibility_reviewer', page: '/dashboard',
    fixSuggestion: 'Add skip-to-content link as the first focusable element. Style with sr-only, show on focus.',
  },
  {
    title: 'Images on blog pages not using next-gen formats',
    description: 'Blog images are served as PNG/JPG instead of WebP/AVIF, resulting in larger file sizes and slower load times.',
    severity: 'minor', category: 'performance', reviewer: 'performance_reviewer', page: '/blog',
    fixSuggestion: 'Configure image optimization pipeline to serve WebP with AVIF fallback. Use <picture> element.',
  },
  {
    title: 'Unused CSS classes add ~12KB to bundle',
    description: 'The production CSS bundle includes approximately 12KB of unused utility classes, primarily from rarely-used component variants.',
    severity: 'minor', category: 'performance', reviewer: 'performance_reviewer', page: 'Global',
    fixSuggestion: 'Configure PurgeCSS more aggressively. Audit component imports for unused variants.',
  },
  {
    title: 'Session cookie missing Secure flag on staging',
    description: 'On the staging environment, session cookies are set without the Secure flag, allowing them to be sent over HTTP.',
    severity: 'minor', category: 'security', reviewer: 'security_reviewer', page: 'Global',
    fixSuggestion: 'Ensure Secure flag is set on all environments. Add environment variable to force HTTPS in staging.',
  },
  {
    title: 'CORS headers too permissive on API endpoints',
    description: 'Some API endpoints return Access-Control-Allow-Origin: * which is overly permissive. Should be restricted to known origins.',
    severity: 'minor', category: 'security', reviewer: 'security_reviewer', page: 'API: various',
    fixSuggestion: 'Set CORS to allow only the production domain and staging domain. Remove wildcard origin.',
  },
  {
    title: 'Missing alt text on team page photos',
    description: 'Team member photos on the about page are missing alt text attributes, providing no description for screen reader users.',
    severity: 'minor', category: 'accessibility', reviewer: 'accessibility_reviewer', page: '/about',
    fixSuggestion: 'Add descriptive alt text to all team photos. Format: "Photo of [Name], [Title]"',
  },
  {
    title: 'Meta descriptions exceed 160 characters on 5 pages',
    description: 'Five pages have meta descriptions longer than 160 characters, which get truncated in search results.',
    severity: 'minor', category: 'seo', reviewer: 'seo_reviewer', page: '/pricing',
    fixSuggestion: 'Trim all meta descriptions to 150-160 characters. Front-load key information.',
  },
  {
    title: 'Sitemap.xml missing lastmod dates',
    description: 'The sitemap.xml file exists but all URL entries are missing the lastmod attribute, preventing search engines from knowing when content was last updated.',
    severity: 'minor', category: 'seo', reviewer: 'seo_reviewer', page: '/sitemap.xml',
    fixSuggestion: 'Add lastmod dates to all sitemap entries. Update dynamically when content changes.',
  },
  {
    title: 'Log retention policy not enforced for audit logs',
    description: 'Audit logs older than 90 days are supposed to be archived but the retention policy cron job hasn\'t run in 2 weeks.',
    severity: 'minor', category: 'observatory', reviewer: 'observatory_reviewer', page: 'Infrastructure',
    fixSuggestion: 'Fix the cron job scheduling. Add monitoring for log archive job execution.',
  },
  {
    title: 'Dashboard widget loading skeleton has wrong aspect ratio',
    description: 'The loading skeleton for dashboard metric cards has a 2:1 aspect ratio while the actual content is closer to 4:1, causing layout shift when content loads.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/dashboard',
    fixSuggestion: 'Match skeleton dimensions to actual content dimensions to prevent CLS.',
  },
  {
    title: 'Pricing toggle animation stutters on low-end devices',
    description: 'The monthly/annual pricing toggle has a CSS transition that stutters on devices with low GPU capability.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/pricing',
    fixSuggestion: 'Use transform and opacity only for animations. Add will-change: transform hint.',
  },
  {
    title: 'Registration form accepts obviously fake email addresses',
    description: 'The registration form accepts emails like "aaa@bbb.ccc" without any validation beyond basic format.',
    severity: 'minor', category: 'growth', reviewer: 'growth_reviewer', page: '/register',
    fixSuggestion: 'Add DNS MX record validation. Implement disposable email domain blocking.',
  },
  {
    title: 'Footer copyright year is hardcoded to 2024',
    description: 'The footer still shows "© 2024" instead of dynamically displaying the current year.',
    severity: 'minor', category: 'copy', reviewer: 'copy_reviewer', page: 'Global: footer',
    fixSuggestion: 'Use dynamic year: © {new Date().getFullYear()}',
  },
  {
    title: 'Console warnings about deprecated API usage',
    description: 'Browser console shows 8 warnings about deprecated React lifecycle methods in third-party chart library.',
    severity: 'minor', category: 'performance', reviewer: 'performance_reviewer', page: '/dashboard/analytics',
    fixSuggestion: 'Update chart library to latest version. Replace deprecated lifecycle usage if custom.',
  },
  {
    title: 'Missing Content-Security-Policy on error pages',
    description: 'Custom 404 and 500 error pages don\'t include Content-Security-Policy headers, unlike the rest of the application.',
    severity: 'minor', category: 'security', reviewer: 'security_reviewer', page: '/404',
    fixSuggestion: 'Add CSP headers to error page responses in Next.js middleware.',
  },
]

// Additional minor issues to reach 37 total
const ADDITIONAL_MINOR_ISSUES: IssueTemplate[] = [
  {
    title: 'Register page password strength meter inconsistent',
    description: 'The password strength meter shows "Strong" for passwords that common password crackers can break in minutes.',
    severity: 'minor', category: 'security', reviewer: 'security_reviewer', page: '/register',
    fixSuggestion: 'Implement zxcvbn-based password strength estimation instead of simple length/character rules.',
  },
  {
    title: 'Blog RSS feed missing author information',
    description: 'The RSS feed for the blog omits author information for each post, which some RSS readers display.',
    severity: 'minor', category: 'seo', reviewer: 'seo_reviewer', page: '/blog/feed.xml',
    fixSuggestion: 'Add <dc:creator> element to RSS items with author name.',
  },
  {
    title: 'Dashboard pagination doesn\'t preserve filters',
    description: 'When paginating through dashboard results, applied filters are lost, requiring the user to re-apply them on each page.',
    severity: 'minor', category: 'functional', reviewer: 'functional_qa', page: '/dashboard/reports',
    fixSuggestion: 'Store filter state in URL query params. Read filters from URL on page load.',
  },
  {
    title: 'Pricing comparison table misaligns on small mobile screens',
    description: 'The three-column pricing comparison table overflows on screens narrower than 375px.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/pricing',
    fixSuggestion: 'Switch to horizontally scrollable table or accordion layout on small screens.',
  },
  {
    title: 'No loading state on integration test connection button',
    description: 'Clicking "Test Connection" on the integrations page gives no visual feedback while the test is running.',
    severity: 'minor', category: 'product', reviewer: 'product_reviewer', page: '/dashboard/integrations',
    fixSuggestion: 'Add spinner and disable button while testing. Show success/failure state after completion.',
  },
  {
    title: 'Forgot password page allows unlimited reset emails',
    description: 'There is no rate limiting on the forgot password form, allowing potential email bombing.',
    severity: 'minor', category: 'security', reviewer: 'security_reviewer', page: '/forgot-password',
    fixSuggestion: 'Add rate limiting: max 3 reset emails per hour per email address. Add CAPTCHA after 2 attempts.',
  },
  {
    title: 'Analytics page shows "0" instead of "N/A" for unavailable metrics',
    description: 'When a metric has no data (e.g., no audits run yet), the analytics page shows "0" which is misleading.',
    severity: 'minor', category: 'product', reviewer: 'product_reviewer', page: '/dashboard/analytics',
    fixSuggestion: 'Display "N/A" or "—" for metrics with no data. Add tooltip explaining why data is unavailable.',
  },
  {
    title: 'Enterprise page CTA points to generic contact form',
    description: 'The "Talk to Sales" CTA on the enterprise page links to the generic contact form instead of a sales-specific form.',
    severity: 'minor', category: 'growth', reviewer: 'growth_reviewer', page: '/enterprise',
    fixSuggestion: 'Create a dedicated enterprise inquiry form. Add company size and budget range fields.',
  },
  {
    title: 'Breadcrumb navigation missing on documentation pages',
    description: 'Documentation pages under /docs/* lack breadcrumb navigation, making it hard to understand the page hierarchy.',
    severity: 'minor', category: 'ux', reviewer: 'ux_reviewer', page: '/docs/api',
    fixSuggestion: 'Add breadcrumb component with structured data markup for SEO benefit.',
  },
  {
    title: 'Audit results page meta description is generic',
    description: 'The audit results page always shows "View your audit results" as the meta description regardless of the actual audit.',
    severity: 'minor', category: 'seo', reviewer: 'seo_reviewer', page: '/audit/results',
    fixSuggestion: 'Generate dynamic meta descriptions including domain name and key findings.',
  },
  {
    title: 'Dashboard chart animations cause CPU spike on low-end devices',
    description: 'Chart entrance animations cause a noticeable CPU spike on devices with limited processing power.',
    severity: 'minor', category: 'performance', reviewer: 'performance_reviewer', page: '/dashboard/analytics',
    fixSuggestion: 'Add prefers-reduced-motion media query support. Use simpler animations on low-end devices.',
  },
]

// ── Executive Perspectives Data ───────────────────────────────────────────────

const PERSPECTIVES: Record<string, {
  analysis: string
  score: number
  topConcern: string
  recommendation: string
  confidence: number
}> = {
  ceo: {
    score: 90,
    confidence: 0.92,
    topConcern: 'Billing flow reliability directly impacts revenue',
    recommendation: 'Immediately fix the billing 500 error — every hour of downtime costs an estimated $4,200 in lost conversions',
    analysis: `SeoSights shows strong product-market fit with a product score of 92. The platform is mature and delivers clear value, but two critical issues threaten our revenue pipeline. The billing page 500 error is a direct revenue leak — I estimate we're losing 8-12 conversions daily. The mobile login modal issue affects our fastest-growing user segment.

On the positive side, our security posture (97/100) is exceptional, and the functional core (94/100) is solid. The growth metrics (81/100) indicate untapped potential — our conversion funnel has clear optimization opportunities that could add 15-20% to MRR within 60 days.

Priority actions: (1) Fix billing immediately, (2) Address mobile UX blockers, (3) Accelerate growth conversion optimization. The technical debt score of 22/100 is manageable but trending upward — we need to keep it below 30.`,
  },
  cto: {
    score: 91,
    confidence: 0.94,
    topConcern: 'Mobile browser compatibility issues indicate insufficient cross-browser testing',
    recommendation: 'Implement automated cross-browser E2E testing with BrowserStack or Playwright multi-browser configs',
    analysis: `From an engineering standpoint, the platform is well-architected. The security score of 97 reflects our investment in proper CSP, rate limiting, and session management. Performance is strong (92/100) with only mobile LCP concerns.

However, the critical mobile login modal bug and Safari chart rendering failure point to a systemic gap in our cross-browser testing strategy. We're testing primarily on Chrome desktop and missing 25-30% of our user base on Safari and mobile browsers.

The billing 500 error suggests our error handling in payment processing lacks the defensive programming patterns we use elsewhere. Input validation should never be bypassed at the API level.

Technical debt (22/100) is within acceptable bounds. The observatory score of 95 shows our monitoring infrastructure is mature, but the gap in synthetic monitoring for billing is a blind spot that needs immediate attention.

Recommended investments: (1) Cross-browser E2E test suite, (2) Payment flow hardening, (3) Synthetic monitoring for all revenue-critical paths.`,
  },
  cmo: {
    score: 84,
    confidence: 0.88,
    topConcern: 'Conversion funnel leaks and invisible CTAs are leaving money on the table',
    recommendation: 'Redesign the upgrade flow with mobile-first CTA placement and A/B test pricing page layouts',
    analysis: `The marketing picture is mixed. Our SEO foundation is strong (89/100) with proper structured data and good technical SEO. The product itself is compelling — but we're failing at the last mile of conversion.

The growth score of 81/100 tells the real story: our CTA on the expired trial screen is below the fold on mobile (where 60% of our traffic comes from). The annual pricing discount is invisible. The enterprise page CTA goes to a generic contact form. These aren't hard problems, but they're expensive ones.

Our copy quality (90/100) is good but inconsistent — especially in error messages and legal pages. The brand voice needs standardization.

The competitive landscape is heating up. Our observatory score of 95 shows we have the data advantage, but we need to convert that into marketing velocity.

Quick wins: (1) Mobile CTA repositioning, (2) Annual pricing badge, (3) Enterprise form. These three changes could add $15K-25K MRR in 30 days.`,
  },
  ux_lead: {
    score: 86,
    confidence: 0.90,
    topConcern: 'Mobile experience is broken in critical flows — login and billing',
    recommendation: 'Conduct a mobile UX audit with device-specific testing. Fix touch event handling across all modals.',
    analysis: `The UX score of 88/100 reflects a desktop-optimized experience that breaks on mobile. The critical login modal bug on mobile is a showstopper — users literally cannot dismiss the login screen. Combined with the billing 500 error, mobile users are blocked from two of the most important flows.

Beyond the critical issues, there's a pattern of neglecting micro-interactions: tooltip delays are too short, dark mode transitions are jarring, loading skeletons have wrong dimensions, and sort indicators are missing. These individually are minor, but collectively they erode trust and feel.

Accessibility (83/100) needs investment. Color contrast failures, missing ARIA labels, keyboard traps, and missing skip links represent both a compliance risk and a moral failing. We should target WCAG 2.1 AA compliance within 90 days.

The dashboard navigation is functional but the iPad landscape overlap suggests our responsive breakpoints need recalibration. We're designing for desktop and mobile, but missing the tablet middle ground.

Priority: (1) Fix mobile modal/close handlers, (2) Address all accessibility failures, (3) Responsive breakpoint audit.`,
  },
  investor: {
    score: 88,
    confidence: 0.85,
    topConcern: 'Revenue leakage from billing bugs and poor conversion optimization',
    recommendation: 'Fix revenue-critical bugs within 48 hours. Growth optimization should be the next sprint priority.',
    analysis: `As an investor, I look at the product score (92/100) and see a platform with strong fundamentals and a defensible position in the AI visibility market. The security posture (97) and observability (95) scores demonstrate technical maturity.

However, the growth score of 81/100 is concerning for a company at this stage. A billing page that returns 500 errors is unacceptable — it's literally a broken revenue pipe. Combined with CTAs below the fold and invisible pricing discounts, we're leaving significant ARR on the table.

My estimate: the combination of billing bugs, poor mobile conversion, and missed upsell opportunities is costing $50K-80K ARR. These are fixable problems, not fundamental flaws.

The technical debt score of 22 is healthy. The team has clearly invested in engineering quality. But the product-to-revenue conversion needs immediate attention.

Key metrics I'd watch: (1) Payment success rate, (2) Mobile conversion rate, (3) Trial-to-paid rate, (4) Churn within first 30 days. If we fix the critical bugs, I'd expect a 15-25% improvement in (2) and (3) within 60 days.`,
  },
  customer: {
    score: 87,
    confidence: 0.89,
    topConcern: 'Billing errors and mobile issues make the product feel unreliable during critical moments',
    recommendation: 'Focus on making payment and login flows bulletproof — these are trust-defining moments for users',
    analysis: `As a customer, I chose SeoSights because the core product delivers real value. The AI visibility insights are genuinely useful, and the dashboard gives me data I can't get elsewhere. But my experience isn't always smooth.

When I tried to upgrade my plan, the billing page crashed. I had to try three times over two days before it worked. That's not just inconvenient — it made me question whether I could trust the platform with my payment information.

On my phone, I've had issues with the login modal getting stuck. I had to close the browser tab and start over. For a tool I'm paying for, that's frustrating.

The good: the actual SEO analysis is excellent. Reports are comprehensive. The security (97) makes me feel safe. Performance is snappy on desktop.

The bad: error messages are confusing and inconsistent. Some tell me "ERR_4042" (whatever that means), others say "Oops!" without telling me what to do. When things break, I feel abandoned.

Fix the payment flow and the mobile login, and this goes from a good product to a great one.`,
  },
  competitor: {
    score: 82,
    confidence: 0.80,
    topConcern: 'Mobile experience gaps and conversion leaks create exploitable weaknesses',
    recommendation: 'If I were competing against SeoSights, I\'d target mobile users and emphasize payment reliability',
    analysis: `Looking at SeoSights through a competitive lens, their core product is strong (92/100) and their security posture (97/100) is better than most in the SEO tool space. Their AI visibility scoring is a genuine differentiator.

However, I see clear vulnerabilities. The mobile experience (88 UX score with critical bugs) is their biggest weakness. If I were launching a competing product, I'd go mobile-first and target their mobile user base. Their login and billing failures on mobile would be featured in my comparison ads.

Their conversion optimization (81 growth score) is below industry standard. Their pricing page doesn't highlight the annual discount, their enterprise page has a generic CTA, and their trial-to-paid funnel has known leaks. A competitor with better conversion could acquire users more efficiently.

Their accessibility score (83/100) is a compliance risk. One formal complaint could create regulatory headaches.

What they do well: their observability (95/100) means they can detect and respond to issues quickly. Their SEO (89/100) means they rank well. Their content quality (90/100 copy score) builds authority.

My competitive strategy would be: (1) Out-convert them on mobile, (2) Emphasize payment reliability, (3) Target their accessibility gaps for enterprise deals.`,
  },
  hacker: {
    score: 93,
    confidence: 0.96,
    topConcern: 'Missing input validation on billing API and permissive CORS policy',
    recommendation: 'Tighten input validation on all payment endpoints and restrict CORS to known origins immediately',
    analysis: `From a security research perspective, SeoSights is better than most SaaS platforms. The security score of 97/100 reflects genuine investment in security fundamentals: CSP headers are properly configured, rate limiting exists, session management follows best practices, and 2FA is implemented correctly.

But let me highlight the gaps. The billing 500 error from invalid card input suggests missing server-side input validation — that's not just a bug, it's a potential attack vector. If the payment API can be crashed with malformed input, I'd want to test for injection vulnerabilities in that same code path.

The CORS policy uses wildcard origins on some endpoints. That's an open door for CSRF attacks if any authenticated endpoints share that configuration.

The rate limiting returns 500 instead of 429 — while not a security vulnerability per se, it suggests the rate limiting implementation might be at the application level rather than infrastructure level, which can be bypassed.

Session cookies missing the Secure flag on staging is a supply chain risk if staging credentials are reused.

On the positive side: their security score of 97 is legitimate. They're doing most things right. The gaps are at the edges, and the critical issues are in error handling rather than fundamental architecture.

My fix priority: (1) Input validation on payment API, (2) CORS policy restriction, (3) Rate limit status codes, (4) Secure cookie flags everywhere.`,
  },
  enterprise_buyer: {
    score: 85,
    confidence: 0.87,
    topConcern: 'Accessibility compliance gaps and billing reliability are red flags for enterprise procurement',
    recommendation: 'Achieve WCAG 2.1 AA compliance and add SOC 2 Type II certification to unlock enterprise deals',
    analysis: `As an enterprise buyer evaluating SeoSights for a 500+ seat deployment, I have different priorities than an SMB user. My evaluation criteria include: reliability, compliance, security, and scalability.

Security (97/100): Excellent. CSP headers, rate limiting, 2FA, and proper session management meet our baseline requirements. The security team would approve this.

Performance (92/100): Strong. API response times are within our SLA requirements. The mobile LCP issues don't affect our primarily desktop workforce.

Accessibility (83/100): Concerning. For a company with 12% of employees using assistive technologies, the accessibility gaps — missing ARIA labels, keyboard traps, insufficient contrast — represent both a legal risk and an inclusion failure. We require WCAG 2.1 AA compliance for all vendors.

Reliability: The billing 500 error is a red flag. If the payment system can crash from invalid input, what does that say about error handling in the rest of the platform? For enterprise SLAs, we need 99.9% uptime with proper error handling.

Observability (95/100): Impressive. Their monitoring infrastructure suggests they can meet our incident response requirements. But the missing synthetic monitoring for billing is a gap.

My recommendation: conditional approval. We'd proceed if SeoSights (1) achieves WCAG 2.1 AA compliance within 90 days, (2) provides SOC 2 Type II certification, (3) demonstrates billing reliability with 99.9% uptime SLA.`,
  },
}

// ── POST: Seed data ───────────────────────────────────────────────────────────

export async function POST() {
  try {
    const results: Record<string, number> = {}

    // ── 1. QARun ─────────────────────────────────────────────────────────
    const now = new Date()
    const startedAt = new Date(now.getTime() - 147000) // 2m 27s ago

    const run = await db.qARun.create({
      data: {
        startedAt,
        completedAt: now,
        durationMs: 147000,
        productScore: 92,
        uxScore: 88,
        engineeringScore: 91,
        conversionScore: 81,
        accessibilityScore: 83,
        securityScore: 97,
        performanceScore: 92,
        seoScore: 89,
        customerDelight: 87,
        criticalCount: 2,
        majorCount: 8,
        mediumCount: 14,
        minorCount: 37,
        technicalDebt: 22,
        status: 'completed',
      },
    })
    results.qaRun = 1

    // ── 2. QAReviewerResult (10 reviewers) ───────────────────────────────
    const reviewerResults = []
    for (const reviewer of REVIEWERS) {
      const score = REVIEWER_SCORES[reviewer]
      const issueCount = reviewer === 'functional_qa' ? 5
        : reviewer === 'ux_reviewer' ? 6
        : reviewer === 'accessibility_reviewer' ? 4
        : reviewer === 'performance_reviewer' ? 4
        : reviewer === 'security_reviewer' ? 4
        : reviewer === 'seo_reviewer' ? 4
        : reviewer === 'product_reviewer' ? 4
        : reviewer === 'growth_reviewer' ? 4
        : reviewer === 'copy_reviewer' ? 3
        : 3

      const details: Record<string, string[]> = {
        functional_qa: ['Billing crash on invalid input', 'Settings timezone not persisting', 'PDF export HTML leak', 'Favicon missing on audit pages', 'Back button after login redirect'],
        ux_reviewer: ['Mobile login modal stuck', 'Safari chart rendering blank', 'iPad nav overlap', 'Tooltip delay too short', 'Dark mode flash', 'Sort indicator missing'],
        product_reviewer: ['Onboarding skips integration step', 'Feature tooltips re-appear', 'Empty states generic', 'Trial emails to paid users', 'Analytics shows 0 instead of N/A', 'Missing loading state on integration test'],
        growth_reviewer: ['CTA below fold on mobile', 'Annual discount invisible', 'Contact form premature success', 'Newsletter CTA blends with footer', 'Stale testimonials', 'Enterprise CTA generic form'],
        copy_reviewer: ['Inconsistent error messages', 'Legal pages unreadable', 'Typo in API docs', 'Inconsistent date formatting', 'Footer copyright year wrong'],
        accessibility_reviewer: ['Keyboard trap in filter panel', 'Low contrast secondary text', 'Missing form labels', 'Focus indicator invisible on buttons', 'Missing skip-to-content link', 'Missing alt text on team photos'],
        performance_reviewer: ['Peak hour API latency >2s', 'Mobile LCP >2.5s on blog', 'Unused CSS bundle 12KB', 'Console deprecation warnings', 'Chart animation CPU spike'],
        security_reviewer: ['Rate limit returns 500 not 429', 'Missing Secure flag on staging', 'CORS too permissive', 'Billing API missing input validation', 'Unlimited password reset emails', 'Missing CSP on error pages', 'Weak password strength meter'],
        seo_reviewer: ['Duplicate H1 on blog pages', 'Orphan pages no internal links', 'Meta descriptions too long', 'Missing lastmod in sitemap', 'RSS feed missing authors', 'Generic audit meta description'],
        observatory_reviewer: ['No synthetic monitoring for billing', 'Alert threshold too high', 'Log retention cron not running'],
      }

      const recommendations: Record<string, string[]> = {
        functional_qa: ['Add input validation to billing API', 'Fix timezone persistence in settings API', 'Sanitize HTML in PDF generator', 'Move favicon to root layout', 'Use history.replaceState after login'],
        ux_reviewer: ['Fix touch event handlers on modals', 'Add Safari canvas polyfill', 'Adjust responsive breakpoints for iPad', 'Increase tooltip delay to 400ms', 'Add CSS transition for theme toggle', 'Add sort direction indicators'],
        product_reviewer: ['Add guard to prevent onboarding skip', 'Track tooltip dismissal in preferences', 'Create contextual empty states', 'Check subscription status before trial emails', 'Display N/A for unavailable metrics', 'Add loading state to test connection button'],
        growth_reviewer: ['Move CTA to sticky bottom bar on mobile', 'Add "Save 20%" badge to annual pricing', 'Move success toast to after API response', 'Use contrasting CTA color in footer', 'Implement testimonial rotation', 'Create dedicated enterprise form'],
        copy_reviewer: ['Create error message style guide', 'Rewrite legal pages at 8th grade level', 'Run spell checker on docs', 'Create shared formatDate utility', 'Use dynamic year in footer'],
        accessibility_reviewer: ['Fix focus trap with proper aria-modal', 'Darken secondary text color', 'Add visible labels to form inputs', 'Use high-contrast focus ring', 'Add skip-to-content link', 'Add descriptive alt text to photos'],
        performance_reviewer: ['Add request queuing for audit endpoint', 'Convert images to WebP/AVIF', 'Configure PurgeCSS more aggressively', 'Update chart library', 'Support prefers-reduced-motion'],
        security_reviewer: ['Return 429 with Retry-After header', 'Set Secure flag on all environments', 'Restrict CORS to known origins', 'Add server-side card validation', 'Rate limit password resets', 'Add CSP to error pages', 'Use zxcvbn for password strength'],
        seo_reviewer: ['Use single H1 per page', 'Add internal links to orphan pages', 'Trim meta descriptions to 160 chars', 'Add lastmod to sitemap entries', 'Add dc:creator to RSS items', 'Generate dynamic meta descriptions'],
        observatory_reviewer: ['Set up billing synthetic monitoring', 'Lower error rate alert to 3%', 'Fix log retention cron job'],
      }

      const result = await db.qAReviewerResult.create({
        data: {
          runId: run.id,
          reviewer,
          score,
          status: 'completed',
          findings: JSON.stringify({
            issues: issueCount,
            details: details[reviewer] || [],
            summary: REVIEWER_SUMMARIES[reviewer],
            recommendations: recommendations[reviewer] || [],
          }),
        },
      })
      reviewerResults.push(result)
    }
    results.reviewerResults = reviewerResults.length

    // ── 3. QAExecutivePerspective (9 roles) ──────────────────────────────
    const perspectives = []
    for (const role of ROLES) {
      const data = PERSPECTIVES[role]
      const perspective = await db.qAExecutivePerspective.create({
        data: {
          runId: run.id,
          role,
          analysis: data.analysis,
          score: data.score,
          topConcern: data.topConcern,
          recommendation: data.recommendation,
          confidence: data.confidence,
        },
      })
      perspectives.push(perspective)
    }
    results.perspectives = perspectives.length

    // ── 4. QABoardReport ─────────────────────────────────────────────────
    const report = await db.qABoardReport.create({
      data: {
        runId: run.id,
        date: now,
        productScore: 92,
        uxScore: 88,
        engineeringScore: 91,
        conversionScore: 81,
        customerDelight: 87,
        technicalDebt: 22,
        biggestRisk: 'Billing page 500 error is blocking revenue — estimated $4,200/hr in lost conversions',
        todayPriority: 'Fix billing payment validation and mobile login modal within 24 hours',
        confidence: 0.91,
        scoreDelta: 3,
        reportContent: `# AI QA Center — Board Report

## Executive Summary
Product Health Score: **92/100** (+3 from previous run)

The platform remains in strong shape with a composite product score of 92. Security (97) and performance (92) continue to be our strongest categories. Two critical issues require immediate attention.

## Critical Issues
1. **Billing page returns 500 on invalid card** — Direct revenue impact, blocking payment flow
2. **Login modal stuck on mobile** — Affects 40%+ of our user base on mobile devices

## Score Breakdown
| Category | Score | Trend |
|----------|-------|-------|
| Security | 97 | → |
| Performance | 92 | ↑ |
| Functional | 94 | ↓ |
| UX | 88 | ↓ |
| SEO | 89 | → |
| Copy | 90 | ↑ |
| Product | 85 | → |
| Enterprise | 85 | → |
| Growth | 81 | ↓ |
| Accessibility | 83 | → |

## Risk Assessment
- **Technical Debt**: 22/100 (manageable, trending up)
- **Revenue Risk**: High (billing + conversion leaks)
- **Compliance Risk**: Medium (accessibility gaps)
- **Reputation Risk**: Low (copy quality is strong)

## Recommendations
1. Fix billing 500 error within 24 hours
2. Fix mobile login modal within 24 hours
3. Begin WCAG 2.1 AA compliance sprint
4. Optimize conversion funnel for mobile
5. Implement synthetic monitoring for billing flow

## 7-Day Outlook
With the critical fixes deployed, we project a product score of 94-95 within 7 days. Growth score should improve to 85+ with conversion optimizations.`,
      },
    })
    results.boardReport = 1

    // ── 5. QAIssue (~50 issues) ──────────────────────────────────────────
    const allIssues = [...ISSUE_TEMPLATES, ...ADDITIONAL_MINOR_ISSUES]
    const issues = []

    for (const tmpl of allIssues) {
      const issue = await db.qAIssue.create({
        data: {
          runId: run.id,
          title: tmpl.title,
          description: tmpl.description,
          page: tmpl.page || null,
          element: tmpl.element || null,
          severity: tmpl.severity,
          category: tmpl.category,
          reviewer: tmpl.reviewer,
          expectedBehavior: tmpl.expectedBehavior || null,
          actualBehavior: tmpl.actualBehavior || null,
          reproduction: tmpl.reproduction || null,
          userImpact: tmpl.userImpact || (tmpl.severity === 'critical' ? 'high' : tmpl.severity === 'major' ? 'medium' : 'low'),
          businessImpact: tmpl.businessImpact || (tmpl.severity === 'critical' ? 'revenue' : tmpl.severity === 'major' ? 'retention' : 'reputation'),
          status: tmpl.status || (tmpl.severity === 'critical' ? 'open' : tmpl.severity === 'major' ? 'confirmed' : randomFrom(['open', 'confirmed', 'fixed', 'wontfix'])),
          fixSuggestion: tmpl.fixSuggestion || null,
          evidence: tmpl.severity === 'critical' ? JSON.stringify({
            browser: 'Chrome 121, Safari 17.2',
            os: 'macOS 14.2, iOS 17.2',
            networkStatus: 'online',
            timestamp: new Date().toISOString(),
          }) : null,
        },
      })
      issues.push(issue)
    }
    results.issues = issues.length

    // ── 6. QAPageTest (~20 pages) ────────────────────────────────────────
    const pageTests = []
    for (let i = 0; i < PAGES.length; i++) {
      const page = PAGES[i]
      const isBilling = page.route === '/dashboard/billing'
      const isBlog = page.route.startsWith('/blog')
      const isLogin = page.route === '/login'

      const loadTime = isBilling ? randomInt(800, 1200)
        : isBlog ? randomInt(1800, 3200)
        : isLogin ? randomInt(600, 900)
        : randomInt(400, 1500)

      const hasErrors = isBilling
      const errorCount = isBilling ? 2 : (Math.random() > 0.85 ? 1 : 0)

      const consoleErrors = isBilling
        ? JSON.stringify(['Error: Internal Server Error', 'POST /api/billing/pay 500'])
        : errorCount > 0
        ? JSON.stringify(['Warning: Each child in a list should have a unique "key" prop.'])
        : '[]'

      const networkErrors = isBilling
        ? JSON.stringify([{ url: '/api/billing/pay', status: 500, method: 'POST' }])
        : '[]'

      const pageTest = await db.qAPageTest.create({
        data: {
          runId: run.id,
          url: page.url,
          route: page.route,
          loadTime,
          statusCode: 200,
          hasErrors: hasErrors || errorCount > 0,
          errorCount,
          consoleErrors,
          networkErrors,
          lighthouseScore: isBlog ? randomInt(62, 78) : randomInt(82, 98),
          accessibilityScore: randomInt(72, 96),
          clicksTested: page.route.startsWith('/dashboard') ? randomInt(8, 25) : randomInt(2, 8),
          formsTested: ['/login', '/register', '/contact', '/dashboard/billing', '/dashboard/settings', '/forgot-password'].includes(page.route) ? randomInt(1, 3) : 0,
          modalsOpened: ['/login', '/dashboard/billing', '/dashboard/settings'].includes(page.route) ? randomInt(1, 4) : 0,
        },
      })
      pageTests.push(pageTest)
    }
    results.pageTests = pageTests.length

    // ── 7. Historical QARuns for trend data (past 6 days) ────────────────
    const historicalRuns = []
    const baseScores = [88, 89, 90, 91, 90, 91] // 6 days of trend

    for (let i = 6; i >= 1; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(randomInt(2, 6), randomInt(0, 59), 0, 0)

      const base = baseScores[6 - i]
      const historicalRun = await db.qARun.create({
        data: {
          startedAt: date,
          completedAt: new Date(date.getTime() + randomInt(120000, 180000)),
          durationMs: randomInt(120000, 180000),
          productScore: base,
          uxScore: base - randomInt(2, 5),
          engineeringScore: base - randomInt(0, 3),
          conversionScore: base - randomInt(8, 14),
          accessibilityScore: base - randomInt(7, 12),
          securityScore: base + randomInt(3, 7),
          performanceScore: base + randomInt(0, 3),
          seoScore: base - randomInt(1, 5),
          customerDelight: base - randomInt(3, 7),
          criticalCount: i < 3 ? 3 : randomInt(0, 2),
          majorCount: randomInt(5, 12),
          mediumCount: randomInt(10, 18),
          minorCount: randomInt(25, 45),
          technicalDebt: randomInt(18, 28),
          status: 'completed',
        },
      })
      historicalRuns.push(historicalRun)

      // Also create board report for historical runs
      await db.qABoardReport.create({
        data: {
          runId: historicalRun.id,
          date: date,
          productScore: base,
          uxScore: base - randomInt(2, 5),
          engineeringScore: base - randomInt(0, 3),
          conversionScore: base - randomInt(8, 14),
          customerDelight: base - randomInt(3, 7),
          technicalDebt: randomInt(18, 28),
          biggestRisk: i < 3 ? 'Billing page 500 error blocking revenue' : 'Mobile UX issues affecting conversion',
          todayPriority: 'Continue fixing critical and major issues',
          confidence: randomInt(85, 95) / 100,
          scoreDelta: i === 6 ? 0 : randomInt(-2, 3),
          reportContent: `# Board Report — ${date.toLocaleDateString()}\n\nProduct Score: ${base}/100\n\nSteady improvement in platform quality. Focus continues on billing reliability and mobile experience.`,
        },
      })
    }
    results.historicalRuns = historicalRuns.length

    return NextResponse.json({
      success: true,
      message: 'AI QA Center database seeded successfully',
      results,
      runId: run.id,
    })
  } catch (error) {
    console.error('[QA Seed] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to seed QA data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
