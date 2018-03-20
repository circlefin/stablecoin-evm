pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/PausableToken.sol';

/**
 * @title Pausable fiat token
 * @dev Pausable Token with special "pauser" role
 **/
contract PausableTokenByRole is PausableToken {

  address public pauser;

  modifier onlyPauser() {
      require(msg.sender == pauser);
      _;
  }

  /**
   * @dev called by the pauser to pause, triggers stopped state
   */
  function pause() onlyPauser whenNotPaused public {
    paused = true;
    Pause();
  }

  /**
   * @dev called by the pauser to unpause, returns to normal state
   */
  function unpause() onlyPauser whenPaused public {
    paused = false;
    Unpause();
  }

}












