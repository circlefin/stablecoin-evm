pragma solidity ^0.4.23;

import "./ERC20Basic.sol";


/**
 * @title ERC20 interface 
 * (openzeppelin tag: v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3 modifications: none)
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {event __CoverageERC20(string fileName, uint256 lineNumber);
event __FunctionCoverageERC20(string fileName, uint256 fnId);
event __StatementCoverageERC20(string fileName, uint256 statementId);
event __BranchCoverageERC20(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageERC20(string fileName, uint256 branchId);
event __AssertPostCoverageERC20(string fileName, uint256 branchId);

  function allowance(address owner, address spender)
    public  returns (uint256);

  function transferFrom(address from, address to, uint256 value)
    public returns (bool);

  function approve(address spender, uint256 value) public returns (bool);
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
}
