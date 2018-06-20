pragma solidity ^0.4.23;

import './../thirdparty/openzeppelin/Ownable.sol';

contract EternalStorage is Ownable {event __CoverageEternalStorage(string fileName, uint256 lineNumber);
event __FunctionCoverageEternalStorage(string fileName, uint256 fnId);
event __StatementCoverageEternalStorage(string fileName, uint256 statementId);
event __BranchCoverageEternalStorage(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageEternalStorage(string fileName, uint256 branchId);
event __AssertPostCoverageEternalStorage(string fileName, uint256 branchId);


    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply = 0;
    mapping(address => bool) private blacklisted;
    mapping(address => bool) private minters;
    mapping(address => uint256) private minterAllowed;


    /**** Get Methods ***********/


    function getAllowed(address _from, address _spender) external  returns (uint256) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',1);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',19);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',1);
return allowed[_from][_spender];
    }

    function getBalance(address _account) external  returns (uint256) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',2);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',23);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',2);
return balances[_account];
    }

    function getBalances(address _firstAccount, address _secondAccount) external  returns (uint256, uint256) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',3);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',27);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',3);
return (balances[_firstAccount], balances[_secondAccount]);
    }

    function getTotalSupply() external  returns (uint256) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',4);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',31);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',4);
return totalSupply;
    }

    function isBlacklisted(address _account) external  returns (bool) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',5);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',35);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',5);
return blacklisted[_account];
    }

    function isAnyBlacklisted(address _account1, address _account2) external  returns (bool) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',6);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',39);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',6);
return blacklisted[_account1] || blacklisted[_account2];
    }

    function getMinterAllowed(address _minter) external  returns (uint256) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',7);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',43);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',7);
return minterAllowed[_minter];
    }

    function isMinter(address _account) external  returns (bool) {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',8);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',47);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',8);
return minters[_account];
    }


    /**** Set Methods ***********/


    function setAllowed(address _from, address _spender, uint256 _amount) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',9);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',55);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',9);
allowed[_from][_spender] = _amount;
    }

    function setBalance(address _account, uint256 _amount) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',10);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',59);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',10);
balances[_account] = _amount;
    }

    function setBalances(address _firstAccount, uint256 _firstAmount,
        address _secondAccount, uint256 _secondAmount) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',11);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',64);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',11);
balances[_firstAccount] = _firstAmount;
emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',65);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',12);
balances[_secondAccount] = _secondAmount;
    }

    function setTotalSupply(uint256 _totalSupply) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',12);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',69);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',13);
totalSupply = _totalSupply;
    }

    function setBlacklisted(address _account, bool _status) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',13);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',73);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',14);
blacklisted[_account] = _status;
    }

    function setMinterAllowed(address _minter, uint256 _amount) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',14);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',77);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',15);
minterAllowed[_minter] = _amount;
    }

    function setMinter(address _account, bool _status) onlyOwner external {emit __FunctionCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',15);

emit __CoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',81);
        emit __StatementCoverageEternalStorage('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/storage/EternalStorage.sol',16);
minters[_account] = _status;
    }

}
