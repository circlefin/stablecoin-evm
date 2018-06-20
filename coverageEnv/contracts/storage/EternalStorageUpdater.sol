pragma solidity ^0.4.23;

import './../thirdparty/openzeppelin/SafeMath.sol';

import './EternalStorage.sol';

contract EternalStorageUpdater {event __CoverageEternalStorageUpdater(string fileName, uint256 lineNumber);
event __FunctionCoverageEternalStorageUpdater(string fileName, uint256 fnId);
event __StatementCoverageEternalStorageUpdater(string fileName, uint256 statementId);
event __BranchCoverageEternalStorageUpdater(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageEternalStorageUpdater(string fileName, uint256 branchId);
event __AssertPostCoverageEternalStorageUpdater(string fileName, uint256 branchId);

    using SafeMath for uint256;

    EternalStorage internal contractStorage;

    constructor(address _contractStorage) public {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',1);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',13);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',1);
if (_contractStorage != address(0x0)) {emit __BranchCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',1,0);
emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',14);
            emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',2);
contractStorage = EternalStorage(_contractStorage);
        } else {emit __BranchCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',1,1);
emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',16);
            emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',3);
contractStorage = new EternalStorage();
        }
    }

    function getAllowed(address _from, address _spender) internal  returns (uint256) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',2);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',21);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',4);
return contractStorage.getAllowed(_from, _spender);
    }

    function setAllowed(address _from, address _spender, uint256 _amount) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',3);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',25);
        contractStorage.setAllowed(_from, _spender, _amount);
    }

    function getBalance(address _account) internal  returns (uint256) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',4);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',29);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',5);
return contractStorage.getBalance(_account);
    }

    function getBalances(address _firstAccount, address _secondAccount) internal  returns (uint256, uint256) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',5);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',33);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',6);
return contractStorage.getBalances(_firstAccount, _secondAccount);
    }

    function setBalance(address _account, uint256 _amount) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',6);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',37);
        contractStorage.setBalance(_account, _amount);
    }

    function setBalances(address _firstAccount, uint256 _firstAmount,
        address _secondAccount, uint256 _secondAmount) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',7);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',42);
        contractStorage.setBalances(_firstAccount, _firstAmount, _secondAccount, _secondAmount);
    }

    function getTotalSupply() internal  returns (uint256) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',8);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',46);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',7);
return contractStorage.getTotalSupply();
    }

    function setTotalSupply(uint256 _amount) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',9);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',50);
        contractStorage.setTotalSupply(_amount);
    }

    function isBlacklisted(address _account) internal  returns (bool) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',10);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',54);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',8);
return contractStorage.isBlacklisted(_account);
    }

    function isAnyBlacklisted(address _account1, address _account2) internal  returns (bool) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',11);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',58);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',9);
return contractStorage.isAnyBlacklisted(_account1, _account2);
    }


    function setBlacklisted(address _account, bool _status) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',12);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',63);
        contractStorage.setBlacklisted(_account, _status);
    }

    function isMinter(address _account) internal  returns (bool) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',13);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',67);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',10);
return contractStorage.isMinter(_account);
    }

    function setMinter(address _account, bool _status) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',14);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',71);
        contractStorage.setMinter(_account, _status);
    }

    function getMinterAllowed(address _minter) internal  returns (uint256) {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',15);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',75);
        emit __StatementCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',11);
return contractStorage.getMinterAllowed(_minter);
    }

    function setMinterAllowed(address _minter, uint256 _amount) internal {emit __FunctionCoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',16);

emit __CoverageEternalStorageUpdater('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorageUpdater.sol',79);
        contractStorage.setMinterAllowed(_minter, _amount);
    }

}
