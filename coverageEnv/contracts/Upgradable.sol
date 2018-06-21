pragma solidity ^0.4.23;

import "./storage/EternalStorageUpdater.sol";

/**
 * @title Upgrdable Contract
 * @dev Allows accounts to be upgraded by an "upgader" role
*/
contract Upgradable is EternalStorageUpdater {event __CoverageUpgradable(string fileName, uint256 lineNumber);
event __FunctionCoverageUpgradable(string fileName, uint256 fnId);
event __StatementCoverageUpgradable(string fileName, uint256 statementId);
event __BranchCoverageUpgradable(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageUpgradable(string fileName, uint256 branchId);
event __AssertPostCoverageUpgradable(string fileName, uint256 branchId);


    address public upgrader;
    address public upgradedAddress;

    event Upgraded(address newContractAddress);
    event UpgraderChanged(address indexed newUpgrader);

    constructor(address _upgrader) public {emit __FunctionCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',1);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',18);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',1);
upgrader = _upgrader;
    }

    /**
     * @dev Throws if called by any account other than the upgrader
    */
    modifier onlyUpgrader() {emit __FunctionCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',2);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',25);
        emit __AssertPreCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',1);
emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',2);
require(msg.sender == upgrader);emit __AssertPostCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',1);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',26);
        _;
    }

    /**
     * @dev Checks if contract has been upgraded
    */
    function isUpgraded() public  returns (bool) {emit __FunctionCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',3);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',33);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',3);
return upgradedAddress != 0x0;
    }

    /**
     * @dev upgrades contract
     * @param _contractAddress address The address of the new contract
    */
    function upgrade(address _contractAddress) onlyUpgrader public {emit __FunctionCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',4);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',41);
        emit __AssertPreCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',2);
emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',4);
require(isUpgraded() == false);emit __AssertPostCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',2);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',42);
        emit __AssertPreCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',3);
emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',5);
require(_contractAddress != address(0));emit __AssertPostCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',3);


emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',44);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',6);
upgradedAddress = _contractAddress;
emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',45);
        contractStorage.transferOwnership(_contractAddress);
emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',46);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',7);
emit Upgraded(upgradedAddress);
    }

    /**
     * @dev updates the upgrader address
     * Validates that caller is the upgrader
     * @param _newAddress address The new upgrader address
    */
    function updateUpgraderAddress(address _newAddress) onlyUpgrader public {emit __FunctionCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',5);

emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',55);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',8);
upgrader = _newAddress;
emit __CoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',56);
        emit __StatementCoverageUpgradable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/Upgradable.sol',9);
emit UpgraderChanged(upgrader);
    }


}
