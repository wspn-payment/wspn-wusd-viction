// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.0;

contract ERC20Param {

    mapping(address => uint256) private _balances;

    uint256 private _minFee;

    address private _owner;

    event FeeUpdated(uint256 fee);

    function getBalance(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function setFee(uint256 fee) public virtual {
        _minFee = fee;
        emit FeeUpdated(fee);
    }

    function minFee() public view returns (uint256){
        return _minFee;
    }

    function issuer() public view returns (address) {
        return _owner;
    }

    function settingBalance(address account,uint256 amount) internal {
        _balances[account] = amount;
    }

}
