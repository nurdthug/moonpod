# Genesis Pod NFT Audit

The Genesis Pod system is a **separate production product** from the token. This audit determines
whether the current implementation matches the whitepaper. Most fields require the **Replit
source export** and **on-chain data**, which have not yet been provided, so they are marked
PENDING with the exact source to confirm them. **Do not let the frontend accept ETH for minting
until every PENDING item is resolved.**

## Expected (from whitepaper)
Total **888** · public **750 @ 0.1 ETH** · premium **88 @ 0.25 ETH+** · reserved **50**.

## Audit table (Section 9.1, items 1–26)
| # | Field | Finding |
|---|---|---|
| 1 | Contract address | **PENDING** — not published on site (footer "Smart Contract" link is a dead `#`). From Replit source / on-chain. |
| 2 | Network | Claimed Ethereum Mainnet — **unverified**. |
| 3 | Contract standard | Claimed ERC-721 — **PENDING** (confirm in source / explorer). |
| 4 | Verified source status | **PENDING** (check Etherscan verification). |
| 5 | Owner | **PENDING** (on-chain `owner()` / roles). |
| 6 | Privileged roles | **PENDING**. |
| 7 | Max supply | Claimed 888 — **PENDING** (confirm on-chain cap). |
| 8 | Current supply | **PENDING** — site shows "<50 remaining" with **no on-chain source**; treat as simulated until proven. |
| 9 | Public mint count | **PENDING**. |
| 10 | Premium mint count | **PENDING**. |
| 11 | Reserved mint count | **PENDING**. |
| 12 | Mint price logic | Claimed 0.1 ETH base — **PENDING** (premium 0.25+ logic must be confirmed in code). |
| 13 | Revenue destination | Site shows treasury `0x6dE5…22Fe` — purpose/ownership **unverified** (`wallet-reconciliation.md`). |
| 14 | Withdrawal authority | **PENDING**. |
| 15 | Metadata architecture | **PENDING** — base URI? per-token? |
| 16 | Image storage | **PENDING** — IPFS (Pinata/Lighthouse) vs centralized. |
| 17 | Metadata storage | **PENDING** — on-chain vs IPFS vs centralized server. |
| 18 | Mutability | Whitepaper says "evolving metadata" — confirm whether mutable and by whom. **PENDING**. |
| 19 | Freeze status | **PENDING**. |
| 20 | Frontend mint flow | **PENDING — critical**: does the UI call a real `mint()` or only `eth_sendTransaction` to the treasury? |
| 21 | Wallet behavior | **PENDING**. |
| 22 | Chain validation | Current site does not appear to hard-block wrong-network mints — **must** validate chain ID. |
| 23 | Error handling | **PENDING** — confirm rejected-tx and RPC-failure handling. |
| 24 | Event indexing | **PENDING** — is "Recent Mints" from real `Transfer` events or simulated? |
| 25 | Security concerns | **PENDING** until source reviewed; if the "mint" is a bare ETH transfer with a hard-coded counter, buyers receive **no NFT** — highest-priority risk. |
| 26 | Are current public claims accurate? | **No / unproven.** "Mint live", "<50 remaining", and the live feed are unverified and likely simulated. The corrected frontend removes them pending this audit. |

## How to complete this audit
1. Get the Replit export; locate the Genesis contract source/ABI and the mint UI code.
2. Identify the deployed address; on a block explorer confirm standard, supply, owner, roles,
   price logic, revenue destination, and source verification.
3. Trace the frontend mint call: real contract method vs ETH transfer; on-chain vs hard-coded
   remaining; real vs simulated recent mints; metadata permanence.
4. Record findings here, replacing each PENDING. Only then consider re-enabling minting.

**Sources:** [moonpod.space](https://moonpod.space/)
