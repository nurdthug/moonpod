# Live Site Audit — moonpod.space

**Source verification date:** June 17, 2026. Pages fetched: `https://moonpod.space/` and
`https://moonpod.space/whitepaper.html`. This documents what the live site claims, and where
those claims conflict with each other or with the published whitepaper. It does not assume any
claim is true.

## Claims observed on the live homepage
| # | Claim on site | Status |
|---|---|---|
| 1 | "Presale Live" badge | **Contradicts** other on-page status (see conflict A) |
| 2 | Token status: "Prelaunch" | Conflicts with "Presale Live" |
| 3 | Total supply: 1,000,000,000 | **Conflicts** with prior planning figure 8,888,888,888 and with whitepaper (which sets no supply) |
| 4 | Chain: Ethereum Mainnet | Unverified — no contract address shown |
| 5 | Presale allocation: 40% | Matches prior planning; not in whitepaper |
| 6 | Presale price: TBA | Conflicts with "Presale Live" |
| 7 | Presale progress: 0% | Consistent with no live sale |
| 8 | Participants: 0 | Consistent with no live sale |
| 9 | Raised: $0 | Consistent with no live sale |
| 10 | Contract address: "To Be Announced" | **Conflicts** with FAQ claim of mainnet deployment |
| 11 | FAQ: "$MOONPOD is deployed on Ethereum Mainnet (ERC-20)" | **Conflicts** with #10 (TBA) and #2 (Prelaunch) |
| 12 | Genesis mint "still live" | Unverified on-chain |
| 13 | "Less than 50 pods remaining!" | **Likely a hard-coded/simulated counter** — must be proven on-chain or removed |
| 14 | Genesis base price 0.1 ETH | Matches whitepaper |
| 15 | Treasury: `0x6dE5dBB2381d8739093008C55AC750C4023922Fe` | Ownership/purpose unverified — see `wallet-reconciliation.md` |
| 16 | Utility: governance, airdrops, ranks, staking, yield, payload access, briefings | "Staking" and "yield opportunities" stated as present utility — **not supported**; require design+review |
| 17 | Planned DEX/CEX listings | Forward-looking; must not be stated as guaranteed |
| 18 | Future cross-chain deployment | Forward-looking; matches whitepaper "possible" framing |
| 19 | "LIVE FEED: Payload Prepping…" / "Recent Mints" | **Simulated feed** — remove until backed by real events |

## Contradictions (cannot all be true)
- **Conflict A — Presale status.** "Presale Live" vs status "Prelaunch" vs price "TBA" vs
  contract "TBA" vs progress 0%. A sale cannot be simultaneously live, prelaunch, priced-TBA,
  and address-TBA. **Resolution:** presale stays disabled until a real, approved, deployed,
  verified, tested sale exists (see `launch-checklist.md`).
- **Conflict B — Deployment.** FAQ says the token is "deployed on Ethereum Mainnet" while the
  hero shows "Contract Address: To Be Announced." At least one is false. No address is published,
  so deployment is **unproven**. Do not present the token as deployed.
- **Conflict C — Supply.** Site shows 1,000,000,000; prior planning says 8,888,888,888; the
  whitepaper sets none. **Unresolved** — `tokenomics-decision.md`.
- **Conflict D — Genesis remaining.** "Less than 50 remaining" with a live feed and recent-mints
  list, but no on-chain figures. Treated as **simulated** pending the Genesis audit.

## Corrections applied in the new frontend (`website/`)
- Removed the "Presale Live" badge; site shows a single coherent **PRELAUNCH** state.
- Removed all fake counters (participants/raised/progress), the simulated live feed, and the
  "recent mints" list.
- Removed "<50 pods remaining"; Genesis shows a "minting paused pending on-chain audit" notice
  with no fabricated counts.
- Total supply shown as "Pending approval" (not 1,000,000,000).
- Contract shown as "Not yet deployed"; a verified explorer link appears only when a real
  address is present in `contracts/deployments/*.json`.
- Staking/yield reframed as *intended* utility requiring separate design and review, not present
  features. Added explicit risk & legal disclosures.
- Network/state banner distinguishes PRELAUNCH / TESTNET / MAINNET; wallet connect verifies the
  connected chain ID and never enables a transaction in prelaunch.

## Footer / metadata notes
- Whitepaper referenced as v1.1, Aug 2025. "Smart Contract" footer link is a dead `#` anchor.
- Two different Telegram handles appear across pages (`t.me/moonpodspace` on home,
  `t.me/moonpodofficial` in the whitepaper footer). Reconcile the canonical handle.

**Sources:** [moonpod.space](https://moonpod.space/), [whitepaper](https://moonpod.space/whitepaper.html)
