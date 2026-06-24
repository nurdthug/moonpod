// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title MoonPodToken ($MOONPOD)
 * @notice Fixed-supply ERC-20 for the MoonPod ecosystem.
 *
 * Design constraints (MoonPod handoff, Sections 6.2 / 6.3):
 *  - Standard ERC-20 compatibility.
 *  - Fixed supply minted ONCE in the constructor. There is no mint function,
 *    so total supply can never increase after deployment.
 *  - Holders may burn their own balance (ERC20Burnable). Burning reduces supply
 *    and is irreversible; no privileged role can burn another account's tokens.
 *  - ERC-2612 permit support (gasless approvals).
 *  - Emergency pause that halts all transfers (PAUSER_ROLE only).
 *  - Explicit role-based access control. No owner function can seize balances,
 *    change the fixed supply, or mint new tokens.
 *  - No transfer tax, no blacklist, no proxy/upgradeability.
 *
 * @dev WORKING SPECIFICATION (pending Rowland Akinduro's final approval before any
 *      mainnet deployment): total supply 8,888,888,888 whole tokens. The entire
 *      supply is minted to `initialHolder` (intended to be a multisig distributor),
 *      which then funds the vesting and presale contracts per the launch sequence.
 *      The 1,000,000,000 figure shown on the live website is NOT used here; see
 *      docs/tokenomics-decision.md for the unresolved supply decision.
 */
contract MoonPodToken is ERC20, ERC20Burnable, ERC20Pausable, ERC20Permit, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Fixed total supply in whole tokens (working spec, pending approval).
    uint256 public constant TOTAL_SUPPLY_WHOLE = 8_888_888_888;

    /// @notice Fixed total supply in base units (18 decimals).
    uint256 public constant TOTAL_SUPPLY = TOTAL_SUPPLY_WHOLE * 1e18;

    error ZeroAddress();

    /**
     * @param initialHolder Receives the entire fixed supply (intended: multisig distributor).
     * @param admin         Holds DEFAULT_ADMIN_ROLE and PAUSER_ROLE (intended: multisig).
     */
    constructor(address initialHolder, address admin)
        ERC20("MoonPod", "MOONPOD")
        ERC20Permit("MoonPod")
    {
        if (initialHolder == address(0) || admin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);

        // The ONLY mint that will ever happen. No mint function exists.
        _mint(initialHolder, TOTAL_SUPPLY);
    }

    /// @notice Pause all token transfers (emergency only).
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Resume token transfers.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ----- Required multiple-inheritance override -----

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
