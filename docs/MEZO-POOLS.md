# Checkout funding through Mezo Pools

The first supported funding path swaps **test BTC for MUSD** directly through Mezo's basic BTC/MUSD pool on chain 31611. It is an explicit swap before the separate x402 product payment, not a borrowing flow or an atomic swap-and-buy promise.

## Sources

- Official deployment documentation: https://mezo.org/docs/developers/features/mezo-pools/
- Implementation and deployment ABIs: https://github.com/mezo-org/tigris/tree/main/solidity
- `lib/mezo-pools-abi.ts` contains only the interface entries used by this integration, derived from `solidity/deployments/testnet/Router.json`, `Pool.json`, and `solidity/external/testnet/Bitcoin.json`. Credit: Mezo / Tigris and its upstream Velodrome/Aerodrome interfaces. No Solidity implementation was copied.

The Router JSON confirms `swapExactTokensForTokens(uint256,uint256,Route[],address,uint256)` is **nonpayable**. BTC is the ERC-20 precompile at `0x7b7c000000000000000000000000000000000000`; this is not a wrapped-ETH router. The app approves exactly the specified BTC amount. It does not send BTC as transaction `value`.

| Contract | Mezo Testnet address |
|---|---|
| Router | `0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9` |
| Factory | `0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A` |
| BTC/MUSD pool | `0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9` |
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

## Before signing

The wallet must match the authenticated address and chain 31611. Reads verify router bytecode, its default factory, the computed pool address, token pair, pool factory, volatile pool type, nonzero reserves and `getAmountsOut`. Reads share a block number. An unavailable RPC or empty pool disables quotes rather than inventing output amounts.

A quote shows the exact BTC input, estimated MUSD and the minimum accepted output at 0.5% or 1% slippage. It expires after 30 seconds before execution starts. Execution rechecks the pool, preserves the reviewed input and minimum output, requires three confirmations for approvals, and simulates the swap after approval. The deadline uses chain time plus 180 seconds. Gas is paid in test BTC; the input must leave a reserve, and a final gas estimate checks the remaining balance.

If approval takes longer than the original quote window, the displayed minimum remains the fixed bound; execution cannot silently lower it. A changed price causes simulation to fail or the transaction to revert.

The swap hash is saved immediately in account-scoped browser storage. A confirmation timeout keeps the existing swap pending and offers receipt verification. It does not automatically submit a replacement. Browser storage can be cleared; users should save the explorer receipt. This is recovery assistance, not an on-chain global replay guard for user-initiated swaps.

## Verification status

Source ABI and deployment addresses were checked against Mezo's repository. Initial Python HTTP calls returned 403, but the Node RPC check subsequently succeeded. `docs/pool-read-check.json` records a full identity/reserves/quote check at block 16485495: 0.0001 test BTC quoted 7.860544713003182959 MUSD, minimum 7.821241989438167044 MUSD at 0.5% slippage. This is a dated read-only result, not a successful swap or a current quote. Run `npm run verify:pools` for fresh reads, then complete the wallet acceptance checks in `docs/WAVE2-ACCEPTANCE.md`.
