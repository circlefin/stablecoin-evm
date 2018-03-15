pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/MintableToken.sol';

contract FiatToken is MintableToken {
  
  string public name;
  string public symbol;
  string public currency;
  uint8 public decimals;
  uint256 public fee;
  uint256 public feeBase;
  address public feeAccount;

  function FiatToken(string _name, string _symbol, string _currency, uint8 _decimals, uint256 _fee, uint256 _feeBase, address _feeAccount) public {
    name = _name;
    symbol = _symbol;
    currency = _currency;
    decimals = _decimals;
    fee = _fee;
    feeBase = _feeBase;
    feeAccount = _feeAccount;
  }

  /**
   * @dev Calculate the fee amount for a transfer
   * @param amount unit256 The amount of the transfer
  */
  function calculateTransferFee(uint256 amount) public view returns (uint256) {
    return amount.mul(fee).div(feeBase);
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
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
  */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = prepareTransferFees(_from, _to, _value);

    require(totalAmount <= allowed[_from][msg.sender]);

    doTransfer(_from, _to, _value, feeAmount, totalAmount);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(totalAmount);
    Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev transfer token for a specified address
   * @param _to The address to transfer to.
   * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = prepareTransferFees(msg.sender, _to, _value);

    doTransfer(msg.sender, _to, _value, feeAmount, totalAmount);
    Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev calculates fees for transfer and validates sender, recipient, amount
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
  */
  function prepareTransferFees(address _from, address _to, uint256 _value) internal view returns (uint256, uint256) {
    require(_to != address(0));

    uint256 feeAmount = calculateTransferFee(_value);
    uint256 totalAmount = _value.add(feeAmount);

    require(totalAmount <= balances[_from]);

    return (feeAmount, totalAmount);
  }

  /**
   * @dev updates balances for sender, recipient, feeAccount in a transfer
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @param _feeAmount uint256 the amount of tokens in transfer fees
   * @param _totalAmount uint256 the amount of tokens to be transfered added to the transfer fees
  */
  function doTransfer(address _from, address _to, uint256 _value, uint256 _feeAmount, uint256 _totalAmount) internal {
    // SafeMath.sub will throw if there is not enough balance.
    balances[_from] = balances[_from].sub(_totalAmount);
    balances[_to] = balances[_to].add(_value);
    balances[feeAccount] = balances[feeAccount].add(_feeAmount);
  }

}
