# Current-State Forensic Audit (Stage One)

**Date:** June 17, 2026. This is the Stage-One forensic audit required before redesigning or
launching anything. It is split into (A) what has been independently verified, and (B) items
that require the **Replit source export** or **on-chain data** and are therefore marked PENDING.
Per the non-negotiable rules, nothing here is invented; unknowns are stated as unknowns.

## Status of inputs
- ✅ Live website and published whitepaper fetched and audited (`live-site-audit.md`, `whitepaper-record.md`).
- ⛔ **Replit workspace export NOT yet received.** The project folder contained only the handoff
  PDF. The browser-automation channel to the open Replit tab timed out repeatedly, so source
  could not be pulled live. **Required next step:** in Replit, *Download as zip* (or push the Repl
  to a Git remote) and drop it into the project folder. Then this audit's Section B can be
  completed against real files rather than inference.

## A. Independently verified
- **Public stack (frontend, as served):** static HTML/CSS/JS site at moonpod.space with a
  homepage and a separate `whitepaper.html`. The homepage references wallet connection and a
  Genesis mint UI. Whether any mint UI calls a real contract is **unverified** (Section B).
- **Documented contradictions:** see `live-site-audit.md` (presale status, deployment, supply,
  Genesis "remaining"). These are facts about the site's own copy, independently confirmed.
- **Addresses surfaced publicly:** treasury `0x6dE5dBB2381d8739093008C55AC750C4023922Fe` (shown
  on site). A second address `0x9411dE226a239f05CeBfDf0b8A7A22e3101d4B09` appears in prior
  planning. Neither is verified on-chain yet — see `wallet-reconciliation.md`.

## B. PENDING — requires Replit export and/or on-chain data
For each item: what to look for, where.

1. **Exact technology stack & build** — `package.json`, lockfile, framework (React/Vite/plain),
   `.replit`, `replit.nix`, build/run commands. *(Replit export)*
2. **Replit-specific dependencies** — `@replit/*` packages, Replit DB (`REPLIT_DB_URL`), Replit
   Auth, Object Storage, deploy config. *(Replit export)*
3. **Discovered contracts** — any `.sol` files, ABIs (`*.json`), `artifacts/`, Hardhat/Foundry
   config, deploy scripts. Determine if a real $MOONPOD ERC-20 or Genesis ERC-721 source exists. *(Replit export)*
4. **Genesis mint behavior** — does the frontend call a contract `mint()` or only `eth_sendTransaction`
   transferring ETH to the treasury? Is "remaining < 50" on-chain or hard-coded? Is "Recent Mints"
   real event data or simulated? *(Replit export + on-chain)* — see `genesis-pod-audit.md`.
5. **Environment-variable NAMES only** (never values). Scan for the names in the list below. *(Replit export)*
6. **Hard-coded addresses / RPC URLs / API keys** committed in source. *(Replit export)*
7. **Database schema** (if any Replit DB / Postgres / Supabase). *(Replit export)*
8. **Git history** — prior contract addresses, leaked secrets in history, deploy records. *(Replit export)*
9. **On-chain reality** — for any address found: is it an EOA or contract? balance, code, token
   contract linkage, recent txs. Use a block explorer / RPC. *(on-chain — needs an Etherscan V2
   API key or RPC; the sandbox could not query unauthenticated.)*

### Secret-scan name list (report NAMES and locations only — never values)
`PRIVATE_KEY`, `MNEMONIC`, `SECRET`, `API_KEY`, `DATABASE_URL`, `REPLIT_DB_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `PINATA_SECRET`, `LIGHTHOUSE_API_KEY`, `INFURA_SECRET`,
`ALCHEMY_SECRET`, `ETHERSCAN_API_KEY`, `WALLETCONNECT_PROJECT_ID`.
Run before any push: `git grep -nE 'PRIVATE_KEY|MNEMONIC|SECRET|API_KEY|DATABASE_URL|REPLIT_DB_URL|PINATA|LIGHTHOUSE|INFURA|ALCHEMY|ETHERSCAN|WALLETCONNECT'`.
If any **value** is found committed, treat it as compromised: rotate it and purge from history.

## GitHub Pages feasibility (Section 19 #8–#9)
The corrected frontend is **fully static** and runs on GitHub Pages: wallet connection, browser
contract reads, and user-signed transactions are all client-side. **Cannot** run on Pages and
must move to an external service if needed later: any private database, server-side routes,
secret API keys (e.g. paid Pinata/Lighthouse pinning, private RPC with secret), webhook
processing, admin/automated on-chain transactions. The prelaunch site needs none of these.

## Migration plan (Stage Two summary)
- **Remains / reused:** MoonPod branding, copy, whitepaper content, static structure.
- **Replaced:** contradictory status UI, fake counters, simulated feeds, hard-coded "remaining",
  ad-hoc ETH-transfer mint (until audited), tokenomics claims.
- **New:** Hardhat contract suite + tests, versioned deployment records, GitHub Actions, chain
  guard, disclosures.
- **Deleted after cutover:** Replit-specific config and any committed secrets (after rotation).
- **Needs external backend (future):** real-time mission telemetry, private pinning, KYC/AML.

**Sources:** [moonpod.space](https://moonpod.space/), [whitepaper](https://moonpod.space/whitepaper.html)
