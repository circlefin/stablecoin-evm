pragma solidity ^0.4.23;


/**
 * @title Ownable
 * @dev The Ownable contract from openzeppelin tag: v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3 modified to:
 * 1) Remove renounceOwnership function
 * 2) Remove OwnershipRenounced event
 * Date of modification: 6/13/18
 */
contract Ownable {event __CoverageOwnable(string fileName, uint256 lineNumber);
event __FunctionCoverageOwnable(string fileName, uint256 fnId);
event __StatementCoverageOwnable(string fileName, uint256 statementId);
event __BranchCoverageOwnable(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageOwnable(string fileName, uint256 branchId);
event __AssertPostCoverageOwnable(string fileName, uint256 branchId);

    address public owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );


    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
    */
    constructor() public {emit __FunctionCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',1);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',25);
        emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',1);
owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
    */
    modifier onlyOwner() {emit __FunctionCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',2);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',32);
        emit __AssertPreCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',1);
emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',2);
require(msg.sender == owner);emit __AssertPostCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',1);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',33);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
    */
    function transferOwnership(address _newOwner) public onlyOwner {emit __FunctionCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',3);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',41);
        emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',3);
_transferOwnership(_newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
    */
    function _transferOwnership(address _newOwner) internal {emit __FunctionCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',4);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',49);
        emit __AssertPreCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',2);
emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',4);
require(_newOwner != address(0));emit __AssertPostCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',2);

emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',50);
        emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',5);
emit OwnershipTransferred(owner, _newOwner);
emit __CoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',51);
        emit __StatementCoverageOwnable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Ownable.sol',6);
owner = _newOwner;
    }
}