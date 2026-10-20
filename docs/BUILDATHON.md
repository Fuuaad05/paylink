# Mezo Buildathon record

Working team/project: PayLink
Builder: Fouad Abdulhakeem — https://github.com/Fuuaad05
Track: 2 — Access and Distribution
Category: MUSD digital purchase infrastructure

## One sentence
PayLink lets developers and creators accept MUSD for digital products, then lets authenticated buyers recover their purchases after a lost connection without another charge.

## Development record

- October 12 preparation: Cloudflare/D1 invoice prototype, direct MUSD transfers, server-side validation and a private hosted preview.
- October 18 Wave 1 work: standard Next.js/Vercel architecture; Supabase setup; verified-wallet identities; private product uploads; order-based x402 checkout; settlement reconciliation; purchase recovery; protected download URLs; standalone checkout-link example.
- October 19 builder-reported local checks: Supabase configured, wallet sign-in, product publication, two-wallet test MUSD purchase, initial/repeat download and seller sales dashboard successful.
- Still outstanding: deploy to Vercel; repeat access-control/failure-path acceptance checks on the deployed origin; publish the GitHub repository; prepare deck and pitch video.

## Claim discipline

A production build and passing fixtures do not prove a live payment flow. Do not claim a public service, external integration adoption, production-grade safety, delivered webhooks or a complete merchant SDK until those exist and have been tested.

## Candidate Wave 2 extensions

Validate with users before choosing: a packaged merchant SDK, signed webhook retries, automated settlement discovery and seller order analytics. Record only shipped changes in a resubmission.

## October 19 identity compatibility fix

Supabase Web3 wallet details are nested in `identity_data.custom_claims`. The server and wallet label now read this layout while requiring an Ethereum Web3 identity and a valid address. Added five regression cases, including rejection of user_metadata spoofing. Local tests pass; publishing must be retried in the builder's configured project.

## October 19 seller sales dashboard

Added an authenticated seller sales endpoint and Sales tab with exact MUSD totals, paid-order counts, products sold, buyer payment addresses, timestamps and explorer receipts. Uses existing product ownership and order records; no database changes. Automated seller isolation and pagination checks added. Live sales display still needs checking in the builder’s configured Supabase project.

## October 19 storefront and checkout update

Added copyable HTML checkout buttons with preview; optional public covers; file size/type from private storage metadata; an owner-only presentation editor for existing products; wallet network and balance guidance; insufficient-balance preflight before signing; confirmation polling limited to 24 checks at five-second intervals for saved settling orders with a transaction hash. Manual recovery remains available. Automated tests pass; updated hosted upload/payment behavior needs builder acceptance. No external adoption or production safety is claimed.

## October 20 wallet balance card

Added a read-only MUSD holdings card on authenticated dashboard tabs. It uses the verified session wallet address, exact token formatting, manual refresh and a checked timestamp. Failure is shown as unavailable rather than zero, and wallet holdings are explicitly separate from sales revenue. No new payment flow or SQL is introduced. Live display remains to be checked by the builder.

## October 20 wallet selection and WalletConnect

Added explicit EIP-6963 installed-wallet selection, WalletConnect QR pairing using the Ethereum Provider, selected-provider persistence/reload, account matching before signing payments, disconnect/account-change sign-out, and account-isolated loading. Supabase remains the authenticated identity source. Automated wallet selection/account tests pass; mobile pairing, custom-testnet support, signatures and real settlement still need builder acceptance.
