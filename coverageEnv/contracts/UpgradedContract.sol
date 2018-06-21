pragma solidity ^0.4.23;

import './thirdparty/openzeppelin/ERC20.sol';

/**
 * @title Upgraded Contract
 * @dev ERC20 interface
*/
contract UpgradedContract is ERC20 {event __CoverageUpgradedContract(string fileName, uint256 lineNumber);
event __FunctionCoverageUpgradedContract(string fileName, uint256 fnId);
event __StatementCoverageUpgradedContract(string fileName, uint256 statementId);
event __BranchCoverageUpgradedContract(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageUpgradedContract(string fileName, uint256 branchId);
event __AssertPostCoverageUpgradedContract(string fileName, uint256 branchId);


    function approveViaPriorContract(address _from, address _spender, uint256 _value) public returns (bool);

    function transferViaPriorContract(address _from, address _to, uint256 _value) public returns (bool);

    function transferFromViaPriorContract(address _sender, address _from, address _to, uint256 _value) public returns (bool);

}
