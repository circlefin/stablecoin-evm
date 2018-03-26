pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/StandardToken.sol';

/**
 * @title Redeemable Token
 * @dev Allows tokens to be redeemed by "redeemers" and "redeemers" list to be updated by accountCertifier
*/
contract RedeemableToken is StandardToken {
  
  mapping (address => bool) internal redeemers;
  address accountCertifier;

  event Redeem(address indexed redeemedAddress, uint256 amount);
  event NewRedeemer(address indexed account);
  event RemovedRedeemer(address indexed account);

  /**
   * @dev Throws if called by any account other than the account certifier
  */
  modifier onlyAccountCertifier() {
    require(msg.sender == accountCertifier);
    _;
  }

  /**
   * @dev Throws if called by any non-redeemer
  */
  modifier onlyRedeemers() {
    require(redeemers[msg.sender] == true);
    _;
  }

  /**
   * @dev Adds redeemer
   * @param newRedeemer The address to add
  */
  function addRedeemer(address newRedeemer) public onlyAccountCertifier {
    redeemers[newRedeemer] = true;
    NewRedeemer(newRedeemer);
  } 

  /**
   * @dev Removes redeemer
   * @param redeemer The address to remove
  */
  function removeRedeemer(address redeemer) public onlyAccountCertifier {
    redeemers[redeemer] = false;
    RemovedRedeemer(redeemer);
  } 

  /**
   * @dev Redeems tokens from an account
   * @param amount uint256 The amount of tokens to redeem
  */
  function redeem(uint amount) public onlyRedeemers {
    require(balances[msg.sender] >= amount);

    totalSupply_ = totalSupply_.sub(amount);
    balances[msg.sender] = balances[msg.sender].sub(amount);
    Redeem(msg.sender, amount);
  }
}