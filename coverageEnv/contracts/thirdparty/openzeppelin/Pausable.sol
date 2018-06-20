pragma solidity ^0.4.23;


import "./Ownable.sol";


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 * Based on openzeppelin tag v1.10.0 commit: feb665136c0dae9912e08397c1a21c4af3651ef3
 * Modifications:
 * 1) Added pauser role, switched pause/unpause to be onlyPauser (6/14/2018)
 * 2) Removed whenNotPause/whenPaused from pause/unpause (6/14/2018)
 * 3) Removed whenPaused (6/14/2018)
 */
contract Pausable is Ownable {event __CoveragePausable(string fileName, uint256 lineNumber);
event __FunctionCoveragePausable(string fileName, uint256 fnId);
event __StatementCoveragePausable(string fileName, uint256 statementId);
event __BranchCoveragePausable(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoveragePausable(string fileName, uint256 branchId);
event __AssertPostCoveragePausable(string fileName, uint256 branchId);

  event Pause();
  event Unpause();
  event PauserChanged(address indexed newAddress);


  address public pauser;
  bool public paused = false;


  constructor(address _pauser) public {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',1);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',27);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',1);
pauser = _pauser;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',2);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',34);
    emit __AssertPreCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',1);
emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',2);
require(!paused);emit __AssertPostCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',1);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',35);
    _;
  }

  /**
   * @dev throws if called by any account other than the pauser
   */
  modifier onlyPauser() {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',3);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',42);
    emit __AssertPreCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',2);
emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',3);
require(msg.sender == pauser);emit __AssertPostCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',2);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',43);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyPauser public {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',4);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',50);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',4);
paused = true;
emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',51);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',5);
emit Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyPauser public {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',5);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',58);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',6);
paused = false;
emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',59);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',7);
emit Unpause();
  }

  /**
   * @dev update the pauser role
   */
  function updatePauser(address _newPauser) onlyOwner public {emit __FunctionCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',6);

emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',66);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',8);
pauser = _newPauser;
emit __CoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',67);
    emit __StatementCoveragePausable('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/thirdparty/openzeppelin/Pausable.sol',9);
emit PauserChanged(pauser);
  }

}
