/**
 * MoonPod tokenomics constants — WORKING SPECIFICATION (pending Rowland's approval).
 *
 * Source: handoff Sections 6 / 6.1. The live website's 1,000,000,000 figure is a
 * documented conflict and is intentionally NOT used here. See docs/tokenomics-decision.md.
 *
 * All values are in base units (18 decimals). No human-decimal arithmetic is performed
 * on-chain; these literals are exact integers.
 */
const E17 = 10n ** 17n; // 0.1 token in base units, used to express the .2/.6/.8 fractions exactly

export const ONE_TOKEN = 10n ** 18n;
export const TOTAL_SUPPLY_WHOLE = 8_888_888_888n;
export const TOTAL_SUPPLY = TOTAL_SUPPLY_WHOLE * ONE_TOKEN;

export const ALLOCATIONS = {
  presale: 35_555_555_552n * E17, // 3,555,555,555.2  (40%)
  liquidity: 17_777_777_776n * E17, // 1,777,777,777.6 (20%)
  ecosystem: 17_777_777_776n * E17, // 1,777,777,777.6 (20%)
  team: 8_888_888_888n * E17, //        888,888,888.8 (10%)
  treasury: 8_888_888_888n * E17, //    888,888,888.8 (10%)
} as const;

export const ALLOCATION_SUM =
  ALLOCATIONS.presale +
  ALLOCATIONS.liquidity +
  ALLOCATIONS.ecosystem +
  ALLOCATIONS.team +
  ALLOCATIONS.treasury;

// Vesting (handoff 6.3): 6-month cliff, 2-year total, linear after cliff.
export const VESTING_CLIFF_SECONDS = 180n * 24n * 60n * 60n; // 180 days
export const VESTING_DURATION_SECONDS = 730n * 24n * 60n * 60n; // 730 days (~2 years)
