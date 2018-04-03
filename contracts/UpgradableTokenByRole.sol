pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/ERC20.sol';
import './UpgradedFiatToken.sol';

/**
 * @title Upgradable
 * @dev Creates "upgrader" role to upgrade a contract
 */
contract UpgradableTokenByRole is ERC20 {
  
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
   * @dev Upgrade contract
   * @param _upgradedAddress address The address of the upgraded contract
  */
  function upgrade(address _upgradedAddress) whenNotUpgraded onlyUpgrader public {
    upgraded = true;
    upgradedAddress = _upgradedAddress;
    Upgrade(upgradedAddress);
  }
}
