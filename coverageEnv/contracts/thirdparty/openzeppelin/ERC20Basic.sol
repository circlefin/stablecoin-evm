pragma solidity ^0.4.23;


/**
 * @title ERC20Basic
 * (openzeppelin tag: v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3 modifications: none)
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 */
contract ERC20Basic {event __CoverageERC20Basic(string fileName, uint256 lineNumber);
event __FunctionCoverageERC20Basic(string fileName, uint256 fnId);
event __StatementCoverageERC20Basic(string fileName, uint256 statementId);
event __BranchCoverageERC20Basic(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageERC20Basic(string fileName, uint256 branchId);
event __AssertPostCoverageERC20Basic(string fileName, uint256 branchId);

  function totalSupply() public  returns (uint256);
  function balanceOf(address who) public  returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  event Transfer(address indexed from, address indexed to, uint256 value);
}
