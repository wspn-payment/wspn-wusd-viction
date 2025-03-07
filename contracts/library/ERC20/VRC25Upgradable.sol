// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../interface/IVRC25.sol";
import "../../interface/IERC165.sol";

error NotOwner();
error ZeroAddress();
error InsufficientBalance();
error InvalidNewOwner();
error OnlyNewOwnerCanAccept();

/**
 * @title Base VRC25 implementation
 * @notice VRC25Upgradable implementation for opt-in to gas sponsor program. This replace Ownable from OpenZeppelin as well.
 */
abstract contract VRC25Upgradable is IVRC25, IERC165 {

    // The order of _balances, _minFeem, _issuer must not be changed to pass validation of gas sponsor application
    mapping (address => uint256) private _balances;
    uint256 private _minFee;
    address private _owner;
    address private _newOwner;

    mapping (address => mapping (address => uint256)) private _allowances;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;

    event FeeUpdated(uint256 fee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @notice Init VRC25 contract, MUST BE call only 1 one time when init smart contract.
     */
    function __VRC25_init(string memory name_, string memory symbol_, uint8 decimals_) internal {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        if (_owner != msg.sender) revert NotOwner();
        _;
    }

    /**
     * @notice Name of token
     */
    function name() public view returns (string memory) {
        return _name;
    }

    /**
     * @notice Symbol of token
     */
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    /**
     * @notice Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     */
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @notice Returns the amount of tokens in existence.
     */
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @notice Returns the amount of tokens owned by `account`.
     * @param owner_ The address to query the balance of.
     * @return An uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address owner_) public view override returns (uint256) {
        return _balances[owner_];
    }

    /**
     * @notice Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner_,address spender) public view override returns (uint256){
        return _allowances[owner_][spender];
    }

    /**
     * @notice Owner of the token
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @notice Owner of the token
     */
    function issuer() public view override returns (address) {
        return _owner;
    }

    /**
     * @dev The amount fee that will be lost when transferring.
     */
    function minFee() public view returns (uint256) {
        return _minFee;
    }

    /**
     * @notice Calculate fee needed to transfer `amount` of tokens.
     */
    function estimateFee(uint256 value) public view override returns (uint256) {
        if (tx.origin!=msg.sender) {
            return 0;
        } else {
            return _estimateFee(value);
        }
    }

    /**
     * @notice Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 fee = estimateFee(amount);
        _transfer(msg.sender, recipient, amount);
        _chargeFeeFrom(msg.sender, recipient, fee);
        return true;
    }

    /**
     * @notice Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        uint256 fee = estimateFee(0);
        _approve(msg.sender, spender, amount);
        _chargeFeeFrom(msg.sender, address(this), fee);
        return true;
    }

    /**
     * @notice Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        uint256 fee = estimateFee(amount);
        require(_allowances[sender][msg.sender] >= amount+(fee), "VRC25: amount exeeds allowance");

        _allowances[sender][msg.sender] = _allowances[sender][msg.sender]-(amount)-(fee);
        _transfer(sender, recipient, amount);
        _chargeFeeFrom(sender, recipient, fee);
        return true;
    }

    // /**
    //  * @notice Remove `amount` tokens owned by caller from circulation.
    //  */
    // function burn(uint256 amount) external returns (bool) {
    //     uint256 fee = estimateFee(0);
    //     _burn(msg.sender, amount);
    //     _chargeFeeFrom(msg.sender, address(this), fee);
    //     return true;
    // }

    /**
     * @dev Accept the ownership transfer. This is to make sure that the contract is
     * transferred to a working address
     *
     * Can only be called by the newly transfered owner.
     */
    function acceptOwnership() external {
        if (msg.sender != _newOwner) revert OnlyNewOwnerCanAccept();
        address oldOwner = _owner;
        _owner = _newOwner;
        _newOwner = address(0);
        emit OwnershipTransferred(oldOwner, _owner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     *
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) external virtual onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        _newOwner = newOwner;
    }

    /**
     * @notice Set minimum fee for each transaction
     *
     * Can only be called by the current owner.
     */
    function setFee(uint256 fee) external virtual onlyOwner {
        _minFee = fee;
        emit FeeUpdated(fee);
    }

    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     */
    function supportsInterface(bytes4 interfaceId) public view override virtual returns (bool) {
        return interfaceId == type(IVRC25).interfaceId;
    }

    /**
     * @notice Calculate fee needed to transfer `amount` of tokens.
     */
    function _estimateFee(uint256 value) internal view virtual returns (uint256);

    /**
     * @dev Transfer token for a specified addresses
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param amount The amount to be transferred.
     */
    function _transfer(address from, address to, uint256 amount) internal {
        if (from == address(0)) revert ZeroAddress();
        if (to == address(0)) revert ZeroAddress();
        if (amount > _balances[from]) revert InsufficientBalance();
        
        _beforeTokenTransfer(from, to, amount);

        _balances[from] = _balances[from]-(amount);
        _balances[to] = _balances[to]+(amount);
        emit Transfer(from, to, amount);
        
        _afterTokenTransfer(from, to, amount);
    }

    /**
     * @dev Set allowance that spender can use from owner
     * @param owner_ The address that authroize the allowance
     * @param spender The address that can spend the allowance
     * @param amount The amount that can be allowed
     */
    function _approve(address owner_, address spender, uint256 amount) internal {
        require(owner_ != address(0), "VRC25: approve from the zero address");
        require(spender != address(0), "VRC25: approve to the zero address");

        _allowances[owner_][spender] = amount;
        emit Approval(owner_, spender, amount);
    }

    /**
     * @dev Internal function to charge fee for gas sponsor function. Won't charge fee if caller is smart-contract because they are not sponsored gas.
     * NOTICE: this function is only a helper to transfer fee from an address different that msg.sender. Other validation should be handled outside of this function if necessary.
     * @param sender The address that will pay the fee
     * @param recipient The address that is destination of token transfer. If not token transfer should be address of contract
     * @param amount The amount token as fee
     */
    function _chargeFeeFrom(address sender, address recipient, uint256 amount) internal {
        if (tx.origin!=msg.sender) {
            return;
        }
        if(amount > 0) {
            _transfer(sender, _owner, amount);
            emit Fee(sender, recipient, _owner, amount);
        }
    }
    /**
     * @dev Internal function that mints an amount of the token and assigns it to
     * an account. This encapsulates the modification of balances such that the
     * proper events are emitted.
     * @param to The account that will receive the created tokens.
     * @param amount The amount that will be created.
     */
    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "VRC25: mint to the zero address");
        _beforeTokenTransfer(address(0), to, amount);
        _totalSupply = _totalSupply+(amount);
        _balances[to] = _balances[to]+(amount);
        emit Transfer(address(0), to, amount);

        _afterTokenTransfer(address(0), to, amount);
    }

    /**
     * @dev Internal function that burns an amount of the token
     * This encapsulates the modification of balances such that the
     * proper events are emitted.
     * @param from The account that token amount will be deducted.
     * @param amount The amount that will be burned.
     */
    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "VRC25: burn from the zero address");
        require(amount <= _balances[from], "VRC25: insuffient balance");
        _beforeTokenTransfer(from, address(0), amount);

        _totalSupply = _totalSupply-(amount);
        _balances[from] = _balances[from]-(amount);
        emit Transfer(from, address(0), amount);

        _afterTokenTransfer(from, address(0), amount);
    }

        /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}