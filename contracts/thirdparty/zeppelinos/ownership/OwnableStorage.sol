pragma solidity ^0.4.18;

/**
 * @title OwnableStorage
 * @dev This contract keeps track of the owner's address
 */
contract OwnableStorage {
  // Owner of the contract
  address private _owner;

  /**
   * @dev Tells the address of the owner
   * @return the address of the owner
   */
  function owner() public view returns (address) {
    return _owner;
  }

  /**
   * @dev Sets a new owner address
   */
  function setOwner(address newOwner) internal {
    _owner = newOwner;
  }
}
