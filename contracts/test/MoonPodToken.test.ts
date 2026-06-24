import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { TOTAL_SUPPLY, TOTAL_SUPPLY_WHOLE, ALLOCATIONS, ALLOCATION_SUM } from "../config/tokenomics";

describe("MoonPodToken", () => {
  async function deploy() {
    const [deployer, holder, admin, alice, bob] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MoonPodToken");
    const token = await Token.deploy(holder.address, admin.address);
    await token.waitForDeployment();
    return { token, deployer, holder, admin, alice, bob };
  }

  describe("supply & allocations", () => {
    it("mints the exact fixed supply to the initial holder", async () => {
      const { token, holder } = await loadFixture(deploy);
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await token.balanceOf(holder.address)).to.equal(TOTAL_SUPPLY);
      expect(await token.TOTAL_SUPPLY()).to.equal(TOTAL_SUPPLY);
      expect(await token.TOTAL_SUPPLY_WHOLE()).to.equal(TOTAL_SUPPLY_WHOLE);
    });

    it("has the working-spec total of 8,888,888,888 * 1e18", async () => {
      const { token } = await loadFixture(deploy);
      expect(await token.totalSupply()).to.equal(8_888_888_888n * 10n ** 18n);
    });

    it("the proposed allocation buckets sum EXACTLY to total supply (base units)", async () => {
      expect(ALLOCATION_SUM).to.equal(TOTAL_SUPPLY);
      // explicit components for documentation
      const sum =
        ALLOCATIONS.presale +
        ALLOCATIONS.liquidity +
        ALLOCATIONS.ecosystem +
        ALLOCATIONS.team +
        ALLOCATIONS.treasury;
      expect(sum).to.equal(TOTAL_SUPPLY);
    });

    it("metadata is correct", async () => {
      const { token } = await loadFixture(deploy);
      expect(await token.name()).to.equal("MoonPod");
      expect(await token.symbol()).to.equal("MOONPOD");
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("no inflation", () => {
    it("exposes no mint function", async () => {
      const { token } = await loadFixture(deploy);
      expect((token as any).mint).to.be.undefined;
    });
  });

  describe("transfers", () => {
    it("transfers move balances and emit events", async () => {
      const { token, holder, alice } = await loadFixture(deploy);
      await expect(token.connect(holder).transfer(alice.address, 1000n))
        .to.emit(token, "Transfer")
        .withArgs(holder.address, alice.address, 1000n);
      expect(await token.balanceOf(alice.address)).to.equal(1000n);
    });

    it("reverts transfers to the zero address", async () => {
      const { token, holder } = await loadFixture(deploy);
      await expect(token.connect(holder).transfer(ethers.ZeroAddress, 1n))
        .to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });
  });

  describe("burn", () => {
    it("lets a holder burn their own balance, reducing supply", async () => {
      const { token, holder } = await loadFixture(deploy);
      const before = await token.totalSupply();
      await token.connect(holder).burn(500n);
      expect(await token.totalSupply()).to.equal(before - 500n);
    });

    it("cannot burn another account's tokens without allowance", async () => {
      const { token, holder, alice } = await loadFixture(deploy);
      await expect(token.connect(alice).burnFrom(holder.address, 1n))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("permit (ERC-2612)", () => {
    it("approves via signature", async () => {
      const { token, holder, alice } = await loadFixture(deploy);
      const value = 1234n;
      const deadline = BigInt((await ethers.provider.getBlock("latest"))!.timestamp + 3600);
      const nonce = await token.nonces(holder.address);
      const domain = {
        name: "MoonPod",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await token.getAddress(),
      };
      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };
      const sig = await holder.signTypedData(domain, types, {
        owner: holder.address,
        spender: alice.address,
        value,
        nonce,
        deadline,
      });
      const { v, r, s } = ethers.Signature.from(sig);
      await token.permit(holder.address, alice.address, value, deadline, v, r, s);
      expect(await token.allowance(holder.address, alice.address)).to.equal(value);
    });
  });

  describe("pause / access control", () => {
    it("admin can pause and unpause; transfers blocked while paused", async () => {
      const { token, admin, holder, alice } = await loadFixture(deploy);
      await token.connect(admin).pause();
      await expect(token.connect(holder).transfer(alice.address, 1n))
        .to.be.revertedWithCustomError(token, "EnforcedPause");
      await token.connect(admin).unpause();
      await expect(token.connect(holder).transfer(alice.address, 1n)).to.not.be.reverted;
    });

    it("non-pauser cannot pause", async () => {
      const { token, alice } = await loadFixture(deploy);
      await expect(token.connect(alice).pause())
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount");
    });

    it("admin holds DEFAULT_ADMIN_ROLE and PAUSER_ROLE", async () => {
      const { token, admin } = await loadFixture(deploy);
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.equal(true);
      expect(await token.hasRole(PAUSER_ROLE, admin.address)).to.equal(true);
    });

    it("reverts construction with zero addresses", async () => {
      const Token = await ethers.getContractFactory("MoonPodToken");
      await expect(Token.deploy(ethers.ZeroAddress, ethers.ZeroAddress))
        .to.be.revertedWithCustomError(Token, "ZeroAddress");
    });
  });
});
