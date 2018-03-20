pragma solidity ^0.4.18;

/**
 * @title Upgradable
 * @dev Creates "upgrader" role to upgrade a contract
 */
contract Upgradable {
  
  address public upgrader;
  bool public upgraded;
  address public upgradedAddress;

  event Upgrade(address upgradedAddress);

  /**
   * @dev Throws if called by any account other than the upgrader
  */
  modifier onlyUpgrader() {
    require(msg.sender == upgrader);
    _;
  }

  /**
   * @dev Upgrade contract
   * @param _upgradedAddress address The address of the upgraded contract
  */
  function upgrade(address _upgradedAddress) onlyUpgrader public {
    upgraded = true;
    upgradedAddress = _upgradedAddress;
    Upgrade(upgradedAddress);
  }

}
