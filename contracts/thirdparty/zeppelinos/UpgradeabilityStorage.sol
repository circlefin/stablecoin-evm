pragma solidity ^0.4.18;

/**
 * @title UpgradeabilityStorage
 * @dev This contract holds all the necessary state variables to support the upgrade functionality
 */
contract UpgradeabilityStorage {
  // Version name of the current implementation
  string internal _version;

  // Address of the current implementation
  address internal _implementation;

  /**
  * @dev Tells the version name of the current implementation
  * @return string representing the name of the current version
  */
  function version() public view returns (string) {
    return _version;
  }

  /**
  * @dev Tells the address of the current implementation
  * @return address of the current implementation
  */
  function implementation() public view returns (address) {
    return _implementation;
  }
}
