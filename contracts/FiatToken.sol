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
    require(_to != address(0));

    uint256 feeAmount = calculateTransferFee(_value);
    uint256 totalAmount = _value.add(feeAmount);

    require(totalAmount <= balances[_from]);
    require(totalAmount <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(totalAmount);
    balances[_to] = balances[_to].add(_value);
    balances[feeAccount] = balances[feeAccount].add(feeAmount);
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
    require(_to != address(0));

    uint256 feeAmount = calculateTransferFee(_value);
    uint256 totalAmount = _value.add(feeAmount);

    require(totalAmount <= balances[msg.sender]);

    // SafeMath.sub will throw if there is not enough balance.
    balances[msg.sender] = balances[msg.sender].sub(totalAmount);
    balances[_to] = balances[_to].add(_value);
    balances[feeAccount] = balances[feeAccount].add(feeAmount);
    Transfer(msg.sender, _to, _value);
    return true;
  }

}
