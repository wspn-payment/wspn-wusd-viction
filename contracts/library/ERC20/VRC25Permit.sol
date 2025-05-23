// SPDX-License-Identifier: MIT
pragma solidity >=0.7.6;

import "../../interface/IVRC25Permit.sol";

import "../Utils/ECDSA.sol";
import "../Utils/EIP712.sol";

import "./VRC25Upgradable.sol";

error PermitExpired();
error InvalidPermit();

abstract contract VRC25Permit is VRC25Upgradable, EIP712, IVRC25Permit {
    bytes32 private constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    mapping(address => uint256) private _nonces;

    function initPermit() internal {
        init("VRC25", "1");
    }

    /**
     * @dev See {IERC20Permit-DOMAIN_SEPARATOR}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Returns an the next unused nonce for an address.
     */
    function nonces(address owner) public view virtual override(IVRC25Permit) returns (uint256) {
        return _nonces[owner];
    }

    /**
     * @dev See {IERC20Permit-permit}.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        if (block.timestamp > deadline) revert PermitExpired();

        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TYPEHASH,
                owner,
                spender,
                value,
                _useNonce(owner),
                deadline
            )
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        if (signer != owner) revert InvalidPermit();

        uint256 fee = estimateFee(0);
        _approve(owner, spender, value);
        _chargeFeeFrom(owner, address(this), fee);
    }

    /**
     * @dev Consumes a nonce.
     *
     * Returns the current value and increments nonce.
     */
    function _useNonce(address owner) internal returns (uint256) {
        // For each account, the nonce has an initial value of 0, can only be incremented by one, and cannot be
        // decremented or reset. This guarantees that the nonce never overflows.
        // It is important to do x++ and not ++x here.
        return _nonces[owner]++;
    }
}