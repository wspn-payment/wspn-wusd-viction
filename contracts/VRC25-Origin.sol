//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "./interface/IVRC25.sol";
import "./interface/IVRCPermit.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";


contract VRC25 is IVRC25,IVRC25Permit,IERC165,EIP712 {

    mapping (address => uint256) private _balances;
    uint256 private _minFee;
    address private _owner;
    address private _newOwner;

    bytes32 private constant PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    mapping (address => mapping (address => uint256)) private _allowances;
    mapping(address => uint256) private _nonces;

    string private _name;
    string private _symbol;
    uint8 private _decimals;
    uint256 private _totalSupply;

    event FeeUpdated(uint256 fee);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(string memory name, string memory symbol, uint8 decimals_, string memory version) EIP712(name, version) {
        _name = name;
        _symbol = symbol;
        _decimals = decimals_;
        _owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msg.sender, "VRC25: caller is not the owner");
        _;
    }

    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _symbol;
    }
    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(
        address owner
    ) external view override returns (uint256) {
        return _balances[owner];
    }

    function issuer() external view override returns (address) {
        return _owner;
    }

    function allowance(
        address owner,
        address spender
    ) external view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function owner() public view returns (address){
        return _owner;
    }

    function minFee() public view returns (uint256){
        return _minFee;
    }

    
    function nonces(address owner) public view override returns (uint256) {
        return _nonces[owner];
    }


    /**
     * if tx.origin == msg.sender the caller must be the eoa
     * else tx.origin != msg.sender the caller should be contract
     * @param value the amount of token
     */
    function estimateFee(
        uint256 value
    ) public view override returns (uint256) {
        if (tx.origin != msg.sender){  
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
    function transfer(
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        uint256 fee = estimateFee(amount);
        _transfer(msg.sender, recipient, amount);
        _chargeFeeFrom(msg.sender, recipient, fee);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        uint256 fee = estimateFee(0);
        _approve(msg.sender, spender, amount);
        _chargeFeeFrom(msg.sender, address(this), fee);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        uint256 fee = estimateFee(amount);
        require(_allowances[sender][msg.sender] >= amount+fee, "VRC25: amount exeeds allowance");

        _allowances[sender][msg.sender] = _allowances[sender][msg.sender]-amount-fee;
        _transfer(sender, recipient, amount);
        _chargeFeeFrom(sender, recipient, fee);
        return true;
    }

    /**
     * @notice Issues `amount` tokens to the designated `address`.
     *
     * Can only be called by the current owner.
     */
    function mint(address recipient, uint256 amount) external onlyOwner returns (bool) {
        _mint(recipient, amount);
        return true;
    }

    function burn(uint256 amount) external returns (bool) {
        uint256 fee = estimateFee(0);
        _burn(msg.sender, amount);
        _chargeFeeFrom(msg.sender, address(this), fee);
        return true;
    }

    /**
     * @dev Accept the ownership transfer. This is to make sure that the contract is
     * transferred to a working address
     *
     * Can only be called by the newly transfered owner.
     */
    function acceptOwnership() external {
        require(msg.sender == _newOwner, "VRC25: only new owner can accept ownership");
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
        require(newOwner != address(0), "VRC25: new owner is the zero address");
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
     * 
     * @param owner /**
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
    ) external override {
        require(block.timestamp <= deadline, "VRC25: Permit expired");

        bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, _useNonce(owner), deadline));
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "VRC25: Invalid permit");

        uint256 fee = estimateFee(0);
        _approve(owner, spender, value);
        _chargeFeeFrom(owner, address(this), fee);
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

    function _estimateFee(uint256 value) private view returns (uint256){
        return value + minFee();
    }
    /**
     * @dev Transfer token for a specified addresses
     * @param from The address to transfer from.
     * @param to The address to transfer to.
     * @param amount The amount to be transferred.
     */
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "VRC25: transfer from the zero address");
        require(to != address(0), "VRC25: transfer to the zero address");
        require(amount <= _balances[from], "VRC25: insuffient balance");
        _balances[from] = _balances[from]-amount;
        _balances[to] = _balances[to]+amount;
        emit Transfer(from, to, amount);
    }

    /**
     * @dev Set allowance that spender can use from owner
     * @param owner The address that authroize the allowance
     * @param spender The address that can spend the allowance
     * @param amount The amount that can be allowed
     */
    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "VRC25: approve from the zero address");
        require(spender != address(0), "VRC25: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Internal function to charge fee for gas sponsor function. Won't charge fee if caller is smart-contract because they are not sponsored gas.
     * NOTICE: this function is only a helper to transfer fee from an address different that msg.sender. Other validation should be handled outside of this function if necessary.
     * @param sender The address that will pay the fee
     * @param recipient The address that is destination of token transfer. If not token transfer should be address of contract
     * @param amount The amount token as fee
     */
    function _chargeFeeFrom(address sender, address recipient, uint256 amount) internal {
        if (tx.origin != msg.sender) {
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
        _totalSupply = _totalSupply+amount;
        _balances[to] = _balances[to]+amount;
        emit Transfer(address(0), to, amount);
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
        _totalSupply = _totalSupply-amount;
        _balances[from] = _balances[from]-amount;
        emit Transfer(from, address(0), amount);
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
