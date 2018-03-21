pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/StandardToken.sol';

/**
 * @title Upgradable
 * @dev Creates "redeemer" role to redeem tokens
 */
contract RedeemableToken is StandardToken {
  
  address public redeemer;

  event Redeem(address indexed redeemedAddress, uint256 amount);

  /**
   * @dev Throws if called by any account other than the redeemer
  */
  modifier onlyRedeemer() {
    require(msg.sender == redeemer);
    _;
  }

  /**
   * @dev Redeems tokens from an account
   * @param redeemAddress address The address to redeem tokens from
   * @param amount uint256 The amount of tokens to redeem
  */
  function redeem(address redeemAddress, uint amount) public onlyRedeemer {
    require(balances[redeemAddress] >= amount);

    totalSupply_ = totalSupply_.sub(amount);
    balances[redeemAddress] = balances[redeemAddress].sub(amount);
    Redeem(redeemAddress, amount);
  }
}