# Wallet picker and WalletConnect update

Install on the latest PayLink version (storefront update and wallet balance already applied).

1. Stop the development server with Ctrl+C.
2. Merge `app/`, `lib/`, `tests/` and `docs/` from this ZIP into your existing project. Replace `package.json`, `package-lock.json`, `README.md` and `.env.example` with the included versions. KEEP your `.env.local` and existing Supabase project.
3. Add this PUBLIC configuration value to `.env.local` (and later Vercel environment settings):

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a29d4d569cfa33934fd7c4cac9112f49
```

4. In Reown Dashboard, configure the project's allowed website origins to include `http://localhost:3000`. Add the final Vercel origin after deployment. The connection metadata uses the origin from which the app is opened. Use the Starter plan without a paid upgrade for initial testing, subject to Reown's eligibility/usage terms.
5. Run `npm ci`, then `npm run dev`. Do not run `npm audit fix --force`.
6. Sign out of any old PayLink session. Choose **Connect wallet** and explicitly pick an installed wallet or WalletConnect. For WalletConnect, scan the QR using a compatible wallet. On the same device, the open-wallet link requires an installed wallet that handles `wc:` links; otherwise copy the pairing URI into the wallet if supported. Approve pairing and the separate sign-in message.
7. The mobile wallet must support Mezo Testnet (chain 31611), personal_sign and EIP-712 typed-data signing. Add Mezo Testnet to the wallet if needed. WalletConnect does not guarantee every wallet supports a custom testnet. Regular Ethereum accounts are the supported baseline; contract wallets remain untested.
8. Repeat the funded two-wallet sale and download/recovery test. Confirm a non-Rabby installed wallet works; reload and confirm reconnect/payment keeps that same provider; change its account and ensure PayLink signs out; disconnect from the mobile wallet and verify the session is cleared; decline sign-in and payment prompts; open and close the QR picker without signing in. Your old purchases remain linked to the same Supabase wallet identity.
9. Commit the update from your existing project, then push:

```
git add .
git commit -m "Add wallet picker and WalletConnect support"
git push
```

Review `git status` first; `.env.local` must remain ignored. No SQL migration is needed for this update.

## Verification and boundaries

Unit tests exercise wallet discovery/deduplication without permission requests, explicit provider selection, restore races, account matching before payment and disconnect cleanup. QR rendering and real pairing/sign-in/payment require browser acceptance on localhost and Vercel. Closing the picker stops authentication, but the pairing proposal can remain in a wallet until dismissed or expired. A pending proposal is reused rather than creating concurrent requests.

This implementation uses the WalletConnect Ethereum Provider with a custom picker/QR UI, not Reown Auth or embedded wallets. Supabase remains the authentication system. The provider is loaded only when selected. Website origins must be configured in your own Reown project. Reown's public starter pricing does not guarantee eligibility for a payment/e-commerce use case; review its terms before a commercial launch.

The Project ID is public and safe in frontend configuration. Pairing URIs are temporary sensitive connection data: they are generated in-browser, are not sent to PayLink APIs, and must not be posted publicly.

Build validation: TypeScript, all 42 tests, and the production build passed. No real mobile wallet pairing or settlement was executed in this development environment.
