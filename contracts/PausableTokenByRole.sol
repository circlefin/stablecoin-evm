pragma solidity ^0.4.18;

import './thirdparty/openzeppelin/Ownable.sol';
/**
 * @title Pausable fiat token
 * @dev Pausable Token with special "pauser" role
 **/
contract PausableTokenByRole is Ownable {

    address public pauser;
    bool public paused = false;

    event Pause();
    event Unpause();
    event PauserChanged(address indexed newAddress);


    constructor(address _pauser) public {
        pauser = _pauser;
    }
    /**
     * @dev throws if called by any account other than the pauser
    */
    modifier onlyPauser() {
        require(msg.sender == pauser);
        _;
    }

    /**
     * @dev called by the pauser to pause, triggers stopped state
    */
    function pause() onlyPauser public {
        paused = true;
        emit Pause();
    }

    /**
     * @dev called by the pauser to unpause, returns to normal state
    */
    function unpause() onlyPauser public {
        paused = false;
        emit Unpause();
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
    */
    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
    */
    modifier whenPaused() {
        require(paused);
        _;
    }

    function updatePauser(address _newPauser) onlyOwner public {
        pauser = _newPauser;
        emit PauserChanged(pauser);
    }
}












