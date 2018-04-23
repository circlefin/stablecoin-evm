pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/ERC20.sol';
import './../lib/openzeppelin/contracts/ownership/Ownable.sol';
import './../lib/openzeppelin/contracts/math/SafeMath.sol';

import './MintableTokenByRole.sol';
import './PausableTokenByRole.sol';
import './RedeemableToken.sol';
import './BlacklistableTokenByRole.sol';
import './EternalStorageUpdater.sol';

/**
 * @title FiatToken 
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatToken is ERC20, MintableTokenByRole, PausableTokenByRole, RedeemableToken, BlacklistableTokenByRole, Ownable {
  using SafeMath for uint256;

  string public name;
  string public symbol;
  string public currency;
  uint8 public decimals;
  uint256 public fee;
  uint256 public feeBase;
  address public feeAccount;

  event Fee(address indexed from, address indexed feeAccount, uint256 feeAmount);

  function FiatToken(address _storageContractAddress, string _name, string _symbol, string _currency, uint8 _decimals, uint256 _fee, uint256 _feeBase, address _feeAccount, address _minter, address _pauser, address _accountCertifier, address _blacklister, address _reserver, address _minterCertifier) public {

    name = _name;
    symbol = _symbol;
    currency = _currency;
    decimals = _decimals;
    fee = _fee;
    feeBase = _feeBase;
    feeAccount = _feeAccount;
    minter = _minter;
    pauser = _pauser;
    accountCertifier = _accountCertifier;
    reserver = _reserver;
    blacklister = _blacklister;
    minterCertifier = _minterCertifier;

    contractStorage = EternalStorage(_storageContractAddress);
  }

  /**
   * @dev Update transfer fee
   * @param _fee uint256 The numerator of fee fraction
   * @param _feeBase uint256 The denominator of fee fraction
  */
  function updateTransferFee(uint256 _fee, uint256 _feeBase) public onlyOwner {
    fee = _fee;
    feeBase = _feeBase;
  }

  /**
   * @dev Adds pausable condition to mint.
   * @return True if the operatfion was successful.
  */
  function mint(uint256 _amount) whenNotPaused public returns (bool) {
    return super.mint(_amount);
  }

  /**
   * @dev Adds pausable condition to finishMinting.
   * @return True if the operation was successful.
  */
  function finishMinting() whenNotPaused public returns (bool) {
    return super.finishMinting();
  }

  /**
   * @dev Get allowed amount for an account
   * @param owner address The account owner
   * @param spender address The account spender
  */
  function allowance(address owner, address spender) public view returns (uint256) {
    return getAllowed(owner, spender);
  }

  /**
   * @dev Get totalSupply of token
  */
  function totalSupply() public view returns (uint256) {
    return getTotalSupply();
  }

  /**
   * @dev Get token balance of an account
   * @param account address The account
  */
  function balanceOf(address account) public view returns (uint256) {
    return getBalance(account);
  }

  /**
   * @dev Adds blacklisted check to approve
   * @return True if the operation was successful.
  */
  function approve(address _spender, uint256 _value) whenNotPaused notBlacklisted public returns (bool) {
    require(isBlacklisted(_spender) == false);
    setAllowed(msg.sender, _spender, _value);
    Approval(msg.sender, _spender, _value);
  }

  /**
   * @dev Transfer tokens from one address to another. The allowed amount includes the transfer value and transfer fee.
   * Validates that the totalAmount <= the allowed amount for the sender on the from account.
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @return bool success
  */
  function transferFrom(address _from, address _to, uint256 _value) whenNotPaused notBlacklisted public returns (bool) {
    require(isBlacklisted(_from) == false);
    require(isBlacklisted(_to) == false);

    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_value);

    uint256 allowed;
    allowed = getAllowed(_from, msg.sender);

    require(_value <= allowed);

    doTransfer(_from, _to, _value, feeAmount, totalAmount);
    setAllowed(_from, msg.sender, allowed.sub(_value));
    return true;
  }

  /**
   * @dev transfer token for a specified address
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
   * @return bool success
  */
  function transfer(address _to, uint256 _value) whenNotPaused notBlacklisted public returns (bool) {
    require(isBlacklisted(_to) == false);

    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_value);

    doTransfer(msg.sender, _to, _value, feeAmount, totalAmount);
    return true;
  }

  /**
   * @dev calculates fees for transfer and validates sender, recipient, amount.
   * @param _value uint256 the amount of tokens to be transferred
   * @return (uint256 feeAmount, uint256 totalAmount)
  */
  function getTransferFee(uint256 _value) internal view returns (uint256, uint256) {
    uint256 feeAmount = _value.mul(fee).div(feeBase);
    uint256 totalAmount = _value.add(feeAmount);

    return (feeAmount, totalAmount);
  }

  /**
   * @dev updates balances for sender, recipient, feeAccount in a transfer
   * Validates that _to address exists, totalAmount <= balance of the from account.
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @param _feeAmount uint256 the amount of tokens in transfer fees
   * @param _totalAmount uint256 the amount of tokens to be transfered added to the transfer fees
  */
  function doTransfer(address _from, address _to, uint256 _value, uint256 _feeAmount, uint256 _totalAmount) internal {
    require(_to != address(0));
    uint256 balance = getBalance(_from);

    require(_totalAmount <= balance);

    // SafeMath.sub will throw if there is not enough balance.
    setBalance(_from, balance.sub(_totalAmount));
    setBalance(_to, getBalance(_to).add(_value));
    setBalance(feeAccount, getBalance(feeAccount).add(_feeAmount));
    Fee(_from, feeAccount, _feeAmount);
    Transfer(_from, _to, _value);
  }

}
