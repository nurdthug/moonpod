# MoonPod — Operating Brief for Claude Code

This repository is the production source of truth for MoonPod, migrated off Replit.
The full operating brief is the handoff document:
**`MoonPod_Complete_Claude_Handoff_Plain_Text.pdf`** (kept at the project root). Read it
before making structural changes. This file summarizes it and records current status.

Project owner: **Rowland Akinduro**. Legal entity: **Opin Global**. Domain: **moonpod.space**.

## The concept
MoonPod turns "to the moon" into a real lunar-payload mission. Two on-chain layers:
Genesis Pod NFTs (ERC-721, the original participation layer) and the **$MOONPOD** ERC-20
token (access, governance, community utility), plus future mission records and a long-term
return-mission concept subject to feasibility, contracts, law, funding, and partnerships.

## Four information layers — keep them separate
1. The official published whitepaper (v1.1, Aug 2025).
2. Claims currently on moonpod.space.
3. Prior founder decisions / planning (outside the whitepaper).
4. Unresolved decisions.
Where they conflict, **document the conflict** (see `docs/`). Do not silently pick one.

## Non-negotiable rules
Do not: invent contracts, wallet ownership, partnerships, launch dates, or tokenomics;
preserve fake counters or contradictory status labels; accept funds through placeholder
logic; store secrets in Git; deploy to mainnet without explicit approval; move funds;
publish unverified contract addresses; or treat the current website as the sole truth.
**No mainnet deployment, fund movement, liquidity creation, public contract address, or
public purchasing without explicit written approval from Rowland after testing and review.**

## Repository map
```
moonpod/
  CLAUDE.md                     ← this file
  README.md
  MoonPod_..._Handoff...pdf     ← full operating brief
  contracts/                    ← Hardhat + Solidity (token, presale, vesting)
    contracts/                  MoonPodToken.sol, MoonPodPresale.sol, MoonPodTeamVesting.sol
    config/tokenomics.ts        single source of allocation/supply constants
    test/                       full test suite (46 tests, all passing)
    ignition/modules/MoonPod.ts deterministic deployment module (testnet)
    deployments/                versioned address records the website reads
    hardhat.config.ts
  website/                      ← Vite static site for GitHub Pages
    index.html, src/, public/CNAME
  docs/                         ← audits & decisions (start here)
  .github/workflows/            ← test-contracts.yml, deploy-pages.yml
```

## Current status (as of June 23, 2026)
- Contracts implemented and **fully tested** (46 tests, all passing).
- Frontend builds and renders a **prelaunch** state: no fake counters, purchasing disabled.
- **EDR fix applied**: upgraded `@nomicfoundation/edr` from `0.12.0-next.23` to `0.12.1`
  which ships a properly signed binary for macOS Tahoe. The `xattr -c` workaround is no
  longer needed. `npx hardhat test` works cleanly on every run.
- **Blocked on inputs**: the Replit source export (for the forensic source audit), on-chain
  data for the Genesis Pod contract and the two wallet addresses, and Rowland's approvals on
  supply / sale-pricing / multisig. See `docs/current-state-audit.md` and `docs/launch-checklist.md`.

## Working specification
- Token: name MoonPod, symbol MOONPOD, 18 decimals, fixed supply **8,888,888,888**
  (**APPROVED by Rowland 2026-07-05**, resolving the website's 1,000,000,000 conflict;
  see `docs/tokenomics-decision.md`). Pricing, multisig, and treasury still pending.
- Allocations: presale 40%, liquidity 20%, ecosystem 20%, team 10% (2y vest / 6mo cliff),
  treasury 10%. These sum exactly to total supply in base units (asserted by tests).
- Presale: ETH-denominated (no-oracle) model recommended; final pricing pending approval.

## Docs index
`current-state-audit.md`, `whitepaper-record.md`, `live-site-audit.md`,
`genesis-pod-audit.md`, `tokenomics-decision.md`, `wallet-reconciliation.md`,
`security-model.md`, `legal-claims-audit.md`, `launch-checklist.md`.
