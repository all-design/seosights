# Task 3 - Connect CTA Buttons to Registration with Stripe Tier

## Summary
All "Get Started", "Start Free Trial", and pricing CTA buttons on the landing page now route through a new RegistrationDialog component that carries the selected pricing tier (starter/pro/managed) through registration and into Stripe checkout.

## Files Created
1. **`src/components/auth/RegistrationDialog.tsx`** - New tier-aware registration dialog
2. **`src/app/api/stripe/checkout/route.ts`** - New Stripe checkout API route

## Files Modified
1. **`prisma/schema.prisma`** - Added passwordHash, role, avatarUrl, lastLoginAt to User model; added Session model
2. **`src/lib/auth.ts`** - registerUser() now accepts optional `tier` parameter
3. **`src/app/api/auth/register/route.ts`** - Now accepts and validates `tier` parameter
4. **`src/lib/auth-context.tsx`** - register() function now supports `tier` parameter
5. **`src/components/billing/PricingCard.tsx`** - Now accepts `onTierSelect` callback with RegistrationTier type
6. **`src/components/landing/PricingSection.tsx`** - Now accepts and passes through `onTierSelect` prop
7. **`src/app/page.tsx`** - Manages RegistrationDialog state with selectedTier, wires all CTA buttons

## CTA Button Wiring
| Button | Location | Tier |
|--------|----------|------|
| "Start 1-Month Free Trial — Full Report" | HeroSection | starter |
| "Start Free Trial" | PricingSection (Starter card) | starter |
| "Start Pro Agency" | PricingSection (Pro card) | pro |
| "Contact Us" | PricingSection (Managed card) | managed |
| "Analyze My Site — Free" | CTASection | starter |
| "Analyze Site" | Navbar | URLInputModal (scan flow, unchanged) |

## Flow
1. User clicks CTA button → RegistrationDialog opens with selected tier
2. User fills form (Name, Email, Password, Confirm Password) → POST /api/auth/register with tier
3. Registration succeeds → POST /api/stripe/checkout with userId + tier
4. For starter/pro: redirect to Stripe checkout session
5. For managed: scroll to CTA contact form section
