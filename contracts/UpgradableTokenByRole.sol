pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/StandardToken.sol';
import './UpgradedFiatToken.sol';

/**
 * @title Upgradable
 * @dev Creates "upgrader" role to upgrade a contract
 */
contract UpgradableTokenByRole is StandardToken {
  
  address public upgrader;
  bool public upgraded;
  address public upgradedAddress;
  address public deprecatedAddress;

  event Upgrade(address upgradedAddress);

  /**
   * @dev Throws if called by any account other than the upgrader
  */
  modifier onlyUpgrader() {
    require(msg.sender == upgrader);
    _;
  }

  /**
   * @dev Throws if contract already upgraded
  */
  modifier whenNotUpgraded() {
    require(upgraded != true);
    _;
  }

  /**
   * @dev Get account's local contract balance
   * @param _account address The address of the account
  */
  function balanceOfLocal(address _account) public view returns (uint256) {
    return balances[_account];
  }

  /**
   * @dev Get account's local allowed amount
   * @param _owner address The address of the account owner
   * @param _spender address The address of the account spender
  */
  function allowanceLocal(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }

  /**
   * @dev Upgrade contract
   * @param _upgradedAddress address The address of the upgraded contract
  */
  function upgrade(address _upgradedAddress) whenNotUpgraded onlyUpgrader public {
    upgraded = true;
    upgradedAddress = _upgradedAddress;
    Upgrade(upgradedAddress);
  }
}
