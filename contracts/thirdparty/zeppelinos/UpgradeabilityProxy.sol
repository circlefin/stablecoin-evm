pragma solidity ^0.4.18;

import './Proxy.sol';
import './UpgradeabilityStorage.sol';

/**
 * @title UpgradeabilityProxy
 * @dev This contract represents a proxy where the implementation address to which it will delegate can be upgraded
 * Based on https://github.com/zeppelinos/labs/blob/master/upgradeability_ownership/contracts/ownership/Ownable.sol
 * branch: master commit: 3887ab77b8adafba4a26ace002f3a684c1a3388b
 * Modifications:
 * 1) Added emit before Upgraded event (7/16/2018)
 */
contract UpgradeabilityProxy is Proxy, UpgradeabilityStorage {
  /**
  * @dev This event will be emitted every time the implementation gets upgraded
  * @param version representing the version name of the upgraded implementation
  * @param implementation representing the address of the upgraded implementation
  */
  event Upgraded(string version, address indexed implementation);

  /**
  * @dev Upgrades the implementation address
  * @param version representing the version name of the new implementation to be set
  * @param implementation representing the address of the new implementation to be set
  */
  function _upgradeTo(string version, address implementation) internal {
    require(_implementation != implementation);
    _version = version;
    _implementation = implementation;
    emit Upgraded(version, implementation);
  }
}
