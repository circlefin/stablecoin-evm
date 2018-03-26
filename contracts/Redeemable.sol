pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/StandardToken.sol';

/**
 * @title Upgradable
 * @dev Creates "redeemer" role to redeem tokens
 */
contract RedeemableToken is StandardToken {
  
  mapping (address => bool) internal certifiedDepositors;
  address depositCertifier;

  event Redeem(address indexed redeemedAddress, uint256 amount);
  event NewCertifiedDepositor(address indexed account);
  event RemovedCertifiedDepositor(address indexed account);

  /**
   * @dev Throws if called by any account other than the certifier
  */
  modifier onlyDepositCertifier() {
    require(msg.sender == depositCertifier);
    _;
  }

  /**
   * @dev Throws if called by any non-certified depositor
  */
  modifier onlyCertifiedDepositors() {
    require(certifiedDepositors[msg.sender] == true);
    _;
  }

  /**
   * @dev Adds certified depositor
   * @param newCertifiedDepositor The address to add
  */
  function addCertifiedDepositor(address newCertifiedDepositor) public onlyDepositCertifier {
    certifiedDepositors[newCertifiedDepositor] = true;
    NewCertifiedDepositor(newCertifiedDepositor);
  } 

  /**
   * @dev Removes certified depositor
   * @param certifiedDepositor The address to remove
  */
  function removeCertifiedDepositor(address certifiedDepositor) public onlyDepositCertifier {
    certifiedDepositors[certifiedDepositor] = false;
    RemovedCertifiedDepositor(certifiedDepositor);
  } 

  /**
   * @dev Redeems tokens from an account
   * @param amount uint256 The amount of tokens to redeem
  */
  function redeem(uint amount) public onlyCertifiedDepositors {
    require(balances[msg.sender] >= amount);

    totalSupply_ = totalSupply_.sub(amount);
    balances[msg.sender] = balances[msg.sender].sub(amount);
    Redeem(msg.sender, amount);
  }
}