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

  event Fee(address from, address feeAccount, uint256 feeAmount);

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
   * @dev Update transfer fee
   * @param _fee uint256 The numerator of fee fraction
   * @param _feeBase uint256 The denominator of fee fraction
  */
  function updateTransferFee(uint256 _fee, uint256 _feeBase) public onlyOwner {
    fee = _fee;
    feeBase = _feeBase;
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens with fees on behalf of msg.sender.
   *
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approveWithFee(address _spender, uint256 _value) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_value);
    return approve(_spender, totalAmount);
  }

  /**
   * @dev Increase the amount of tokens with fees that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
  function increaseApprovalWithFee(address _spender, uint _addedValue) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_addedValue);
    return increaseApproval(_spender, totalAmount);
  }

  /**
   * @dev Decrease the amount of tokens with fees that an owner allowed to a spender.
   *
   * approve should be called when allowed[_spender] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
  function decreaseApprovalWithFee(address _spender, uint _subtractedValue) public returns (bool) {
    uint256 feeAmount;
    uint256 totalAmount; 
    (feeAmount, totalAmount) = getTransferFee(_subtractedValue);
    return decreaseApproval(_spender, totalAmount);
  }

  /**
   * @dev Transfer tokens from one address to another. The allowed amount includes the transfer value and transfer fee.
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

    require(totalAmount <= allowed[_from][msg.sender]);

    doTransfer(_from, _to, _value, feeAmount, totalAmount);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(totalAmount);
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
