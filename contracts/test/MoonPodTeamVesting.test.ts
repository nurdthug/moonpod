import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ALLOCATIONS, VESTING_CLIFF_SECONDS, VESTING_DURATION_SECONDS } from "../config/tokenomics";

describe("MoonPodTeamVesting", () => {
  const TEAM = ALLOCATIONS.team;

  async function deploy() {
    const [deployer, holder, admin, beneficiary] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MoonPodToken");
    const token = await Token.deploy(holder.address, admin.address);
    await token.waitForDeployment();

    const start = BigInt((await time.latest()) + 10);
    const Vesting = await ethers.getContractFactory("MoonPodTeamVesting");
    const vesting = await Vesting.deploy(
      await token.getAddress(),
      beneficiary.address,
      start,
      VESTING_CLIFF_SECONDS,
      VESTING_DURATION_SECONDS
    );
    await vesting.waitForDeployment();

    // Fund the vesting contract with the team allocation.
    await token.connect(holder).transfer(await vesting.getAddress(), TEAM);

    return { token, vesting, start, beneficiary, deployer };
  }

  it("stores the schedule correctly", async () => {
    const { vesting, start } = await loadFixture(deploy);
    expect(await vesting.start()).to.equal(start);
    expect(await vesting.cliff()).to.equal(start + VESTING_CLIFF_SECONDS);
    expect(await vesting.duration()).to.equal(VESTING_DURATION_SECONDS);
    expect(await vesting.totalAllocation()).to.equal(TEAM);
  });

  it("releases nothing before the cliff", async () => {
    const { vesting, start } = await loadFixture(deploy);
    await time.increaseTo(start + VESTING_CLIFF_SECONDS - 100n);
    expect(await vesting.releasable()).to.equal(0n);
    await expect(vesting.release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("releases the cliff amount linearly right after the cliff", async () => {
    const { vesting, start, token, beneficiary } = await loadFixture(deploy);
    await time.increaseTo(start + VESTING_CLIFF_SECONDS);
    const expected = (TEAM * VESTING_CLIFF_SECONDS) / VESTING_DURATION_SECONDS;
    // allow tiny drift from the +1s mining
    const releasable = await vesting.releasable();
    expect(releasable).to.be.greaterThanOrEqual(expected);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.be.greaterThanOrEqual(expected);
  });

  it("vests roughly half at the midpoint", async () => {
    const { vesting, start } = await loadFixture(deploy);
    await time.increaseTo(start + VESTING_DURATION_SECONDS / 2n);
    const v = await vesting.vestedAmount(BigInt(await time.latest()));
    const half = TEAM / 2n;
    const tolerance = TEAM / 100_000n; // 0.001%
    expect(v).to.be.closeTo(half, tolerance);
  });

  it("releases the full allocation at/after the end", async () => {
    const { vesting, start, token, beneficiary } = await loadFixture(deploy);
    await time.increaseTo(start + VESTING_DURATION_SECONDS + 1n);
    expect(await vesting.releasable()).to.equal(TEAM);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(TEAM);
    // nothing left
    await expect(vesting.release()).to.be.revertedWithCustomError(vesting, "NothingToRelease");
  });

  it("supports multiple partial releases without over-releasing", async () => {
    const { vesting, start, token, beneficiary } = await loadFixture(deploy);
    await time.increaseTo(start + VESTING_DURATION_SECONDS / 2n);
    await vesting.release();
    const mid = await token.balanceOf(beneficiary.address);
    await time.increaseTo(start + VESTING_DURATION_SECONDS + 1n);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(TEAM);
    expect(mid).to.be.lessThan(TEAM);
    expect(await vesting.released()).to.equal(TEAM);
  });

  it("reverts on bad constructor args", async () => {
    const [, , , beneficiary] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MoonPodToken");
    const token = await Token.deploy(beneficiary.address, beneficiary.address);
    const Vesting = await ethers.getContractFactory("MoonPodTeamVesting");
    // cliff > duration
    await expect(
      Vesting.deploy(await token.getAddress(), beneficiary.address, 0, 1000, 500)
    ).to.be.revertedWithCustomError(Vesting, "InvalidSchedule");
    // zero beneficiary
    await expect(
      Vesting.deploy(await token.getAddress(), ethers.ZeroAddress, 0, 100, 500)
    ).to.be.revertedWithCustomError(Vesting, "ZeroAddress");
  });
});
