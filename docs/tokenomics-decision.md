# Tokenomics Decision Document

Records the token decisions that require **Rowland Akinduro's explicit approval** before any
deployment. The contracts in `contracts/` are built against the *leading working specification*
below, clearly labeled as pending. Nothing here is final until approved.

## Decision 1 — Total supply (UNRESOLVED)
| Source | Value |
|---|---|
| Live website | 1,000,000,000 |
| Prior founder planning | **8,888,888,888** (leading working spec) |
| Published whitepaper | Sets no supply |

The handoff directs treating **8,888,888,888** as the leading spec while requiring final
approval. `contracts/config/tokenomics.ts` and `MoonPodToken.sol` use 8,888,888,888 × 10¹⁸.
**Action required:** approve one exact fixed supply. If 1,000,000,000 is chosen instead, update
`tokenomics.ts` only — tests re-derive allocations from it.

## Decision 2 — Allocation (working spec)
Percentages 40/20/20/10/10. With supply 8,888,888,888, exact whole-token and base-unit amounts:

| Bucket | % | Whole tokens | Base units (×10¹⁸) |
|---|---|---|---|
| Presale | 40 | 3,555,555,555.2 | 3,555,555,555,200,000,000,000,000,000 |
| Initial liquidity | 20 | 1,777,777,777.6 | 1,777,777,777,600,000,000,000,000,000 |
| Ecosystem & missions | 20 | 1,777,777,777.6 | 1,777,777,777,600,000,000,000,000,000 |
| Team (vesting) | 10 | 888,888,888.8 | 888,888,888,800,000,000,000,000,000 |
| Treasury & partnerships | 10 | 888,888,888.8 | 888,888,888,800,000,000,000,000,000 |
| **Total** | 100 | **8,888,888,888** | **8,888,888,888,000,000,000,000,000,000** |

The `.2/.6/.8` fractions are exact in base units. A test (`MoonPodToken.test.ts`) asserts the
five buckets **sum exactly** to total supply in base units. All on-chain math uses base units.

## Decision 3 — Presale pricing model (UNRESOLVED)
The prior model prices tokens in **ETH** (0.00000028 ETH/token) while setting caps and limits in
**USD** ($750k soft / $2.5M hard / ~$20 min / ~$10k max). ETH/USD drift makes this internally
inconsistent. Three options:

| Option | Accounting | Oracle risk | Caps predictable in | Notes |
|---|---|---|---|---|
| **1 — All ETH** (implemented default) | wei | none | ETH | Simplest, fully auditable. USD figures become references. |
| 2 — USDC-denominated | USDC | none | USD | Clean USD caps; adds stablecoin dependency & approvals. |
| 3 — USDC accounting, ETH via oracle | USDC | **yes** | USD | USD caps + ETH payments, but introduces oracle trust. |

**Recommendation:** prioritizing clear accounting, predictable caps, refund accuracy, minimal
oracle risk, and simple auditing, **Option 1 (all-ETH)** is implemented in `MoonPodPresale.sol`
(price, caps, and per-wallet limits are all wei, set at deploy). If predictable **USD** caps are
a hard requirement, Option 2 is the next-safest (no oracle). Avoid Option 3 unless a USD cap is
mandatory and an oracle dependency is acceptable. **Action required:** approve the model and the
exact ETH (or USDC) numbers before deployment. Do not deploy the sale until then.

Prior planning reference figures (for whichever model): target raise $2.5M, soft cap $750k, hard
cap $2.5M, min ~$20, max ~$10k, presale = 40% of supply.

## Decision 4 — Team vesting (working spec)
10% of supply, **2-year** total, **6-month cliff**, linear after cliff, **non-revocable**
(trust-minimising default; revocability is itself a decision). Implemented in
`MoonPodTeamVesting.sol`; funded separately (not sent to a team wallet). **Action required:**
confirm beneficiary address(es), start time, and revocable vs non-revocable. Multiple team
members → one vesting instance each.

## Decision 5 — Token features (confirm)
Implemented: fixed supply, no post-launch mint, holder burn, ERC-2612 permit, emergency pause,
role-based access, clear events. **Excluded** unless separately approved & justified: transfer
tax, blacklist, proxy upgradeability, any owner seize/supply-change function. Immutable token,
not a proxy.

## Rank system (Decision 6 — define thresholds)
Earthling → Astronaut → Commander → Lunar Envoy → Moon Architect. Must become a deterministic,
publicly documented schedule (token thresholds or verified participation) before any rank-gated
feature. No hidden or adjustable requirements. **Action required:** approve the threshold table.

## Open approval checklist
- [ ] Final fixed supply (8,888,888,888 vs 1,000,000,000 vs other)
- [ ] Allocation percentages confirmed
- [ ] Presale pricing model + exact numbers
- [ ] Vesting beneficiary/start/revocability
- [ ] Token feature set confirmed (no tax/blacklist/proxy)
- [ ] Rank thresholds
