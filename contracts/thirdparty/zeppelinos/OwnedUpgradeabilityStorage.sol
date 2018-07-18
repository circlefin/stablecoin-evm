pragma solidity ^0.4.18;

import "./UpgradeabilityStorage.sol";

/**
 * @title OwnedUpgradeabilityStorage
 * @dev This contract keeps track of the upgradeability owner
 */
contract OwnedUpgradeabilityStorage is UpgradeabilityStorage {
  // Owner of the contract
  address private _upgradeabilityOwner;

  /**
   * @dev Tells the address of the owner
   * @return the address of the owner
   */
  function upgradeabilityOwner() public view returns (address) {
    return _upgradeabilityOwner;
  }

  /**
   * @dev Sets the address of the owner
   */
  function setUpgradeabilityOwner(address newUpgradeabilityOwner) internal {
    _upgradeabilityOwner = newUpgradeabilityOwner;
  }
}
