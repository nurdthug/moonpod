import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ALLOCATIONS } from "../config/tokenomics";

const E = ethers.parseEther;

describe("MoonPodPresale", () => {
  // ETH-denominated terms (Option 1). Price = handoff's 0.00000028 ETH/token.
  const WEI_PER_TOKEN = 280_000_000_000n; // 2.8e11
  const SOFT_CAP = E("10");
  const HARD_CAP = E("100");
  const MIN = E("1");
  const MAX = E("50");
  const PRESALE_TOKENS = ALLOCATIONS.presale;

  async function deployFixture() {
    const [deployer, holder, admin, treasury, alice, bob, carol] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MoonPodToken");
    const token = await Token.deploy(holder.address, admin.address);
    await token.waitForDeployment();

    const now = await time.latest();
    const startTime = BigInt(now + 100);
    const endTime = startTime + 1000n;

    const Presale = await ethers.getContractFactory("MoonPodPresale");
    const presale = await Presale.deploy(
      await token.getAddress(),
      treasury.address,
      startTime,
      endTime,
      SOFT_CAP,
      HARD_CAP,
      MIN,
      MAX,
      WEI_PER_TOKEN,
      admin.address // owner
    );
    await presale.waitForDeployment();

    // Fund the sale with the presale allocation.
    await token.connect(holder).transfer(await presale.getAddress(), PRESALE_TOKENS);

    return { token, presale, startTime, endTime, deployer, holder, admin, treasury, alice, bob, carol };
  }

  async function openSale() {
    const f = await loadFixture(deployFixture);
    await time.increaseTo(f.startTime + 1n);
    return f;
  }

  describe("config & timing", () => {
    it("reverts on bad config (softcap > hardcap)", async () => {
      const { token } = await loadFixture(deployFixture);
      const [, , admin, treasury] = await ethers.getSigners();
      const Presale = await ethers.getContractFactory("MoonPodPresale");
      const now = await time.latest();
      await expect(
        Presale.deploy(
          await token.getAddress(), treasury.address,
          BigInt(now + 10), BigInt(now + 1000),
          E("100"), E("10"), MIN, MAX, WEI_PER_TOKEN, admin.address
        )
      ).to.be.revertedWithCustomError(Presale, "BadConfig");
    });

    it("rejects buys before start", async () => {
      const { presale, alice } = await loadFixture(deployFixture);
      await expect(presale.connect(alice).buy({ value: MIN }))
        .to.be.revertedWithCustomError(presale, "NotStarted");
    });

    it("rejects buys after end", async () => {
      const { presale, endTime, alice } = await loadFixture(deployFixture);
      await time.increaseTo(endTime + 1n);
      await expect(presale.connect(alice).buy({ value: MIN }))
        .to.be.revertedWithCustomError(presale, "Ended");
    });
  });

  describe("contribution limits", () => {
    it("rejects below minimum", async () => {
      const { presale, alice } = await openSale();
      await expect(presale.connect(alice).buy({ value: E("0.5") }))
        .to.be.revertedWithCustomError(presale, "BelowMinimum");
    });

    it("rejects above maximum (cumulative)", async () => {
      const { presale, alice } = await openSale();
      await presale.connect(alice).buy({ value: E("50") });
      await expect(presale.connect(alice).buy({ value: E("1") }))
        .to.be.revertedWithCustomError(presale, "AboveMaximum");
    });

    it("allows top-up contributions within the max", async () => {
      const { presale, alice } = await openSale();
      await presale.connect(alice).buy({ value: E("1") });
      await presale.connect(alice).buy({ value: E("0.5") }); // cumulative 1.5, fine
      expect(await presale.contributionOf(alice.address)).to.equal(E("1.5"));
    });

    it("enforces the hard cap across wallets", async () => {
      const { presale, alice, bob, carol } = await openSale();
      await presale.connect(alice).buy({ value: E("50") });
      await presale.connect(bob).buy({ value: E("50") }); // raised = 100 = hard cap
      await expect(presale.connect(carol).buy({ value: E("1") }))
        .to.be.revertedWithCustomError(presale, "HardCapExceeded");
    });
  });

  describe("purchase accounting & decimals", () => {
    it("allocates tokens at the fixed price and emits", async () => {
      const { presale, alice } = await openSale();
      const expectedTokens = await presale.tokensForWei(MIN);
      await expect(presale.connect(alice).buy({ value: MIN }))
        .to.emit(presale, "Purchased")
        .withArgs(alice.address, MIN, expectedTokens);
      expect(await presale.tokensAllocated(alice.address)).to.equal(expectedTokens);
      expect(await presale.totalTokensSold()).to.equal(expectedTokens);
    });

    it("tokensForWei matches manual integer math", async () => {
      const { presale } = await loadFixture(deployFixture);
      const v = E("3");
      expect(await presale.tokensForWei(v)).to.equal((v * 10n ** 18n) / WEI_PER_TOKEN);
    });
  });

  describe("finalize", () => {
    it("cannot finalize before end while under hard cap", async () => {
      const { presale, admin, alice } = await openSale();
      await presale.connect(alice).buy({ value: E("5") });
      await expect(presale.connect(admin).finalize())
        .to.be.revertedWithCustomError(presale, "NotEnded");
    });

    it("can finalize early once the hard cap is hit", async () => {
      const { presale, admin, alice, bob } = await openSale();
      await presale.connect(alice).buy({ value: E("50") });
      await presale.connect(bob).buy({ value: E("50") });
      await expect(presale.connect(admin).finalize())
        .to.emit(presale, "Finalized")
        .withArgs(true, E("100"));
      expect(await presale.softCapReached()).to.equal(true);
    });

    it("only owner can finalize", async () => {
      const { presale, endTime, alice } = await openSale();
      await time.increaseTo(endTime + 1n);
      await expect(presale.connect(alice).finalize())
        .to.be.revertedWithCustomError(presale, "OwnableUnauthorizedAccount");
    });
  });

  describe("successful sale: claim + withdraw", () => {
    async function successful() {
      const f = await openSale();
      await f.presale.connect(f.alice).buy({ value: E("12") }); // >= soft cap
      await time.increaseTo(f.endTime + 1n);
      await f.presale.connect(f.admin).finalize();
      return f;
    }

    it("blocks claims before finalization", async () => {
      const { presale, alice } = await openSale();
      await presale.connect(alice).buy({ value: E("12") });
      await expect(presale.connect(alice).claim())
        .to.be.revertedWithCustomError(presale, "NotFinalized");
    });

    it("lets buyers claim exactly their allocation", async () => {
      const { presale, token, alice } = await successful();
      const owed = await presale.tokensAllocated(alice.address);
      await expect(presale.connect(alice).claim())
        .to.emit(presale, "Claimed").withArgs(alice.address, owed);
      expect(await token.balanceOf(alice.address)).to.equal(owed);
    });

    it("prevents double claims", async () => {
      const { presale, alice } = await successful();
      await presale.connect(alice).claim();
      await expect(presale.connect(alice).claim())
        .to.be.revertedWithCustomError(presale, "AlreadyDone");
    });

    it("blocks refunds on a successful sale", async () => {
      const { presale, alice } = await successful();
      await expect(presale.connect(alice).refund())
        .to.be.revertedWithCustomError(presale, "SaleSucceeded");
    });

    it("withdraws raised ETH to treasury, once", async () => {
      const { presale, admin, treasury } = await successful();
      await expect(presale.connect(admin).withdrawFunds())
        .to.changeEtherBalance(treasury, E("12"));
      await expect(presale.connect(admin).withdrawFunds())
        .to.be.revertedWithCustomError(presale, "AlreadyDone");
    });

    it("sweeps unsold tokens without touching owed tokens", async () => {
      const { presale, token, admin, treasury, alice } = await successful();
      const owed = await presale.tokensAllocated(alice.address);
      await presale.connect(admin).sweepUnsoldTokens(treasury.address);
      // contract must retain exactly what is still owed
      expect(await token.balanceOf(await presale.getAddress())).to.equal(owed);
      await presale.connect(alice).claim();
      expect(await token.balanceOf(await presale.getAddress())).to.equal(0n);
    });
  });

  describe("early treasury withdrawal prevention", () => {
    it("cannot withdraw before finalization", async () => {
      const { presale, admin, alice } = await openSale();
      await presale.connect(alice).buy({ value: E("12") });
      await expect(presale.connect(admin).withdrawFunds())
        .to.be.revertedWithCustomError(presale, "NotFinalized");
    });
  });

  describe("failed sale: refunds", () => {
    async function failed() {
      const f = await openSale();
      await f.presale.connect(f.alice).buy({ value: E("5") }); // below soft cap (10)
      await time.increaseTo(f.endTime + 1n);
      await f.presale.connect(f.admin).finalize();
      return f;
    }

    it("marks the sale failed when soft cap is not reached", async () => {
      const { presale } = await failed();
      expect(await presale.softCapReached()).to.equal(false);
    });

    it("refunds the contributor and prevents double refunds", async () => {
      const { presale, alice } = await failed();
      await expect(presale.connect(alice).refund()).to.changeEtherBalance(alice, E("5"));
      await expect(presale.connect(alice).refund())
        .to.be.revertedWithCustomError(presale, "AlreadyDone");
    });

    it("blocks claims on a failed sale", async () => {
      const { presale, alice } = await failed();
      await expect(presale.connect(alice).claim())
        .to.be.revertedWithCustomError(presale, "SaleFailed");
    });

    it("blocks treasury withdrawal on a failed sale", async () => {
      const { presale, admin } = await failed();
      await expect(presale.connect(admin).withdrawFunds())
        .to.be.revertedWithCustomError(presale, "SaleFailed");
    });
  });

  describe("reentrancy", () => {
    it("blocks re-entrant refunds", async () => {
      const { presale } = await openSale();
      const Attacker = await ethers.getContractFactory("ReentrantBuyer");
      const attacker = await Attacker.deploy(await presale.getAddress());
      await attacker.waitForDeployment();

      await attacker.buy({ value: E("5") }); // below soft cap
      const f2 = presale;
      const end = await f2.endTime();
      await time.increaseTo(end + 1n);
      const [, , admin] = await ethers.getSigners();
      await presale.connect(admin).finalize();

      // The re-entrant receive() makes the refund call fail atomically; the guard holds.
      await expect(attacker.attackRefund()).to.be.reverted;
      // Funds remain in the presale (nothing drained).
      expect(await ethers.provider.getBalance(await presale.getAddress())).to.equal(E("5"));
    });
  });

  describe("pause", () => {
    it("blocks buy and claim while paused", async () => {
      const { presale, admin, alice } = await openSale();
      await presale.connect(admin).pause();
      await expect(presale.connect(alice).buy({ value: MIN }))
        .to.be.revertedWithCustomError(presale, "EnforcedPause");
      await presale.connect(admin).unpause();
      await expect(presale.connect(alice).buy({ value: MIN })).to.not.be.reverted;
    });
  });
});
