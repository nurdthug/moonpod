# Launch Checklist & Migration Plan

Covers the staged deployment process, the moonpod.space DNS migration, and the mainnet-readiness
items. **No mainnet deployment, fund movement, liquidity, public address, or public purchasing
without Rowland's explicit written approval after testing and review.**

## Stages (handoff Section 16)
1. **Forensic audit** — `current-state-audit.md` (Section B PENDING on Replit export).
2. **Migration plan** — file-by-file in `current-state-audit.md`.
3. **Local reconstruction** — ✅ site builds from a clean clone with no Replit (`website/`).
4. **Contract implementation** — ✅ token/presale/vesting implemented; ✅ 46 tests passing.
5. **Sepolia deployment** — ⬜ deploy, verify source, connect site to testnet, test wallet
   connect / network switch / purchase / caps / finalize / claim / refund / pause / vesting.
6. **Security review** — ⬜ Slither (advisory CI) + **independent human review** of custom code.
7. **Production website** — ⬜ deploy corrected static site to GitHub Pages; purchasing stays
   disabled until production contracts are approved and verified.
8. **Mainnet readiness** — this checklist.
9. **Mainnet launch** — ⬜ only after explicit approval (sequence below).

## Sepolia test matrix (Stage 5)
Wallet connection · network switching · purchase · cap enforcement (min/max/hard) · finalization
· claim · refund (failed sale) · pause · vesting cliff/linear · admin workflows. The Hardhat
suite already covers these logically; Sepolia validates them end-to-end with the live frontend.

## Mainnet-readiness data (fill in before launch)
- [ ] Exact token supply (base units) — see `tokenomics-decision.md`
- [ ] Exact allocations (base units, summing to supply)
- [ ] Constructor arguments for each contract
- [ ] Multisig address (signers + threshold) — `security-model.md`
- [ ] Treasury address (confirmed) — `wallet-reconciliation.md`
- [ ] Liquidity address
- [ ] Sale configuration (model + start/end + caps + price)
- [ ] Vesting beneficiary + start
- [ ] Oracle details (only if Option 3 chosen — not recommended)
- [ ] Verification commands (Etherscan) per contract
- [ ] Expected transaction sequence (below)
- [ ] Emergency rollback / pause plan

## Mainnet launch sequence (after approval only)
1. Deploy token (supply minted to multisig distributor).
2. Verify token source on Etherscan.
3. Deploy vesting; 4. fund vesting (team allocation).
5. Deploy sale; 6. fund sale (presale allocation).
7. Transfer admin roles (token admin/pauser, presale owner) to the multisig.
8. Confirm all allocations on-chain.
9. Publish verified addresses (update `contracts/deployments/mainnet.json` → site goes live).
10. Enable the correct website interface.
11. Monitor events/errors.
12. Create liquidity only per the approved plan.

## Domain migration (handoff Section 12) — Namecheap → GitHub Pages
Account: Namecheap (DNS for moonpod.space) + GitHub. Replace `GITHUB-USERNAME` with the real
account before the www CNAME is set.

**GitHub side**
1. Push this repo; enable Pages (Settings → Pages → Source: GitHub Actions). `deploy-pages.yml`
   builds `website/` and publishes, writing the `CNAME` (moonpod.space) and a `404.html` SPA
   fallback for direct refresh.
2. Settings → Pages → Custom domain: `moonpod.space`; verify the domain; enable **Enforce HTTPS**
   once the certificate is issued.

**Namecheap side (Advanced DNS)** — apex A records:
```
A   @   185.199.108.153
A   @   185.199.109.153
A   @   185.199.110.153
A   @   185.199.111.153
CNAME  www   GITHUB-USERNAME.github.io.
```
(Optionally add the four `AAAA` records GitHub publishes for IPv6.) Remove any existing
Replit/parking A/CNAME records for `@` and `www` — **but only after** the Pages deployment is
tested and the custom domain is verified in GitHub. Keep TTL low during cutover.

**Verify after cutover:** apex and www both load over HTTPS; direct deep-link refresh works
(404.html fallback); assets load from `/`; no Replit dependency remains; testnet vs mainnet state
is visible; contract reads work; verified explorer links resolve.

## Decommission Replit
Only after the GitHub Pages deployment is fully verified: remove Replit DNS, export/retain a copy
of the Repl, rotate any secrets that ever lived there, then retire the Repl.
