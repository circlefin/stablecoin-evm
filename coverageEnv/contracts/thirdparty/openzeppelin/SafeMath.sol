pragma solidity ^0.4.23;


/**
 * @title SafeMath
 * openzeppelin tag: v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3 
 * modifications: 
 * 1) Deleted mul function
 * 2) Deleted div function
 * date of modification: 6/18/18
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {event __CoverageSafeMath(string fileName, uint256 lineNumber);
event __FunctionCoverageSafeMath(string fileName, uint256 fnId);
event __StatementCoverageSafeMath(string fileName, uint256 statementId);
event __BranchCoverageSafeMath(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageSafeMath(string fileName, uint256 branchId);
event __AssertPostCoverageSafeMath(string fileName, uint256 branchId);


  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal  returns (uint256) {emit __FunctionCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',1);

emit __CoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',19);
    emit __AssertPreCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',1);
emit __StatementCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',1);
assert(b <= a);emit __AssertPostCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',1);

emit __CoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',20);
    emit __StatementCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',2);
return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal  returns (uint256 c) {emit __FunctionCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',2);

emit __CoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',27);
    emit __StatementCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',3);
c = a + b;
emit __CoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',28);
    emit __AssertPreCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',2);
emit __StatementCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',4);
assert(c >= a);emit __AssertPostCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',2);

emit __CoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',29);
    emit __StatementCoverageSafeMath('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/SafeMath.sol',5);
return c;
  }
}
