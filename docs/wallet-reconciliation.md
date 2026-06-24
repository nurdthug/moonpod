# Wallet Reconciliation

Two addresses are associated with MoonPod. **Ownership and purpose of each are not assumed.**
On-chain fields are PENDING because the sandbox could not query an unauthenticated block
explorer (Etherscan now requires a keyed V2 endpoint). Complete the table with an Etherscan V2
API key or a trusted RPC. **Do not move funds or change addresses without explicit approval.**

| Field | Address A | Address B |
|---|---|---|
| Address | `0x6dE5dBB2381d8739093008C55AC750C4023922Fe` | `0x9411dE226a239f05CeBfDf0b8A7A22e3101d4B09` |
| Source | Shown as "Treasury" on the live site | Referenced in prior MoonPod planning |
| Owner | **PENDING** | **PENDING** |
| Purpose | **PENDING** (claimed treasury) | **PENDING** |
| Current balance | **PENDING** | **PENDING** |
| Relevant transactions | **PENDING** | **PENDING** |
| EOA or contract? | **PENDING** | **PENDING** |
| Still active? | **PENDING** | **PENDING** |
| Controls an NFT contract? | **PENDING** | **PENDING** |
| Intended treasury? | **PENDING** | **PENDING** |
| Intended deployer? | **PENDING** | **PENDING** |
| Intended sale recipient? | **PENDING** | **PENDING** |
| Should be replaced by multisig? | **Recommended yes for any production role** | **Recommended yes** |

## How to complete
For each address, via Etherscan V2 (`https://api.etherscan.io/v2/api?chainid=1&...&apikey=KEY`)
or a trusted RPC, record: `eth_getCode` (EOA vs contract), balance, first/last activity, token
holdings, and any contract it owns (`owner()` / role checks). Then have Rowland confirm the
intended role of each.

## Recommendation
Any address that will hold funds or control a contract in production should be a **reputable
multisig** (e.g. Safe), not a single browser-wallet EOA. See `security-model.md`. Confirm which
address (if either) is the intended treasury and deployer before wiring it into deployment
parameters or the website.
