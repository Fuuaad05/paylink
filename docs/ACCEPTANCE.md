# Manual acceptance checklist

These checks require your Supabase project and wallet approval. They have not been completed in the development environment.

1. Missing environment values show setup guidance, not a fake balance or a working-payment claim.
2. Enable Supabase Web3 auth; sign in as Seller in Rabby. Rejecting the signature produces a useful error.
3. Create a small trusted TXT/PDF priced at 0.01 MUSD. Confirm the storage bucket is private and public unauthenticated requests cannot download its object.
4. Copy the checkout URL. Sign out; sign in as a different Buyer account. Confirm the selected Rabby account matches the session.
5. Confirm the checkout displays the actual seller address, product and price. Reject a payment signature; the order remains pending.
6. Pay with test MUSD. Confirm token, transfer value, payer and recipient in the Mezo explorer.
7. While confirming, refresh. The order must stay `settling`; no second payment signature should be requested.
8. Choose Verify payment after 3 confirmations. Confirm the order becomes paid and download succeeds.
9. Close the browser tab; reopen the app and sign in as Buyer. My purchases must show the paid order. Download it again without a payment prompt.
10. Sign in as another wallet. Attempts to request the Buyer's order or download URL must fail. Guessing a public wallet address is insufficient.
11. Expire a signed download URL (60 seconds). It must stop working; the authenticated buyer can request a new one.
12. Simulate a response lost after settlement. The same order must be reused. If its hash was not persisted, reconcile using the original hash; a hash with the wrong signature, recipient or amount must fail.
13. Submit two simultaneous payment requests for one order. At most one can acquire the pending→settling lock. Inspect database status and chain transfers.
14. Check failed network / facilitator calls leave a reviewable settling order rather than silently signing a fresh charge.
15. Repeat on the deployed Vercel origin after configuring Supabase redirect URLs.
16. Before submission, capture a two-wallet successful payment and recovery demo, review source and secret handling, and make the repository and deployment public.
