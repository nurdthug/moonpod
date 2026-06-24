import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ALLOCATIONS, VESTING_CLIFF_SECONDS, VESTING_DURATION_SECONDS } from "../../config/tokenomics";

/**
 * Deterministic deployment of the MoonPod system (token + vesting + presale).
 *
 * IMPORTANT: this module is for TESTNET (Sepolia) rehearsal. Do NOT run against
 * mainnet without the approvals and exact parameters in docs/launch-checklist.md.
 * All sensitive parameters are module parameters with placeholder defaults — supply
 * real values via an Ignition parameters file or CLI, never hard-coded secrets.
 *
 * Funding model: the entire supply is minted to `initialHolder` (the deployer here
 * for rehearsal; a multisig distributor in production). The module then transfers the
 * team and presale allocations into the vesting and presale contracts. Liquidity,
 * ecosystem and treasury allocations remain with the holder, to be moved per the
 * approved launch plan.
 */
export default buildModule("MoonPod", (m) => {
  const deployer = m.getAccount(0);

  // --- Parameters (override per network; defaults are placeholders) ---
  const admin = m.getParameter("admin", deployer); // multisig in production
  const treasury = m.getParameter("treasury", deployer); // multisig in production
  const initialHolder = m.getParameter("initialHolder", deployer);
  const vestingBeneficiary = m.getParameter("vestingBeneficiary", deployer);

  // Presale terms (ETH-denominated). Placeholders — set real, approved values.
  const presaleStart = m.getParameter("presaleStart", 0n);
  const presaleEnd = m.getParameter("presaleEnd", 0n);
  const softCapWei = m.getParameter("softCapWei", 0n);
  const hardCapWei = m.getParameter("hardCapWei", 0n);
  const minContributionWei = m.getParameter("minContributionWei", 0n);
  const maxContributionWei = m.getParameter("maxContributionWei", 0n);
  const weiPerToken = m.getParameter("weiPerToken", 0n);

  const vestingStart = m.getParameter("vestingStart", 0n);

  // --- Token ---
  const token = m.contract("MoonPodToken", [initialHolder, admin]);

  // --- Team vesting ---
  const vesting = m.contract("MoonPodTeamVesting", [
    token,
    vestingBeneficiary,
    vestingStart,
    VESTING_CLIFF_SECONDS,
    VESTING_DURATION_SECONDS,
  ]);

  // --- Presale ---
  const presale = m.contract("MoonPodPresale", [
    token,
    treasury,
    presaleStart,
    presaleEnd,
    softCapWei,
    hardCapWei,
    minContributionWei,
    maxContributionWei,
    weiPerToken,
    admin,
  ]);

  // --- Fund vesting and presale from the initial holder ---
  // (Only valid when initialHolder == deployer; in production these transfers are
  //  executed by the multisig distributor as separate, reviewed transactions.)
  m.call(token, "transfer", [vesting, ALLOCATIONS.team], { id: "fundVesting" });
  m.call(token, "transfer", [presale, ALLOCATIONS.presale], { id: "fundPresale" });

  return { token, vesting, presale };
});
