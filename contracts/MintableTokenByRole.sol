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
   * @dev Function to mint tokens
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
  */
  function mint(address _to, uint256 _amount) public returns (bool) {
    uint256 mintingAllowedAmount = getMinterAllowed(msg.sender);
    require(_amount <= mintingAllowedAmount);

    setTotalSupply(getTotalSupply().add(_amount));
    setBalance(_to, getBalance(_to).add(_amount));
    setMinterAllowed(msg.sender, mintingAllowedAmount.sub(_amount));
    Mint(msg.sender, _to, _amount);
    return true; 
  }

  /**
   * @dev Function to get minter allowance
   * @param minter The address of the minter
  */
  function minterAllowance(address minter) public view returns (uint256) {
    return getMinterAllowed(minter);
  }

  /**
   * @dev Function update a minter allowance
   * @param minter The address of the minter
   * @param amount The allowed amount of the minter to update
   * @return True if the operation was successful.
  */
  function updateMinterAllowance(address minter, uint256 amount) onlyMasterMinter public returns (bool) {
    setMinterAllowed(minter, amount);
    MinterAllowanceUpdate(minter, amount);
    return true;
  }

}
