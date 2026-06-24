// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MoonPodPresale
 * @notice ETH-denominated presale for $MOONPOD with soft cap, hard cap, per-wallet
 *         limits, claim-on-success and refund-on-failure.
 *
 * PRICING MODEL (handoff Section 7.1): this contract denominates price, caps and
 * per-wallet limits ALL in ETH (wei). This is the "Option 1" model recommended for
 * minimal oracle risk and simple auditing. USD figures in planning are references
 * only; the ETH values below are set at deploy time and are the binding terms.
 * The final pricing model and numbers require Rowland's explicit approval before any
 * deployment — see docs/tokenomics-decision.md.
 *
 * Safety properties:
 *  - No owner allocation mechanism, no ability to alter token supply.
 *  - Treasury funds cannot be withdrawn until the sale is finalized AND the soft cap
 *    is reached. On a failed sale, ETH is only ever returned to contributors.
 *  - Double-claim and double-refund prevented by per-wallet flags.
 *  - Reentrancy guarded; checks-effects-interactions throughout.
 */
contract MoonPodPresale is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;       // $MOONPOD
    address public immutable treasury;   // receives ETH on success

    uint64 public immutable startTime;
    uint64 public immutable endTime;

    uint256 public immutable softCapWei;
    uint256 public immutable hardCapWei;
    uint256 public immutable minContributionWei; // per wallet, cumulative floor
    uint256 public immutable maxContributionWei; // per wallet, cumulative ceiling

    /// @notice Cost in wei for one whole token (1e18 base units).
    uint256 public immutable weiPerToken;

    uint256 public totalRaisedWei;
    uint256 public totalTokensSold;     // base units owed to buyers
    uint256 public totalTokensClaimed;  // base units already claimed

    bool public finalized;
    bool public softCapReached;
    bool public fundsWithdrawn;

    mapping(address => uint256) public contributionOf; // wei
    mapping(address => uint256) public tokensAllocated; // base units, price locked at buy
    mapping(address => bool) public hasClaimed;
    mapping(address => bool) public hasRefunded;

    event Purchased(address indexed buyer, uint256 weiAmount, uint256 tokenAmount);
    event Finalized(bool softCapReached, uint256 totalRaisedWei);
    event Claimed(address indexed buyer, uint256 tokenAmount);
    event Refunded(address indexed buyer, uint256 weiAmount);
    event FundsWithdrawn(address indexed treasury, uint256 weiAmount);
    event UnsoldTokensSwept(address indexed to, uint256 tokenAmount);

    error ZeroAddress();
    error BadConfig();
    error NotStarted();
    error Ended();
    error NotEnded();
    error AlreadyFinalized();
    error NotFinalized();
    error BelowMinimum();
    error AboveMaximum();
    error HardCapExceeded();
    error SaleSucceeded();
    error SaleFailed();
    error NothingToClaim();
    error NothingToRefund();
    error AlreadyDone();
    error TransferFailed();

    constructor(
        IERC20 token_,
        address treasury_,
        uint64 startTime_,
        uint64 endTime_,
        uint256 softCapWei_,
        uint256 hardCapWei_,
        uint256 minContributionWei_,
        uint256 maxContributionWei_,
        uint256 weiPerToken_,
        address owner_
    ) Ownable(owner_) {
        if (address(token_) == address(0) || treasury_ == address(0) || owner_ == address(0)) {
            revert ZeroAddress();
        }
        if (
            startTime_ >= endTime_ ||
            softCapWei_ == 0 ||
            softCapWei_ > hardCapWei_ ||
            minContributionWei_ == 0 ||
            minContributionWei_ > maxContributionWei_ ||
            weiPerToken_ == 0
        ) {
            revert BadConfig();
        }

        token = token_;
        treasury = treasury_;
        startTime = startTime_;
        endTime = endTime_;
        softCapWei = softCapWei_;
        hardCapWei = hardCapWei_;
        minContributionWei = minContributionWei_;
        maxContributionWei = maxContributionWei_;
        weiPerToken = weiPerToken_;
    }

    /// @notice Whole-token base units purchasable for `weiAmount` at the fixed price.
    function tokensForWei(uint256 weiAmount) public view returns (uint256) {
        return (weiAmount * 1e18) / weiPerToken;
    }

    /// @notice Contribute ETH to the presale.
    function buy() external payable whenNotPaused nonReentrant {
        if (finalized) revert AlreadyFinalized();
        if (block.timestamp < startTime) revert NotStarted();
        if (block.timestamp > endTime) revert Ended();

        uint256 newContribution = contributionOf[msg.sender] + msg.value;
        if (newContribution < minContributionWei) revert BelowMinimum();
        if (newContribution > maxContributionWei) revert AboveMaximum();
        if (totalRaisedWei + msg.value > hardCapWei) revert HardCapExceeded();

        uint256 tokens = tokensForWei(msg.value);

        contributionOf[msg.sender] = newContribution;
        tokensAllocated[msg.sender] += tokens;
        totalRaisedWei += msg.value;
        totalTokensSold += tokens;

        emit Purchased(msg.sender, msg.value, tokens);
    }

    /// @notice Close the sale and lock in success/failure. Callable once the sale has
    ///         ended OR the hard cap has been reached. Owner-only.
    function finalize() external onlyOwner {
        if (finalized) revert AlreadyFinalized();
        if (block.timestamp <= endTime && totalRaisedWei < hardCapWei) revert NotEnded();

        finalized = true;
        softCapReached = totalRaisedWei >= softCapWei;
        emit Finalized(softCapReached, totalRaisedWei);
    }

    /// @notice Claim purchased tokens after a successful, finalized sale.
    function claim() external whenNotPaused nonReentrant {
        if (!finalized) revert NotFinalized();
        if (!softCapReached) revert SaleFailed();
        if (hasClaimed[msg.sender]) revert AlreadyDone();

        uint256 amount = tokensAllocated[msg.sender];
        if (amount == 0) revert NothingToClaim();

        hasClaimed[msg.sender] = true;
        totalTokensClaimed += amount;
        emit Claimed(msg.sender, amount);

        token.safeTransfer(msg.sender, amount);
    }

    /// @notice Refund a contribution after a failed, finalized sale.
    function refund() external nonReentrant {
        if (!finalized) revert NotFinalized();
        if (softCapReached) revert SaleSucceeded();
        if (hasRefunded[msg.sender]) revert AlreadyDone();

        uint256 amount = contributionOf[msg.sender];
        if (amount == 0) revert NothingToRefund();

        hasRefunded[msg.sender] = true;
        emit Refunded(msg.sender, amount);

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice Send raised ETH to the treasury. Only after a successful finalization.
    ///         This is the ONLY path out for ETH on success, and it cannot run early.
    function withdrawFunds() external onlyOwner nonReentrant {
        if (!finalized) revert NotFinalized();
        if (!softCapReached) revert SaleFailed();
        if (fundsWithdrawn) revert AlreadyDone();

        fundsWithdrawn = true;
        uint256 amount = totalRaisedWei;
        emit FundsWithdrawn(treasury, amount);

        (bool ok, ) = payable(treasury).call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @notice After a successful sale, return tokens that were funded but never sold.
    ///         Cannot touch tokens still owed to buyers.
    function sweepUnsoldTokens(address to) external onlyOwner {
        if (!finalized) revert NotFinalized();
        if (!softCapReached) revert SaleFailed();
        if (to == address(0)) revert ZeroAddress();

        uint256 outstanding = totalTokensSold - totalTokensClaimed;
        uint256 balance = token.balanceOf(address(this));
        uint256 sweepable = balance - outstanding;
        if (sweepable == 0) revert NothingToClaim();

        emit UnsoldTokensSwept(to, sweepable);
        token.safeTransfer(to, sweepable);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
