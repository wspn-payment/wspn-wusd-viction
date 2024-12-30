//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


interface IVRC25Permit {

    /**
     * Returns unused nonce for specified owner. Signature with nonce different that this value is invalid thus cannot be used.
     * @param owner the account
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * This is the same as approve function with the different that caller is not necessary the owner.
     *  Instead, the caller must provide a valid signature signed by the owner
     */
    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
}