pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/MintableToken.sol';

/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with special "minter" role overriding the owner role
 */
contract FiatMintableToken is MintableToken {
  
  address public minter;

  /**
   * @dev Throws if called by any account other than the minter
  */
  modifier onlyMinter() {
    require(msg.sender == minter);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
  */
  function mint(address _to, uint256 _amount) onlyMinter canMint public returns (bool) {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    Mint(_to, _amount);
    Transfer(address(0), _to, _amount);
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

}
