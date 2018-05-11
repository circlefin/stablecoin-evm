pragma solidity ^0.4.18;

import './EternalStorageUpdater.sol';

/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with special "minter" role overriding the owner role
 */
contract MintableTokenByRole is EternalStorageUpdater {
  
  address public masterMinter;

  event Mint(address indexed minter, address indexed to, uint256 amount);
  event MinterAllowanceUpdate(address minter, uint256 amount);  

  /**
   * @dev Throws if called by any account other than the masterMinter
  */
  modifier onlyMasterMinter() {
    require(msg.sender == masterMinter);
    _;
  }

  /**
   * @dev Function to get minter allowance
   * @param minter The address of the minter
  */
  function minterAllowance(address minter) public view returns (uint256) {
    return getMinterAllowed(minter);
  }

}
