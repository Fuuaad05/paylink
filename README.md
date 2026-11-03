# PayLink

MUSD checkout for digital products, with private delivery and recoverable purchases. Built by Fouad Abdulhakeem for Mezo's Access & Distribution track.

**[Live app](https://paylink-omega-three.vercel.app/)** · **[Evidence and receipts](https://paylink-omega-three.vercel.app/evidence)** · **[Pitch deck PDF](public/pitch-deck.pdf)** · **[Wave 2 setup](docs/WAVE2-SETUP.md)**

The `/evidence` and PDF links become live when this update is deployed. Set `NEXT_PUBLIC_DEMO_VIDEO_URL` to expose the public/unlisted YouTube demo there.

## What changed for Wave 2

- **Get MUSD at checkout:** a BTC-to-MUSD swap through the official Mezo Testnet basic pool. Verifies the chain, router, factory, pool identity, reserves and quote before signing. Shows a minimum output and bounded slippage. BTC approval is exact; swap output goes to the buyer. The product purchase remains a separate, explicit payment.
- **Creator plan:** free publishing up to 3 products; 3 MUSD for 30 days and up to 25 products. No automatic renewal or buyer surcharge. Existing products and downloads survive expiry. Payments go to a configured treasury and activate access once after verified settlement.
- **Receipt evidence:** public `/evidence`, a committed PDF deck, Wave 1 and Wave 2 receipts, and Copy evidence in the Sales dashboard.
- **Recovery hardening:** global authorization and transaction-hash claims prevent one payment being used across product and plan orders. Creator plan settlement can be reconciled without another charge.

## Evidence judges can verify

Mezo Testnet, chain **31611**. Official MUSD: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` (18 decimals).

| Field | Wave 1 20 MUSD purchase |
|---|---|
| Seller | `0x311b0fb3f0f317b06676a3a342f4e67084844cd8` |
| Buyer / MUSD payer | `0x973e0761c3c7c932641484c7b549a99b24d9ff06` |
| Date | October 20, 2026 |
| Transaction | [`0x8a1b262226588bcf2de8ca28587c5e1e9ec4f8896452d4a6d5d9bf224f20cb5e`](https://explorer.test.mezo.org/tx/0x8a1b262226588bcf2de8ca28587c5e1e9ec4f8896452d4a6d5d9bf224f20cb5e) |

The hash and full wallets were recovered from the original demo recording. Wave 1 judges independently traced the 20 MUSD and earlier 0.01 MUSD purchases. Only the 20 MUSD hash is currently included; no hash has been invented for the earlier purchase. The transaction sender is a facilitator; identify buyer and seller from MUSD **Transfer logs**.

## Status and limits

Wave 1 product payment and downloads were exercised by the builder and payment was independently traced by judges. Wave 2 now has confirmed testnet transactions through PayLink’s configured Mezo Pools router: [0.005 BTC → 392.93150772138529189 MUSD](https://explorer.test.mezo.org/tx/0x9a10cee76f5561bd3c4b50198ca8cbc4af52d7fb9d6f62896c3cbb65e1d3ec56), followed by a [400 MUSD direct seller payment](https://explorer.test.mezo.org/tx/0x00c80a97523507f05cf8ac8f4e6332971f92c2832737cd819b3598f2952ae57b). Both 3 MUSD Creator plan payment receipts are linked on `/evidence`. The builder confirmed activation and extension, and recorded purchase/download/recovery. These are builder-controlled wallets; **independent user testing remains pending**. The earlier read-only pool check in `docs/pool-read-check.json` is retained as historical development evidence.

`docs/evidence.json` records this distinction. `npm run submission:check` intentionally reports missing video/acceptance evidence until the remaining video and independent pilot evidence are supplied. Read [the live acceptance checklist](docs/WAVE2-ACCEPTANCE.md) and [pilot guide](docs/PILOT.md).

## Install

Use Node.js 22+.

```sh
npm ci
# Copy .env.example to .env.local and set your existing Supabase values.
npm run dev
```

For an **existing** deployment, apply `supabase/migrations/202610310001_creator_plan.sql` once in Supabase **before deploying**. Keep your keys, storage and existing tables. Set `PAYLINK_TREASURY_ADDRESS` to your public revenue wallet and `NEXT_PUBLIC_DEMO_VIDEO_URL` to your YouTube demo. No wallet private key is required. See [Wave 2 setup](docs/WAVE2-SETUP.md).

For a fresh project, run all migrations in filename order and follow [the original setup guide](docs/SETUP.md).

## Validation

```sh
npm run typecheck
npm test
npm run test:database
npm run build
npm run verify:pools     # requires live access to the configured testnet RPC
npm run submission:check # requires actual completed acceptance evidence and a demo URL
```

Database checks use PGlite/PostgreSQL to execute the migration and exercise publishing limits, expiry, receipt requirements and idempotent activation. They do not prove hosted Supabase policies or real-wallet settlement. Tests and builds are not a security audit.

## Architecture

Next.js / TypeScript on Vercel; Supabase Auth, Postgres and private Storage; x402 exact MUSD payments; viem; explicit installed-wallet selection and WalletConnect QR pairing. No Render backend is needed.

Creators publish a private file and a public checkout page. Protected server routes derive the seller address from verified wallet identity. Each buyer reuses a unique product order. The server persists a settlement lock and authorization before calling the facilitator, then checks the token, MUSD payer, recipient, amount, signature and three confirmations. Paid orders can issue fresh 60-second download URLs without another charge.

Payments and Postgres are not a globally atomic transaction. Interrupted settlements remain saved for reconciliation. Do not automatically reset a settling order or charge again. Short-lived URLs can be shared until expiry; downloaded files can be redistributed. There is no malware scanning. Use trusted files and test tokens only.

## Development record and attribution

October 12 preparation used a Cloudflare/D1 invoice prototype. October 18-20 work introduced the current Next.js product-delivery architecture. The new funding, creator plan, evidence and deck update began October 31, 2026; dates are disclosed rather than presented as later work.

Network addresses and minimal pool ABIs follow [Mezo's documentation](https://mezo.org/docs/developers/features/mezo-pools/) and [mezo-org/tigris](https://github.com/mezo-org/tigris). See [integration notes](docs/MEZO-POOLS.md). React, Next.js, Supabase, viem, x402, WalletConnect, QRCode, Lucide and PGlite retain their licenses. AI assisted implementation. No competitor code is included.
