// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2024 Fireblocks <support@fireblocks.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
pragma solidity ^0.8.20;

import {VRC25Permit} from "./library/ERC20/VRC25Permit.sol";
import {VRC25Upgradable} from "./library/ERC20/VRC25Upgradable.sol";
import {IERC1967Upgradeable} from "@openzeppelin/contracts-upgradeable/interfaces/IERC1967Upgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IERC20Errors} from "./library/Errors/interface/IERC20Errors.sol";

import {LibErrors} from "./library/Errors/LibErrors.sol";
import {AccessRegistrySubscriptionUpgradeable} from "./library/AccessRegistry/AccessRegistrySubscriptionUpgradeable.sol";
import {PauseUpgradeable} from "./library/Utils/PauseUpgradeable.sol";

/**
 * @title VRC25
 * @author Fireblocks
 * @notice This contract represents a fungible token within the Fireblocks ecosystem of contracts.
 *
 * The contract utilizes the UUPS (Universal Upgradeable Proxy Standard) for seamless upgradability. This standard
 * enables the contract to be easily upgraded without disrupting its state. By following the UUPS proxy pattern, the
 * ERC20F logic is separated from the storage, allowing upgrades while preserving the existing data. This
 * approach ensures that the contract can adapt and evolve over time, incorporating improvements and new features and
 * mitigating potential attack vectors in future.
 *
 * The VRC25 contract Role Based Access Control employs following roles:
 *
 *  - UPGRADER_ROLE
 *  - PAUSER_ROLE
 *  - CONTRACT_ADMIN_ROLE
 *  - MINTER_ROLE
 *  - BURNER_ROLE
 *  - RECOVERY_ROLE
 *
 * The VRC25.sol Token contract can utilize an Access Registry contract to retrieve information on whether an account
 * is authorized to interact with the system.
 */
contract VRC25 is
VRC25Upgradable,
VRC25Permit,
PauseUpgradeable,
AccessControlUpgradeable,
AccessRegistrySubscriptionUpgradeable,
IERC20Errors,
UUPSUpgradeable
{
    /**
     * @notice The Access Control identifier for the Upgrader Role.
     * An account with "UPGRADER_ROLE" can upgrade the implementation contract address.
     *
     * @dev This constant holds the hash of the string "UPGRADER_ROLE".
     */
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /**
     * @notice The Access Control identifier for the Pauser Role.
     * An account with "PAUSER_ROLE" can pause the contract.
     *
     * @dev This constant holds the hash of the string "PAUSER_ROLE".
     */
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @notice The Access Control identifier for the Contract Admin Role.
     * An account with "CONTRACT_ADMIN_ROLE" can update the contract URI.
     *
     * @dev This constant holds the hash of the string "CONTRACT_ADMIN_ROLE".
     */
    bytes32 public constant CONTRACT_ADMIN_ROLE = keccak256("CONTRACT_ADMIN_ROLE");

    /**
     * @notice The Access Control identifier for the Minter Role.
     * An account with "MINTER_ROLE" can mint tokens.
     *
     * @dev This constant holds the hash of the string "MINTER_ROLE".
     */
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /**
     * @notice The Access Control identifier for the Burner Role.
     * An account with "BURNER_ROLE" can burn tokens.
     *
     * @dev This constant holds the hash of the string "BURNER_ROLE".
     */
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /**
     * @notice The Access Control identifier for the Recovery Role.
     * An account with "RECOVERY_ROLE" can recover tokens.
     *
     * @dev This constant holds the hash of the string "RECOVERY_ROLE".
     */
    bytes32 public constant RECOVERY_ROLE = keccak256("RECOVERY_ROLE");

    // Cache interface IDs as constants to save gas and reduce bytecode
    bytes4 private constant _IERC1967_INTERFACE_ID = type(IERC1967Upgradeable).interfaceId;

    /**
     * @notice This event is logged when the funds are recovered from an address that is not allowed
     * to participate in the system.
     *
     * @param caller The (indexed) address of the caller.
     * @param account The (indexed) account the tokens were recovered from.
     * @param amount The number of tokens recovered.
     */
    event TokensRecovered(address indexed caller, address indexed account, uint256 amount);

    /**
     * @notice This function configures the ERC20F contract with the initial state and granting
     * privileged roles.
     *
     * @dev Calling Conditions:
     *
     * - Can only be invoked once (controlled via the {initializer} modifier).
     * - Non-zero address `defaultAdmin`.
     * - Non-zero address `minter`.
     * - Non-zero address `pauser`.
     *
     * @param _name The name of the token.
     * @param _symbol The symbol of the token.
     * @param defaultAdmin The account to be granted the "DEFAULT_ADMIN_ROLE".
     * @param minter The account to be granted the "MINTER_ROLE".
     * @param pauser The account to be granted the "PAUSER_ROLE".
     */
    function initialize(
        string calldata _name,
        string calldata _symbol,
        address defaultAdmin,
        address minter,
        address pauser,
        uint8 decimal
    ) external initializer {
        if (defaultAdmin == address(0) || pauser == address(0) || minter == address(0)) {
            revert LibErrors.InvalidAddress();
        }

        __UUPSUpgradeable_init();
        __VRC25_init(_name, _symbol,decimal);
        __Pause_init();
        initPermit();
        __AccessRegistrySubscription_init(address(0));

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, pauser);
    }
    /**
     * @notice This is a function used to issue new tokens.
     * The caller will issue tokens to the `to` address.
     *
     * @dev Calling Conditions:
     *
     * - Can only be invoked by the address that has the role "MINTER_ROLE".
     * - {ERC20F} is not paused. (checked internally by {_beforeTokenTransfer})
     * - `to` is a non-zero address. (checked internally by {VRC25Upgradeable}.{_mint})
     * - `to` is allowed to receive tokens.
     *
     * This function emits a {Transfer} event as part of {VRC25Upgradeable._mint}.
     *
     * @param to The address that will receive the issued tokens.
     * @param amount The number of tokens to be issued.
     */
    function mint(address to, uint256 amount) external virtual onlyRole(MINTER_ROLE) {
        _requireHasAccess(to, false);
        _mint(to, amount);
    }


    /**
     * @notice This is a function used to burn tokens.
     * The caller will burn tokens from their own address.
     *
     * @dev Calling Conditions:
     *
     * - Can only be invoked by the address that has the role "BURNER_ROLE".
     * - {ERC20F} is not paused. (checked internally by {_beforeTokenTransfer})
     * - `amount` is less than or equal to the caller's balance. (checked internally by {VRC25Upgradeable}.{_burn})
     * - `amount` is not equals 0. (checked internally by {VRC25Upgradeable}.{_burn})
     *
     * This function emits a {Transfer} event as part of {VRC25Upgradeable._burn}.
     *
     * @param amount The number of tokens to be burned.
     */
    function burn(uint256 amount) external virtual onlyRole(BURNER_ROLE) {
        if (amount == 0) revert LibErrors.ZeroAmount();
        _requireHasAccess(_msgSender(), true);
        _burn(_msgSender(), amount);
    }

    /**
     * @notice This is a function used to recover tokens from an address not on the Allowlist.
     *
     * @dev Calling Conditions:
     *
     * - `caller` of this function must have the "RECOVERY_ROLE".
     * - {ERC20F} is not paused.(checked internally by {_beforeTokenTransfer}).
     * - `account` address must be not be allowed to hold tokens.
     * - `account` must be a non-zero address. (checked internally in {VRC25Upgradeable._transfer})
     * - `amount` is greater than 0.
     * - `amount` is less than or equal to the balance of the account. (checked internally in {VRC25Upgradeable._transfer})
     *
     * This function emits a {TokensRecovered} event, signalling that the funds of the given address were recovered.
     *
     * @param account The address to recover the tokens from.
     * @param amount The amount to be recovered from the balance of the `account`.
     */
    function recoverTokens(address account, uint256 amount) external virtual onlyRole(RECOVERY_ROLE) {
        if (amount == 0) revert LibErrors.ZeroAmount();
        if (address(accessRegistry) == address(0)) revert LibErrors.AccessRegistryNotSet();
        if (accessRegistry.hasAccess(account, _msgSender(), _msgData())) revert LibErrors.RecoveryOnActiveAccount(account);
        emit TokensRecovered(_msgSender(), account, amount);
        _transfer(account, _msgSender(), amount);
    }

    /**
     * @notice This is a function that allows an owner to provide off-chain permission for a specific `spender` to spend
     * a certain amount of tokens on their behalf, using an ECDSA signature. This signature is then provided to this
     * {ERC20F} contract which verifies the signature and updates the allowance. This exercise reduces the number
     * of transactions required to approve a transfer.
     *
     * @dev If the Spender already has a non-zero allowance by the same caller(approver), the allowance will be set to
     * reflect the new amount.
     *
     * Calling Conditions:
     *
     * - {ERC20F} is not paused.
     * - The `owner` must be a non-zero address. (checked internally by {VRC25Upgradeable}.{_approve})
     * - `spender` must be a non-zero address. (checked internally by {VRC25Upgradeable}.{_approve})
     * - `deadline` must be a timestamp in the future. (checked internally by {VRC25Permit}.{permit})
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments. (checked internally by {VRC25Permit}.{permit})
     * - The signature must use `owner`'s current nonce
     *
     * This function emits an {Approval} event as part of {VRC25Upgradeable._approve}.
     *
     * @param owner The address that will sign the approval.
     * @param spender The address that will receive the approval.
     * @param value The allowance that will be approved.
     * @param deadline The expiry timestamp of the signature.
     * @param v The recovery byte of the ECDSA signature.
     * @param r The first 32 bytes of the ECDSA signature.
     * @param s The second 32 bytes of the ECDSA signature.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override whenNotPaused {
        super.permit(owner ,spender,value,deadline,v,r,s);
    }

    /**
     * @notice This function allows the owner of the tokens to authorize another address to spend a certain
     * amount of token on their behalf. The `spender` parameter is the address that is being authorized
     * to spend the token, and the `amount` parameter is the maximum number of tokens that the spender
     * is authorized to spend.
     *
     * @dev Calling Conditions:
     *
     * - {ERC20F} is not paused.
     * - The `spender` must be a non-zero address. (checked internally by {VRC25Upgradeable}.{_approve})
     *
     * If the spender is already authorized to spend a non-zero amount of token, the `amount` parameter
     * will overwrite the previously authorized amount.
     *
     * Upon successful execution function emits an {Approval} event as part of {VRC25Upgradeable._approve}.
     *
     * @param spender The address getting an allowance.
     * @param amount The amount allowed to be spent.
     * @return True value indicating whether the approval was successful.
     */
    function approve(address spender, uint256 amount) public virtual override whenNotPaused returns (bool) {
        return super.approve(spender, amount);
    }

    /**
     * @notice This is a function used to transfer tokens from the sender to
     * the `to` address.
     *
     * @dev Calling Conditions:
     *
     * - {ERC20F} is not paused. (checked internally by {_beforeTokenTransfer})
     * - The `sender` is allowed to send tokens.
     * - The `to` is allowed to receive tokens.
     * - `to` is a non-zero address. (checked internally by {VRC25Upgradeable}.{_transfer})
     * - `amount` is not greater than sender's balance. (checked internally by {VRC25Upgradeable}.{_transfer})
     *
     * This function emits a {Transfer} event as part of {VRC25Upgradeable._transfer}.
     *
     * @param to The address that will receive the tokens.
     * @param amount The number of tokens that will be sent to the `recipient`.
     * @return True if the function was successful.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        _requireHasAccess(_msgSender(), true);
        _requireHasAccess(to, false);
        return super.transfer(to, amount);
    }

    /**
     * @notice This is a function used to transfer tokens on behalf of the `from` address to
     * the `to` address.
     *
     * This function emits an {Approval} event as part of {VRC25Upgradeable._approve}.
     * This function emits a {Transfer} event as part of {VRC25Upgradeable._transfer}.
     *
     * @dev Calling Conditions:
     *
     * - {ERC20F} is not paused. (checked internally by {_beforeTokenTransfer})
     * - The `from` is allowed to send tokens.
     * - The `to` is allowed to receive tokens.
     * - `from` is a non-zero address. (checked internally by {VRC25Upgradeable}.{_transfer})
     * - `to` is a non-zero address. (checked internally by {VRC25Upgradeable}.{_transfer})
     * - `amount` is not greater than `from`'s balance or caller's allowance of `from`'s funds. (checked internally
     *   by {VRC25Upgradeable}.{transferFrom})
     * - `amount` is greater than 0. (checked internally by {_spendAllowance})
     *
     * @param from The address that tokens will be transferred on behalf of.
     * @param to The address that will receive the tokens.
     * @param amount The number of tokens that will be sent to the `to` (recipient).
     * @return True if the function was successful.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        _requireHasAccess(from, true);
        _requireHasAccess(to, false);
        return super.transferFrom(from, to, amount);
    }

    /**
     * @notice This is a function used to check if an interface is supported by this contract.
     * @dev This function returns `true` if the interface is supported, otherwise it returns `false`.
     * @return `true` if the interface is supported, otherwise it returns `false`.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(VRC25Upgradable,AccessControlUpgradeable) returns (bool) {
        return
            interfaceId == _IERC1967_INTERFACE_ID ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @notice This function works as a middle layer and performs some checks before
     * it allows a transfer to operate.
     *
     * @dev A hook inherited from VRC25Upgradeable.
     *
     * This function performs the following checks, and reverts when not met:
     *
     * - {ERC20F} is not paused.
     *
     * @param from The address that sent the tokens.
     * @param to The address that receives the transfer `amount`.
     * @param amount The number of tokens sent to the `to` address.
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override whenNotPaused {}

    /**
     * @notice This method is a crucial part for managing the upgrade permission of smart contracts.
     *
     * This function performs the following checks, and reverts when not met:
     *
     * - Can only be invoked by the address that has the role "UPGRADER_ROLE".
     *
     * @param newImplementation The address that new implementation logic.
     */
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyRole(UPGRADER_ROLE) {}

    /**
     * @notice This is a function that applies any validations required to allow Pause operations (like pause or unpause) to be executed.
     *
     * @dev Reverts when the caller does not have the "PAUSER_ROLE".
     *
     * Calling Conditions:
     *
     * - Only the "PAUSER_ROLE" can execute.
     */
    /* solhint-disable no-empty-blocks */
    function _authorizePause() internal virtual override onlyRole(PAUSER_ROLE) {}

    /**
     * @notice This is a function that applies any validations required to allow Access Registry updates.
     *
     * @dev Reverts when the caller does not have the "CONTRACT_ADMIN_ROLE".
     *
     * Calling Conditions:
     *
     * - Only the "CONTRACT_ADMIN_ROLE" can execute.
     * - {ERC20F} is not paused.
     */
    /* solhint-disable no-empty-blocks */
    function _authorizeAccessRegistryUpdate() internal virtual override whenNotPaused onlyRole(CONTRACT_ADMIN_ROLE) {}


    /**
     * @notice The function of this method is to estimate the gas  fee.
     * The function use the default minFee() as baseFee.
     *
     * @param value The amount of current transaction.
     */
    function _estimateFee(uint256 value) internal view virtual override  returns (uint256){
        return minFee();
    }

    /**
     * @notice This function checks that an account can have access to this token.
     * The function will revert if the account does not have access.
     *
     * @param account The address to check has access.
     * @param isSender Value indicating if the sender or receiver is being checked.
     */
    function _requireHasAccess(address account, bool isSender) internal view virtual {
        if (address(accessRegistry) != address(0)) {
			if (!accessRegistry.hasAccess(account, _msgSender(), _msgData())) {
				if (isSender) {
					revert ERC20InvalidSender(account);
				} else {
					revert ERC20InvalidReceiver(account);
				}
			}
		}
    }

}