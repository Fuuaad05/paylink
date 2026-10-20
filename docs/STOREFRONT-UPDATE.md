# Install the storefront and checkout update

1. Stop your development server (Ctrl+C).
2. Merge `app/`, `lib/`, `supabase/`, `examples/`, `tests/` and `docs/` from this ZIP into your existing paylink project, replacing matching files. Keep `.env.local`, `package.json` and `package-lock.json`.
3. In your EXISTING Supabase project's SQL Editor, open a new query. Paste the complete contents of `supabase/migrations/202610190002_product_details.sql` and Run. Do NOT rerun the original create-tables migration. The new migration preserves existing product and purchase rows.
4. Run `npm run dev`. No package installation or new environment values are needed.
5. Sign in as seller. For your existing product, choose **Cover & file details**, optionally upload a PNG/JPEG/WebP up to 2 MB, then Save details. Saving also adds the original purchased file's type and size. Existing product URLs and purchases still work.
6. Choose **Add to website** to preview/copy the HTML button or checkout link. The button opens hosted checkout in another tab. Use **Open sample storefront** to demonstrate a merchant page using your product. After Vercel deployment, copy again from the public deployment so links do not point to localhost.
7. As buyer, open checkout. Check network/balance guidance. Try an unfunded wallet: payment must be blocked before a payment signature. A funded payment should proceed normally. When the saved order has a transaction hash, confirmations are checked up to 24 times, five seconds apart. No new payment is signed by this checker. Manual Verify payment remains available, including pasting a hash when a settlement response was lost.
8. Check paid/repeat downloads and seller Sales again, and test that another wallet cannot download your purchase or edit the seller's product.

Covers are PUBLIC preview images. Never upload private content as a cover. Purchased files remain in the original private products bucket.

Existing products have blank metadata until you Save details. No new file or payment is needed. A saved cover cannot currently be removed in the UI, but it can be replaced.

Automatic checking is bounded and uses the original saved payment. It does not discover a lost transaction hash or reset a failed settlement. Keep the original transaction receipt for manual recovery.

Verification: automated tests cover funds, chain-add/rejection handling, bounded polling and cancellation, safe embed output, file limits and storage ownership. Fixtures cannot validate your hosted Supabase policies or actual wallet prompts. Recheck those after applying the migration and after deployment.

The production build and 36 tests passed. A browser-based visual test could not run in the build environment because Chromium was unavailable; check the new pages on desktop and mobile during your local acceptance test.
