pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/MintableToken.sol';

contract FiatToken is MintableToken {
  
  string public name;
  string public symbol;
  string public currency;
  uint8 public decimals;

  function FiatToken(string _name, string _symbol, string _currency, uint8 _decimals) public {
    name = _name;
    symbol = _symbol;
    currency = _currency;
    decimals = _decimals;
  }

}
