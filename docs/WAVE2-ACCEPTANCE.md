# Wave 2 live acceptance

Record date, wallet, action, transaction hash, expected result and observed result. Use test tokens only. Automated tests are not a substitute for these checks.

## Get MUSD at checkout

1. Open a product as a separate buyer with insufficient MUSD and some test BTC for swapping plus gas.
2. Choose Get MUSD with test BTC. Read a quote and confirm the router, input and minimum output. A zero-liquidity or unavailable pool must show an error and disable swapping.
3. Switch wallets while quoting; signing must fail until you sign in correctly. Reject an approval; no swap should be sent.
4. Obtain a new quote, approve the exact input amount, and swap. Save the hash, confirm MUSD Transfer output to the buyer and refresh the balance.
5. Pay the product separately. Verify delivery, close the page and recover the same paid purchase.
6. Test a confirmation timeout or reload after swap submission. Check the saved swap receipt; do not initiate another swap while the existing one is pending.
7. Let a quote expire. Request a new one; stale signing must be rejected.

## Creator plan

1. Confirm free publishing allows 3 products and blocks a fourth at the database level. Existing products remain purchasable.
2. Check the plan price (3 MUSD), treasury recipient, 30-day duration and lack of auto-renewal.
3. Pay using the seller wallet; save the hash and verify the MUSD Transfer to the treasury.
4. Verify the expiry and limit become active only after confirmations. Publishing a fourth product should now succeed.
5. Reconcile the same receipt twice; expiry must not extend twice. A receipt from a product order must not activate a plan.
6. Test rejection, timeout, account switching, unauthenticated calls and a receipt belonging to another seller.
7. Confirm expiration does not remove existing products or buyer downloads. Use the database fixture test for expiry until enough real time has passed.

## Submission closure

- In Sales, use Copy evidence and append real receipts to `docs/evidence.json`.
- Add the swap and plan payment receipts once live testing succeeds; do not mark a flow verified based only on its UI.
- Set `wave2LiveAcceptance` entries to descriptive dated results only after testing.
- Link your new video using `NEXT_PUBLIC_DEMO_VIDEO_URL`.
- Open the live app, evidence page and PDF without signing in.
- Run `npm run submission:check`. Its pending warnings are intentional until real evidence is entered.
