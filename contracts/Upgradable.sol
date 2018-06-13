pragma solidity ^0.4.23;

import "./storage/EternalStorageUpdater.sol";

/**
 * @title Upgrdable Contract
 * @dev Allows accounts to be upgraded by an "upgader" role
*/
contract Upgradable is EternalStorageUpdater {

    address public upgrader;
    address public upgradedAddress;

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
        return upgradedAddress != 0x0;
    }

    /**
     * @dev upgrades contract
     * @param _contractAddress address The address of the new contract
    */
    function upgrade(address _contractAddress) onlyUpgrader public {
        require(isUpgraded() == false);
        require(_contractAddress != address(0));

        upgradedAddress = _contractAddress;
        contractStorage.transferOwnership(_contractAddress);
        emit Upgraded(upgradedAddress);
    }

}
