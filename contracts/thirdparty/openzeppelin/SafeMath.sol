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
library SafeMath {

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}
