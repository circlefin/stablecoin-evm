pragma solidity ^0.4.18;

import './UpgradableTokenByRole.sol';
import './UpgradedFiatToken.sol';
import './../lib/openzeppelin/contracts/math/SafeMath.sol';

contract LazilyUpgradedToken is UpgradableTokenByRole {
  using SafeMath for uint256;

  struct balanceInfo {
    uint256 balance;
    bool isValid;
  }

  struct allowedInfo {
    uint256 allowed;
    bool isValid;
  }

  mapping(address => balanceInfo) balances;
  mapping (address => mapping (address => allowedInfo)) allowed;

  function isBalanceValid(address account) public view returns (bool);
  function isAllowanceValid(address owner, address spender) public view returns (bool);

  function setBalance(address account, uint256 amount) internal returns (bool);
  function setAllowed(address owner, address spender, uint256 amount) internal returns (bool);
  function balanceOfWithUpgrades(address account) public view returns (uint256);
  function allowanceWithUpgrades(address owner, address spender) public view returns (uint256);

  function balanceOfLocal(address account) public view returns (uint256);
  function allowanceLocal(address owner, address spender) public view returns (uint256);

}
