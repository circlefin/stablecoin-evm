pragma solidity ^0.4.18;

import './FiatMintableToken.sol';
import './RedeemableToken.sol';

/**
 * @title FiatToken 
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatToken is FiatMintableToken, RedeemableToken {
  
  string public name;
  string public symbol;
  string public currency;
  uint8 public decimals;
  uint256 public fee;
  uint256 public feeBase;
  address public feeAccount;

  event Fee(address indexed from, address indexed feeAccount, uint256 feeAmount);

  function FiatToken(string _name, string _symbol, string _currency, uint8 _decimals, uint256 _fee, uint256 _feeBase, address _feeAccount, address _minter, address _accountCertifier) public {
    name = _name;
    symbol = _symbol;
    currency = _currency;
    decimals = _decimals;
    fee = _fee;
    feeBase = _feeBase;
    feeAccount = _feeAccount;
    minter = _minter;
    accountCertifier = _accountCertifier;
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

  /* @dev Transfer tokens from one address to another. The allowed amount includes the transfer value and transfer fee.
   * Validates that the totalAmount <= the allowed amount for the sender on the from account.
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @return bool success
  */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_value);

    require(_value <= allowed[_from][msg.sender]);

    doTransfer(_from, _to, _value, feeAmount, totalAmount);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    return true;
  }

  /**
   * @dev transfer token for a specified address
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
   * @return bool success
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
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
    require(_totalAmount <= balances[_from]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[_from] = balances[_from].sub(_totalAmount);
    balances[_to] = balances[_to].add(_value);
    balances[feeAccount] = balances[feeAccount].add(_feeAmount);
    Fee(_from, feeAccount, _feeAmount);
    Transfer(_from, _to, _value);
  }

}
