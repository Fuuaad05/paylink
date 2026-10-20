# Wallet balance dashboard update

Prerequisite: apply the previous storefront update first (including its product-details SQL migration). This small patch is based on that version.

1. Stop the server with Ctrl+C.
2. Merge the ZIP's `app/` folder into your existing paylink project, replacing matching files. Copy docs too if desired. Keep `.env.local`.
3. Run `npm run dev`. This patch needs no SQL, environment changes or additional packages.
4. Sign in with Rabby. Wallet balance appears on Sell, Sales and My purchases, above the tab content. Checkout retains its existing balance guidance.
5. Click Refresh balance after receiving or spending test MUSD. Compare the value against Rabby on Mezo Testnet for the same address.
6. Switch wallets and sign in again. The previous account's card is discarded. Sign out: the balance card disappears.

The card reads the official Mezo testnet MUSD token through the existing read-only RPC helper. No wallet signature, allowance or transaction is requested. Zero is displayed only after a successful balance read; a failed read displays Unavailable and a retry message. The checked timestamp is the local time of the latest successful RPC read. The card is a snapshot, not a continuously updated balance.

Wallet balance includes all MUSD held at the address, including faucet funds, transfers and sales proceeds. It is not the seller's historical sales revenue. Sales remains a separate report based on confirmed PayLink orders.

Verification: TypeScript and production build checks. Actual RPC display and responsive layout must be checked in the builder's browser; no live wallet credentials are available in the build environment.
