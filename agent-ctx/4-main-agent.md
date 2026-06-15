# Task 4: Agency/Managed Button Routing with Agency Form

## Summary
Implemented specialized agency registration flow that opens when users click "Managed" or "Agency" tier buttons instead of the normal registration dialog.

## Files Created
1. **`src/components/auth/AgencyRegistrationDialog.tsx`** — Two-step dialog form (Account → Branding) with logo upload, HEX color pickers, real-time brand preview, and success state
2. **`src/app/api/auth/register/agency/route.ts`** — POST API that creates managed-tier agency users with branding fields

## Files Modified
1. **`prisma/schema.prisma`** — Added `agencyAccentColor` field to User model
2. **`src/components/billing/PricingCard.tsx`** — Added `onAgencyRegister` prop; managed/contact actions now open agency dialog for unauthenticated users
3. **`src/components/landing/PricingSection.tsx`** — Added `onAgencyRegister` prop; changed Managed plan ctaAction to 'managed'
4. **`src/app/page.tsx`** — Added AgencyRegistrationDialog with state management

## Key Design Decisions
- Two-step form separates account creation from branding configuration
- Logo stored as base64 data URL in `agencyLogoUrl` field
- HEX colors validated with regex on both client and server
- Real-time brand preview renders like a report header
- On success: "We'll contact you within 24 hours" (managed requires manual setup)
- User gets starter-level access while awaiting manual activation

## Verification
- `bun run db:push` — schema synced successfully
- `bun run lint` — passes with no errors
