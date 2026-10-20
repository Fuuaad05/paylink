# Set up PayLink on your laptop, Supabase and Vercel

## 1. Create Supabase

1. Visit https://supabase.com/dashboard and sign up (GitHub sign-in is convenient).
2. Create a project named `paylink`. Choose a strong database password and save it privately. This app uses Supabase's HTTPS API; its environment settings do not need the database password.
3. Wait for project provisioning.
4. In the SQL Editor, paste the entire contents of `supabase/migrations/202610180001_paylink.sql` and run it once. It creates products, orders, delivery events and a private `products` storage bucket.
5. In Authentication → Sign In / Providers, enable Web3 / Ethereum wallet sign-in.
6. In Authentication → URL Configuration, add `http://localhost:3000/**` to redirect URLs for development. After deploying, add the exact Vercel origin followed by `/**`. Do not allow arbitrary domains.
7. From the project's Connect / API settings, copy the Project URL and publishable key (or legacy anon key). Under API Keys, find the server service-role key (legacy service_role works). Keep the service key secret.

## 2. Run locally in VS Code

Install Node.js 22 or newer. Extract the ZIP and open the `paylink` folder in VS Code. In its terminal:

```sh
npm ci
```

Copy `.env.example` to `.env.local`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Replace these values in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: your Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your publishable / anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: server service-role key. Never share it publicly or prefix it with NEXT_PUBLIC_.
- `APP_ORIGIN`: `http://localhost:3000` locally.

Leave Mezo RPC and facilitator settings at their documented testnet defaults.

```sh
npm run dev
```

Open http://localhost:3000. The app shows setup guidance if public settings are missing. Add environment values and restart the dev server after changing them.

Run both SQL migrations in filename order for a fresh project. Existing projects must run only the new `202610190002_product_details.sql` migration, once. It adds optional metadata columns and a public covers bucket; purchased files remain private.

## 3. Test wallet connections

Choose an installed Ethereum wallet explicitly through Connect wallet, or select WalletConnect for QR pairing. Configure NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID from .env.example and allow your local/deployed website origins in Reown Dashboard. Sign-in is a message, not a payment. See docs/WALLETCONNECT-UPDATE.md for setup and mobile testnet limitations.

Use two regular Ethereum accounts: Seller and Buyer. On the Buyer account, hold test MUSD on Mezo Testnet (chain ID 31611). Official testnet MUSD: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`, 18 decimals. Test BTC / MEZO alone is not test MUSD. Obtain test BTC at https://faucet.test.mezo.org/ and follow Mezo's instructions at https://testnet.mezo.org to obtain MUSD.

The x402 flow is designed for facilitator-sponsored settlement gas. Borrowing or swapping to acquire MUSD is separate and may require test BTC. Verify the current facilitator supports the Mezo testnet before signing.

Follow `docs/ACCEPTANCE.md`. Do not use real funds.

## 4. Put the project on GitHub

At https://github.com/new create a repository named `paylink` under `Fuuaad05`. Keep it private during setup if preferred; it must be public for submission. Do not add a README in GitHub if using these existing files.

In VS Code's terminal:

```sh
git init
git add .
git commit -m "Build MUSD checkout and purchase recovery"
git branch -M main
git remote add origin https://github.com/Fuuaad05/paylink.git
git push -u origin main
```

Authenticate through GitHub's own prompt. Never send your password, access token or wallet secrets in chat. `.env.local` is ignored by Git. Confirm it is not listed in `git status` before committing.

## 5. Deploy on Vercel

1. In Vercel, Add New → Project → import `Fuuaad05/paylink`.
2. Choose the Next.js framework preset. Use Node.js 22+ and the default build command.
3. Add every environment variable from `.env.local` to Vercel's project environment settings, with `APP_ORIGIN` set to the eventual production URL such as `https://your-project.vercel.app`. You can set the final origin after the first deployment and redeploy.
4. Deploy. Add this exact origin to Supabase's Auth redirect URL allowlist (`https://your-project.vercel.app/**`) and Site URL.
5. Redeploy after changing environment variables.
6. Repeat the acceptance tests on Vercel. A successful local build does not prove hosted authentication, file policies or settlement works.

No Render service is required. Do not add a separate Supabase Edge Function; this app's API runs in Vercel Functions.

## 6. AKINDO

Create your team using `PayLink` as a working name and list yourself as the human builder. Track 2: Access and Distribution. Disclose the October 12 preparation baseline and the features added during Wave 1. Submit only after the public deployment, repository, pitch deck and two-minute video are ready. Confirm the deadline timezone in AKINDO.
