# MoonPod

Production repository for **MoonPod** — a decentralized lunar-payload project. Genesis Pod NFTs
and the **$MOONPOD** ERC-20 token. Domain: **moonpod.space**. Legal entity: **Opin Global**.

> **Status: PRELAUNCH.** No token is deployed, no sale is live, and no public purchasing exists.
> Nothing here authorizes mainnet deployment or fund movement — see `CLAUDE.md` and
> `docs/launch-checklist.md`.

## Layout
- `contracts/` — Hardhat + Solidity (token, presale, vesting), tests, deployment module.
- `website/` — Vite static site for GitHub Pages (the corrected public frontend).
- `docs/` — audits and decision records. **Start with `docs/current-state-audit.md`.**
- `.github/workflows/` — contract tests and Pages deployment.

## Contracts
```bash
cd contracts
cp .env.example .env        # fill in for testnet only; .env is git-ignored
npm install
npx hardhat test            # 46 tests, all passing
npx hardhat compile
```
- `MoonPodToken.sol` — fixed-supply ERC-20 (Permit, Burnable, Pausable, AccessControl). No mint
  function; no tax/blacklist/proxy.
- `MoonPodPresale.sol` — ETH-denominated sale with soft/hard caps, per-wallet limits,
  claim-on-success, refund-on-failure, reentrancy guard, pause.
- `MoonPodTeamVesting.sol` — linear vesting, 6-month cliff / 2-year duration.

Allocation/supply constants live in `contracts/config/tokenomics.ts` (single source of truth,
used by both deployment and tests). All values are **working specs pending approval**.

## Website
```bash
cd website
npm install
npm run dev      # local
npm run build    # -> dist/ (deployed by GitHub Actions to Pages)
```
The site reads contract addresses from `contracts/deployments/*.json` (mirrored in
`website/src/deployments/`). It shows PRELAUNCH/TESTNET/MAINNET state, verifies chain ID, and
enables no transaction until a verified deployment record exists.

## Key decisions awaiting approval
Final token supply, presale pricing model, vesting beneficiary, multisig signers, and rank
thresholds — all in `docs/tokenomics-decision.md`.
