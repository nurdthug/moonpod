# Required First-Response Report (Handoff Section 19)

Date: June 17, 2026. Audit-first, as required. Verified items are based on the live site and
published whitepaper; items needing the **Replit export** or **on-chain data** are marked PENDING
(neither has been obtained yet — the Replit browser channel timed out, and the explorer needs a
keyed API). Nothing below is invented.

1. **Current technology stack.** Public-facing: a static HTML/CSS/JS site (homepage +
   `whitepaper.html`) with wallet-connect and a Genesis mint UI. Exact framework/build and any
   backend are **PENDING** the Replit export (`current-state-audit.md` §B).

2. **Replit-specific dependencies.** **PENDING** — needs the export (`.replit`, `replit.nix`,
   `@replit/*`, Replit DB/Auth/Object Storage). None can be confirmed without source.

3. **Discovered contracts.** None proven. No contract address is published on the site; the
   footer "Smart Contract" link is a dead `#`. Whether real $MOONPOD (ERC-20) or Genesis
   (ERC-721) source exists is **PENDING** the export. *(New, tested contracts are provided in
   `contracts/` regardless.)*

4. **Discovered wallet addresses.** Treasury `0x6dE5dBB2381d8739093008C55AC750C4023922Fe` (live
   site); `0x9411dE226a239f05CeBfDf0b8A7A22e3101d4B09` (prior planning). Ownership/purpose/balance
   **PENDING** on-chain — `wallet-reconciliation.md`.

5. **Environment-variable names (no values).** **PENDING** the export; scan list and command in
   `current-state-audit.md` (`PRIVATE_KEY`, `MNEMONIC`, `PINATA_SECRET`, `LIGHTHOUSE_API_KEY`,
   `ALCHEMY_SECRET`, `WALLETCONNECT_PROJECT_ID`, etc.).

6. **Website contradictions.** Confirmed: (A) "Presale Live" vs "Prelaunch" vs price-TBA vs
   address-TBA vs 0% progress; (B) FAQ "deployed on mainnet" vs hero "address TBA"; (C) supply
   1,000,000,000 vs planning 8,888,888,888 vs whitepaper (none); (D) Genesis "<50 remaining" +
   live feed with no on-chain source. Full table in `live-site-audit.md`.

7. **Does the Genesis interface really mint, or only send ETH?** **PENDING — critical.** Cannot be
   determined without the source. If it is a bare ETH transfer to the treasury with a hard-coded
   counter, buyers receive no NFT — highest-priority risk. The corrected frontend disables minting
   until resolved (`genesis-pod-audit.md` #20/#25).

8. **Can the project run entirely on GitHub Pages?** Yes for the public frontend — it is fully
   static (wallet connect, contract reads, user-signed txs are client-side). The corrected site
   builds and runs with no Replit.

9. **What needs an external backend?** Nothing for prelaunch. Future needs: real-time mission
   telemetry, private/paid IPFS pinning, KYC/AML, webhooks, and any admin/automated on-chain
   transactions — none may hold secrets in the Pages bundle.

10. **Proposed final repository structure.** Implemented per handoff §10.2: `contracts/`
    (Hardhat: contracts, config, test, ignition, deployments), `website/` (Vite static),
    `docs/` (nine audit/decision files), `.github/workflows/`, `CLAUDE.md`, `README.md`,
    `.gitignore`. See `README.md`.

11. **Migration sequence.** Stages 1–9 in `launch-checklist.md`. Done: local reconstruction,
    contracts, tests. Next: Replit forensic audit (needs export) → Sepolia → security review →
    Pages production → mainnet readiness → launch (approval-gated).

12. **Token-launch sequence.** Deploy token → verify → deploy & fund vesting → deploy & fund sale
    → transfer roles to multisig → confirm allocations → publish verified addresses → enable UI →
    monitor → liquidity per plan. Approval-gated (`launch-checklist.md`).

13. **Decisions requiring Rowland's approval.** Final supply (8.88B vs 1B); allocation; presale
    pricing model + numbers; vesting beneficiary/start/revocability; token feature set;
    multisig signers/threshold; rank thresholds; canonical Telegram handle. (`tokenomics-decision.md`)

14. **Security blockers.** Single-EOA control (needs multisig); custom presale/vesting need
    independent human review; Replit secret scan + rotation pending export; Genesis mint behavior
    unverified. (`security-model.md`)

15. **Legal / claims blockers.** No legal review yet; unsupported claims on the live site
    (mainnet-deployed, presale-live, guaranteed/yield/staking, unproven payload bookings) must
    stay corrected; supply/sale model unresolved. (`legal-claims-audit.md`)

## What is already built and verified
- Three contracts (token/presale/vesting) implemented to spec; **46/46 tests passing**
  (`cd contracts && npm install && npx hardhat test`).
- Corrected static frontend builds (`cd website && npm install && npm run build`) with no fake
  counters, purchasing disabled, chain-ID guard, and disclosures.
- Full `docs/` set, CI workflows, deployment module, versioned deployment records, `.gitignore`,
  `.env.example`, `CNAME`.

## What is needed from you to proceed
1. **Replit export** (zip) into the project folder → completes the forensic, Genesis, and
   secret-scan audits.
2. An **Etherscan V2 API key or RPC URL** → completes wallet/on-chain reconciliation.
3. The **approval decisions** in item 13.
4. Your **GitHub account/repo name** → finalizes the www CNAME and deploy config.
