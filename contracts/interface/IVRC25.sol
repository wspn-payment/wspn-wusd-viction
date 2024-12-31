//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;


interface IVRC25{
    /**
     * Return the decimals of the token.
     */
    function decimals() external view returns (uint8);

    /**
     * Returns the token total supply.
     */
    function totalSupply() external view returns (uint256);

    /**
     * Returns the account balance of another account with address owner.
     * @param owner the account's address
     */
    function balanceOf(address owner) external view returns (uint256);

    /**
     * Returns the address of the token issuer.
     */
    function issuer() external view returns (address);

    /**
     * Returns the amount which spender is still allowed to withdraw from owner.
     * @param owner the target's address
     * @param spender the owner who need to withdraw the amount
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * Calculate the transaction fee in terms of the token that the transaction makers will have to pay. 
     * Transaction fee will be paid to the issuer of the VRC25-Origin.sol token contract.
     * @param value the number of tokens
     */
    function estimateFee(uint256 value) external view returns (uint256);

    /**
     * Transfers value amount of tokens to address recipient
     * @param recipient the address of receive the token
     * @param value the amount
     */
    function transfer(address recipient, uint256 value) external returns (bool);

    /**
     * Allows spender to withdraw from your account 
     * @param spender  the owner who need to withdraw the amount
     * @param value  allowance amount
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * Transfers value amount of tokens from the address from to the address to
     * @param from the source 
     * @param to the recipient
     * @param value the amount of token
     */
    function transferFrom(address from, address to, uint256 value) external  returns (bool);


    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

    event Fee(address indexed from, address indexed to, address indexed issuer, uint256 value);

}
