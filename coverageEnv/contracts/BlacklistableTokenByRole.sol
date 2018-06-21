pragma solidity ^0.4.23;

import "./thirdparty/openzeppelin/Ownable.sol";
import "./storage/EternalStorageUpdater.sol";

/**
 * @title Blacklistable Token
 * @dev Allows accounts to be blacklisted by a "blacklister" role
*/
contract BlacklistableTokenByRole is EternalStorageUpdater, Ownable {event __CoverageBlacklistableTokenByRole(string fileName, uint256 lineNumber);
event __FunctionCoverageBlacklistableTokenByRole(string fileName, uint256 fnId);
event __StatementCoverageBlacklistableTokenByRole(string fileName, uint256 statementId);
event __BranchCoverageBlacklistableTokenByRole(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageBlacklistableTokenByRole(string fileName, uint256 branchId);
event __AssertPostCoverageBlacklistableTokenByRole(string fileName, uint256 branchId);


    address public blacklister;

    event Blacklisted(address _account);
    event UnBlacklisted(address _account);
    event BlacklisterChanged(address indexed newBlacklister);

    constructor(address _blacklister) public {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',1);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',19);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',1);
blacklister = _blacklister;
    }

    /**
     * @dev Throws if called by any account other than the blacklister
    */
    modifier onlyBlacklister() {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',2);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',26);
        emit __AssertPreCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',1);
emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',2);
require(msg.sender == blacklister);emit __AssertPostCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',1);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',27);
        _;
    }

    /**
     * @dev Throws if either argument account is blacklisted
     * @param _secondAccount An account to check
     * @param _secondAccount An additional account to check
    */
    modifier notBlacklistedBoth(address _firstAccount, address _secondAccount) {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',3);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',36);
        emit __AssertPreCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',2);
emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',3);
require(isAnyBlacklisted(_firstAccount, _secondAccount) == false);emit __AssertPostCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',2);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',37);
        _;
    }

    /**
     * @dev Throws if argument account is blacklisted
     * @param _account An additional account to check
    */
    modifier notBlacklisted(address _account) {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',4);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',45);
        emit __AssertPreCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',3);
emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',4);
require(isBlacklisted(_account) == false);emit __AssertPostCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',3);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',46);
        _;
    }

    /**
     * @dev Checks if account is blacklisted
     * @param _account The address to check
    */
    function isAccountBlacklisted(address _account) public  returns (bool) {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',5);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',54);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',5);
return isBlacklisted(_account);
    }

    /**
     * @dev Adds account to blacklist
     * @param _account The address to blacklist
    */
    function blacklist(address _account) public onlyBlacklister {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',6);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',62);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',6);
setBlacklisted(_account, true);
emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',63);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',7);
emit Blacklisted(_account);
    }

    /**
     * @dev Removes account from blacklist
     * @param _account The address to remove from the blacklist
    */
    function unBlacklist(address _account) public onlyBlacklister {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',7);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',71);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',8);
setBlacklisted(_account, false);
emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',72);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',9);
emit UnBlacklisted(_account);
    }

    function updateBlacklister(address _newBlacklister) public onlyOwner {emit __FunctionCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',8);

emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',76);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',10);
blacklister = _newBlacklister;
emit __CoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',77);
        emit __StatementCoverageBlacklistableTokenByRole('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/BlacklistableTokenByRole.sol',11);
emit BlacklisterChanged(blacklister);
    }
}
