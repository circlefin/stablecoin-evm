pragma solidity ^0.4.23;

import "./ERC20Basic.sol";


/**
 * @title ERC20 interface 
 * (openzeppelin tag: v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3 modifications: none)
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  function allowance(address owner, address spender)
    public view returns (uint256);

  function transferFrom(address from, address to, uint256 value)
    public returns (bool);

  function approve(address spender, uint256 value) public returns (bool);
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );
}
