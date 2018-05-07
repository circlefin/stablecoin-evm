pragma solidity ^0.4.18;

/**
 * @title Upgrdable Contract
 * @dev Allows accounts to be upgraded by an "upgader" role
*/
contract Upgradable {

  address upgrader;
  bool isContractUpgraded = false;
  address upgradedAddress;
  event Upgraded(address newContractAddress);

  /**
   * @dev Throws if called by any account other than the upgrader
  */
  modifier onlyUpgrader() {
    require(msg.sender == upgrader);
    _;
  }

  /**
   * @dev Checks if contract has been upgraded
  */
  function isUpgraded() public view returns (bool) {
    return isContractUpgraded;
  }

  /**
   * @dev upgrades contract 
   * @param _contractAddress address The address of the new contract
  */
  function upgrade(address _contractAddress) onlyUpgrader public {
    isContractUpgraded = true;
    upgradedAddress = _contractAddress;
    Upgraded(upgradedAddress);
  }

}
