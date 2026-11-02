# Install the Wave 2 update

This is a code update to the existing Vercel/Supabase deployment. It does not create a new Supabase project or change your existing keys.

1. Copy the update files into your existing `paylink` folder. Keep your `.env.local` and current product data.
2. In Supabase's SQL Editor, run **only** `supabase/migrations/202610310001_creator_plan.sql` once. Do this **before deploying this code**. The migration adds creator plans, enforces publishing quotas, and backfills global authorization/receipt claims from existing product orders.
3. Add `PAYLINK_TREASURY_ADDRESS` to `.env.local` and Vercel Environment Variables. Use the public Ethereum wallet address where you want PayLink's Creator plan payments sent. This is not a private key. If blank, paid plans are disabled. Product purchases continue paying sellers directly.
4. Add `NEXT_PUBLIC_DEMO_VIDEO_URL` with your public/unlisted YouTube demo link. It appears on `/evidence`. Keep it updated when you record the Wave 2 demo.
5. Run `npm ci`, `npm test`, `npm run test:database`, `npm run typecheck`, and `npm run build`.
6. Push your code to GitHub and let Vercel redeploy. Check `/evidence` and `/pitch-deck.pdf` in an incognito window. The deck is now committed with the application instead of relying on a separate attachment.
7. Complete `docs/WAVE2-ACCEPTANCE.md` before claiming the new wallet flows are verified.

## Business model

- Free: up to 3 published products.
- Creator: 3 test MUSD for 30 days, up to 25 products.
- No automatic renewal and no buyer surcharge. Existing products and downloads remain accessible after expiry; the limit only gates new publishing.
- The fee is an actual x402 MUSD transfer to the treasury, verified before entitlement is granted. Plan receipts are visible in the Creator plan tab.
- Three confirmations, saved authorizations, atomic settlement locks, global payment claims and idempotent database activation protect recovery. A submitted payment that times out must be reconciled; do not pay again.

## Mainnet and rollout

This remains testnet-only. Neither new flow is represented as independently tested. Do not change chain IDs or token addresses to mainnet without a separate review and acceptance run.

Independent feedback must come from real participants. Use the pilot guide; do not fill it with simulated testimonials.
