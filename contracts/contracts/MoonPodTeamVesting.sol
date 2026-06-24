// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MoonPodTeamVesting
 * @notice Linear token vesting with a cliff for a single beneficiary.
 *
 * Working spec (handoff Section 6.3): team allocation vests over 2 years with a
 * 6-month cliff, linear after the cliff. This contract is NON-REVOCABLE by design
 * (the trust-minimising default); revocability is a pending decision documented in
 * docs/tokenomics-decision.md. For multiple team members, deploy one instance per
 * beneficiary with that member's own schedule.
 *
 * @dev The vesting total is derived from the contract's own token balance plus what
 *      has already been released, so the schedule simply tracks however much the
 *      contract was funded with. Fund it ONCE, before the cliff, from the distributor.
 *      Vesting math uses base units only (no human-decimal arithmetic).
 */
contract MoonPodTeamVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;        // unix seconds
    uint64 public immutable cliff;        // unix seconds (= start + cliff duration)
    uint64 public immutable duration;     // seconds (total vesting period from start)

    uint256 public released;              // base units already released

    event TokensReleased(uint256 amount);

    error ZeroAddress();
    error InvalidSchedule();
    error NothingToRelease();

    /**
     * @param token_         The MoonPod token.
     * @param beneficiary_   Recipient of the vested tokens.
     * @param start_         Vesting start timestamp (unix seconds).
     * @param cliffSeconds_  Cliff length from start (e.g. 180 days). Nothing releases before it.
     * @param durationSeconds_ Total vesting length from start (e.g. 730 days). Must be >= cliff.
     */
    constructor(
        IERC20 token_,
        address beneficiary_,
        uint64 start_,
        uint64 cliffSeconds_,
        uint64 durationSeconds_
    ) {
        if (address(token_) == address(0) || beneficiary_ == address(0)) revert ZeroAddress();
        if (durationSeconds_ == 0 || cliffSeconds_ > durationSeconds_) revert InvalidSchedule();

        token = token_;
        beneficiary = beneficiary_;
        start = start_;
        cliff = start_ + cliffSeconds_;
        duration = durationSeconds_;
    }

    /// @notice Total tokens controlled by this contract over the whole schedule.
    function totalAllocation() public view returns (uint256) {
        return token.balanceOf(address(this)) + released;
    }

    /// @notice Amount vested by `timestamp` (base units).
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        uint256 total = totalAllocation();
        if (timestamp < cliff) {
            return 0;
        } else if (timestamp >= start + duration) {
            return total;
        } else {
            // Linear from start, only payable once the cliff has passed.
            return (total * (timestamp - start)) / duration;
        }
    }

    /// @notice Amount currently releasable (vested minus already released).
    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    /// @notice Release all currently-vested tokens to the beneficiary.
    /// @dev Callable by anyone; tokens always go to the fixed beneficiary.
    function release() external {
        uint256 amount = releasable();
        if (amount == 0) revert NothingToRelease();
        released += amount;
        emit TokensReleased(amount);
        token.safeTransfer(beneficiary, amount);
    }
}
