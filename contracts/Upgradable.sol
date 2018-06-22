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
    event UpgraderChanged(address indexed newUpgrader);

    constructor(address _upgrader) public {
        upgrader = _upgrader;
    }

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

    /**
     * @dev updates the upgrader address
     * Validates that caller is the upgrader and that the _newAddress is not null
     * @param _newAddress address The new upgrader address
    */
    function updateUpgraderAddress(address _newAddress) onlyUpgrader public {
        require(_newAddress != address(0));
        upgrader = _newAddress;
        emit UpgraderChanged(upgrader);
    }


}
