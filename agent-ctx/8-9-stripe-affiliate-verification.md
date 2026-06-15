# Task 8 & 9: Stripe Webhook + Affiliate Cookie Verification

## Task 8: Verify Stripe Webhook + Registration Form Integration

### Existing Implementation Found

**Stripe Webhook Handler** (`src/app/api/webhooks/stripe/route.ts`):
- ✅ Handles `checkout.session.completed` — activates subscription, sets tier from amount
- ✅ Handles `customer.subscription.updated` — multi-level tier detection (priceId → metadata → amount fallback)
- ✅ Handles `customer.subscription.deleted` — sets tier to `free_trial`, status to `canceled`
- ✅ Handles `invoice.payment_succeeded` — processes affiliate commission on renewals
- ✅ Handles `invoice.payment_failed` — sets status to `past_due`
- ✅ Webhook signature verification via `stripe.webhooks.constructEvent()` when `STRIPE_WEBHOOK_SECRET` is set
- ✅ Graceful fallback: parses JSON directly in dev mode when no webhook secret

**Stripe Lib** (`src/lib/stripe.ts`):
- ✅ PLAN_PRICES configuration from env vars
- ✅ PLAN_AMOUNTS for fallback tier detection
- ✅ `mapSubscriptionStatus()` for Stripe → internal status mapping

**Checkout Flow** (`src/app/api/billing/create-checkout-session/route.ts`):
- ✅ Creates Stripe checkout session with metadata (userId, plan)
- ✅ Passes customer_email for new customers, reuses stripeCustomerId for existing
- ✅ Subscription data includes metadata for tier detection

**Billing Portal** (`src/app/api/billing/portal/route.ts`):
- ✅ Creates Stripe Customer Portal session for subscription management

### Gaps Found & Fixed

1. **Missing Prisma schema fields** — auth.ts referenced `role`, `passwordHash`, `avatarUrl`, `lastLoginAt` and `Session` model that didn't exist in the schema
   - **Fix**: Added all missing fields to User model and created Session model

2. **`trial` vs `free_trial` tier inconsistency** — Prisma default was `"trial"` but plan-limits.ts, middleware.ts, webhook handler all used `"free_trial"`
   - **Fix**: Changed Prisma default to `"free_trial"`, updated auth.ts registerUser default, added backward-compatible alias in plan-limits.ts

3. **No affiliate referral churn tracking on subscription deletion** — When a referred user cancelled, the AffiliateReferral status wasn't updated
   - **Fix**: Added churn tracking to `customer.subscription.deleted` handler — updates referral status to `churned` and decrements affiliate's `totalReferredActive`

4. **Missing `seosights_tier` cookie** — Middleware reads tier cookie for rate limiting but register/login routes didn't set it
   - **Fix**: Added `seosights_tier` cookie to register and login responses; added cleanup to logout

---

## Task 9: Verify Affiliate Cookie DB Structure for Reseller Link Tracking

### Existing Implementation Found

**Prisma Schema** — Affiliate, AffiliateReferral, AffiliatePayout models:
- ✅ `Affiliate`: unique code, active referral count, earnings, payout tracking
- ✅ `AffiliateReferral`: status lifecycle (registered → active → churned), firstPaymentAt
- ✅ `AffiliatePayout`: commission details with percentage, source amount, Stripe transfer ID

**Affiliate Lib** (`src/lib/affiliate.ts`):
- ✅ Graduated commission scale (10% → 20% → 30% → 40% → 50%)
- ✅ `processAffiliateCommission()` — called from Stripe webhook on checkout and renewal
- ✅ `registerAffiliate()` — creates affiliate record with unique code
- ✅ `linkReferralToAffiliate()` — links referred user to affiliate
- ✅ `getAffiliateStats()` — comprehensive dashboard data

**Cookie Setting** (`src/app/page.tsx`):
- ✅ Reads `?ref=` URL parameter on page load
- ✅ Stores in `seosights_ref` cookie with 60-day expiry
- ✅ Cleans URL after storing cookie

**Registration Flow** (`src/components/landing/LoginModal.tsx` → `src/lib/auth-context.tsx` → `src/app/api/auth/register/route.ts` → `src/lib/auth.ts`):
- ✅ LoginModal reads `seosights_ref` cookie and sends as `referralCode`
- ✅ auth.ts `registerUser()` resolves referral code → sets `referredByAffiliateId` → creates `AffiliateReferral` record
- ✅ If registering as affiliate role, auto-creates Affiliate record

**API Routes**:
- ✅ `/api/affiliate/register` — register as affiliate
- ✅ `/api/affiliate/validate` — validate affiliate code
- ✅ `/api/affiliate/stats` — get affiliate dashboard data

**Commission Processing**:
- ✅ Triggered on `checkout.session.completed` (first payment)
- ✅ Triggered on `invoice.payment_succeeded` (renewals)
- ✅ Calculates graduated commission based on active referral count
- ✅ Records payout with percentage and source amount
- ✅ Updates affiliate earnings counters
- ✅ Updates referral status to `active` on first payment

### Gaps Found & Fixed

1. **No churn tracking on subscription cancellation** — When a referred user cancelled, the referral stayed as `active`
   - **Fix**: Added churn tracking to webhook `customer.subscription.deleted` handler (covered in Task 8)

2. **Missing tier cookie for middleware rate limiting** — Would cause all authenticated users to be rate-limited as `free_trial`
   - **Fix**: Added `seosights_tier` cookie to register/login routes

3. **No referral cookie cleanup on logout** — Stale referral cookie could cause issues
   - **Fix**: Added `seosights_ref` cookie cleanup to logout handler

### Files Modified

- `prisma/schema.prisma` — Added `role`, `passwordHash`, `avatarUrl`, `lastLoginAt` to User; added `Session` model; changed tier default from `"trial"` to `"free_trial"`
- `src/app/api/webhooks/stripe/route.ts` — Added affiliate churn tracking on subscription deletion
- `src/lib/auth.ts` — Fixed default tier from `'trial'` to `'free_trial'`
- `src/lib/plan-limits.ts` — Added backward-compatible `trial` alias for `free_trial`
- `src/app/api/auth/register/route.ts` — Added `seosights_tier` cookie
- `src/app/api/auth/login/route.ts` — Added `seosights_tier` cookie
- `src/app/api/auth/logout/route.ts` — Added cleanup for `seosights_tier` and `seosights_ref` cookies
