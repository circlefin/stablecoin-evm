pragma solidity ^0.4.23;


import "../../thirdparty/openzeppelin/SafeMath.sol";


contract SafeMathMock {

  function sub(uint256 a, uint256 b) public pure returns (uint256) {
    return SafeMath.sub(a, b);
  }

  function add(uint256 a, uint256 b) public pure returns (uint256) {
    return SafeMath.add(a, b);
  }
}