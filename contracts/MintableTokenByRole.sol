pragma solidity ^0.4.18;

import './EternalStorageUpdater.sol';

/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with special "minter" role overriding the owner role
 */
contract MintableTokenByRole is EternalStorageUpdater {
  
  address public minter;
  address public reserver;
  address public minterCertifier;

  event Mint(address indexed to, uint256 amount);
  event MintFinished();
  event MinterUpdate(address newMinter);

  bool public mintingFinished = false;

  /**
   * @dev Throws if minting finished
  */
  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  /**
   * @dev Throws if called by any account other than the minterCertifier
  */
  modifier onlyMinterCertifier() {
    require(msg.sender == minterCertifier);
    _;
  }

  /**
   * @dev Throws if called by any account other than the minter
  */
  modifier onlyMinter() {
    require(msg.sender == minter);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
  */
  function mint(uint256 _amount) onlyMinter canMint public returns (bool) {
    setTotalSupply(getTotalSupply().add(_amount));
    setBalance(reserver, getBalance(reserver).add(_amount));
    Mint(reserver, _amount);
    return true; 
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
  */
  function finishMinting() onlyMinter canMint public returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }

  /**
   * @dev Function to update the "minter" role
   * @param newMinter The address of the new minter
   * @return True if the operation was successful.
  */
  function updateMinter(address newMinter) onlyMinterCertifier public returns (bool) {
    minter = newMinter;
    MinterUpdate(newMinter);
    return true;
  }

}
