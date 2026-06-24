# Security Model

## Secrets
Secrets live **only** in environment variables / a local `.env` (git-ignored) and CI secrets —
never in source, the frontend bundle, deployment records, GitHub, Git history, Replit, or chat.
`hardhat.config.ts` reads `SEPOLIA_RPC_URL`, `MAINNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY`,
`ETHERSCAN_API_KEY` from the environment. A pre-push secret scan is mandatory
(`current-state-audit.md`). GitHub Pages cannot host secrets; the static site needs none.

## Keys & administration (handoff Section 17)
Production ownership must **not** remain in a single browser wallet. Use a reputable multisig
(e.g. Safe) for: token pause authority, presale administration, treasury, liquidity allocation,
ecosystem funds, and any necessary contract ownership. Document signers, threshold, recovery
process, hardware-wallet requirement, transaction-review process, and emergency procedures.
Private keys must never be placed in GitHub, GitHub Actions, Replit, Claude, frontend source,
deployment records, or shared chat.

## Contract trust model
- **Token:** fixed supply minted once; no mint function; no owner seize/supply-change; holder-only
  burn; pause limited to `PAUSER_ROLE`; immutable (no proxy). Pausing transfers is a powerful
  capability — it must sit behind the multisig and be used only for emergencies.
- **Presale:** treasury funds locked until finalized **and** soft cap reached; failed-sale ETH is
  only ever refunded to contributors; reentrancy-guarded; double-claim/refund prevented; no owner
  allocation or supply-change path; pausable by owner (multisig).
- **Vesting:** funds flow only to the fixed beneficiary on the linear/cliff schedule;
  non-revocable by default; release callable by anyone but always pays the beneficiary.

## Roles to assign at deployment
| Role | Holder (target) |
|---|---|
| Token `DEFAULT_ADMIN_ROLE` / `PAUSER_ROLE` | Multisig |
| Presale `owner` (finalize, pause, withdraw, sweep) | Multisig |
| ETH/token recipients (treasury, liquidity) | Multisig-controlled |
| Deployer | Hardware-wallet EOA, then transfer roles to multisig |

## Independent review
Automated analysis (Slither) runs in CI as **advisory**. Per the handoff: **OpenZeppelin usage
is not proof that MoonPod's custom code is audited.** The custom presale and vesting (and any
custom Genesis code) require **independent human security review** before mainnet. Use pinned,
unmodified OpenZeppelin (`@openzeppelin/contracts@5.1.0`); do not fork OZ without a documented
reason.

## Frontend safety
Verify chain ID before any transaction; block actions on the wrong network; read addresses only
from versioned deployment records; handle wallet rejection and RPC failure cleanly; expose no
credentials. The prelaunch build enables no transactions at all.
