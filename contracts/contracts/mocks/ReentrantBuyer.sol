// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {MoonPodPresale} from "../MoonPodPresale.sol";

/**
 * @dev Test-only attacker. On receiving an ETH refund it attempts to re-enter
 *      refund(). The presale's nonReentrant guard must cause the re-entry to revert,
 *      which (because the outer call bubbles the revert) makes the whole refund fail.
 */
contract ReentrantBuyer {
    MoonPodPresale public immutable presale;
    bool private attacking;

    constructor(MoonPodPresale presale_) {
        presale = presale_;
    }

    function buy() external payable {
        presale.buy{value: msg.value}();
    }

    function attackRefund() external {
        attacking = true;
        presale.refund();
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            // Re-entrant call — must revert due to ReentrancyGuard.
            presale.refund();
        }
    }
}
