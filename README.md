# PayLink

MUSD checkout with recoverable digital purchases, built by Fouad Abdulhakeem for the Mezo Buildathon.

Sellers upload a digital file, set its price in MUSD and share a checkout link. Buyers authenticate with an Ethereum wallet, pay with MUSD on Mezo testnet, and receive short-lived access to a private file. Returning buyers sign in with the same wallet and recover an existing paid purchase.

## Stack

Next.js / TypeScript on Vercel, Supabase Postgres / Auth / private Storage, x402 exact payments, official Mezo testnet MUSD, viem, installed-wallet selection via EIP-6963, and WalletConnect Ethereum Provider with QR pairing.

## Start here

Follow **[docs/SETUP.md](docs/SETUP.md)**. No wallet private key is required for the app. Keep the Supabase service role key exclusively on the server.

```sh
npm ci
# Copy .env.example to .env.local and complete its settings.
npm run dev
```

Validation:

```sh
npm run typecheck
npm test
npm run build
```

## Included

- Explicit installed-wallet picker and WalletConnect QR pairing; Supabase wallet sign-in.
- Seller products with authenticated, immutable file uploads.
- Read-only dashboard wallet balance on Mezo Testnet, with refresh and timestamp, separate from sales revenue.
- Seller Sales dashboard with paid orders, exact MUSD revenue, buyer payment wallets, dates and transaction receipts.
- Server-derived payout wallet from the seller's verified Web3 identity.
- Shareable checkout, copyable HTML buy buttons with preview, and a standalone storefront integration example.
- Optional public cover images and server-derived file type/size; private purchased files.
- Mezo network guidance, exact MUSD balance checks before payment signing, and bounded confirmation polling.
- x402 payment quotes, wallet signing and facilitator settlement on Mezo testnet.
- Durable buyer orders, atomic settlement locks and unique payment authorizations / transaction hashes.
- Token, payer, recipient, amount, confirmation and payment-signature validation.
- Paid-order recovery and private 60-second download URLs.
- Reconciliation of interrupted settlements using the existing transaction hash.
- Database migration, API documentation and manual acceptance checklist.

## Current status

The builder reports successful local Supabase wallet authentication, product publication, a funded two-wallet test MUSD payment, private download, repeat download and seller sales display. These user-run checks are separate from automated verification in the development environment.

The October 19 storefront update adds website-button generation, optional public covers, server-derived file details, balance/network guidance and bounded confirmation checks. Run the new product-details migration before using this update. Its hosted Supabase migration and updated wallet flow still need the builder's acceptance check. Vercel deployment and the public submission materials remain outstanding.

The older October 12 prototype used Cloudflare/D1 and direct ERC-20 transfers. This October 18 implementation targets standard Next.js/Vercel/Supabase and adds product delivery, wallet authentication, x402 and recovery. Original preparation dates remain disclosed.

## Recovery guarantee and limits

A unique `(product_id, buyer_id)` row makes the same signed-in buyer reuse the same order. A database update from `pending` to `settling` elects one settlement attempt. The original authorization is saved before calling the facilitator. Once `paid`, the order can issue new download URLs without another charge.

Payments cross a blockchain and a database; this is not a globally atomic transaction. A timeout after signing or settlement can leave an order in `settling`. The app blocks replacement payments and allows reconciliation of the original on-chain transaction. If a payment definitely failed, there is intentionally no automatic reset: resolve it after inspecting chain history to avoid a possible second charge. User-initiated retries do not promise permanent delivery availability or protection from a seller deleting a file outside the app.

## Security boundaries

- Mezo testnet only; do not use real money.
- Supabase verifies the wallet sign-in. All protected routes call `auth.getUser` server-side.
- The browser cannot directly read or edit payment tables. Service-role operations enforce user ownership.
- Download URLs are bearer links and shareable until their 60-second expiration. The application cannot prevent a buyer redistributing downloaded files.
- Files are limited to 10 MB. There is no malware scanning or content moderation; only distribute trusted files during the demo.
- The signing key stays in the selected wallet. Payment authorizations are sensitive and never returned in the public product API.
- RLS and live authorization behavior require testing in your Supabase project before exposing the app widely.
- Configure Auth rate limits, exact redirect URLs and Vercel protections as appropriate before a public pilot.
- Smart-contract wallets are not tested; use regular Ethereum accounts for initial acceptance.
- A full merchant SDK, signed webhook delivery, and automated settlement discovery are future work. They are not implemented here.

## Credits

React, Next.js, Supabase, viem, x402 SDKs, WalletConnect Ethereum Provider, QRCode and Lucide icons retain their licenses. Network/token settings follow Mezo's developer documentation. AI assisted implementation. No competitor code is included.

## Wallet connection setup

Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` using `.env.example` and configure localhost and the final Vercel origin in your Reown project. Installed wallets can be selected without WalletConnect; QR pairing requires the project ID and a wallet supporting Mezo Testnet. See [docs/WALLETCONNECT-UPDATE.md](docs/WALLETCONNECT-UPDATE.md).

The builder has reported successful local Rabby sign-in, product publication, test MUSD purchase, repeat download, seller sales and dashboard balance. The new wallet picker and WalletConnect path still require real browser pairing/sign-in/payment checks. Public deployment and submission materials remain outstanding.

Automated validation for this update: TypeScript check, 42 tests and production build pass. These do not substitute for testing real mobile wallet pairing and settlement.
