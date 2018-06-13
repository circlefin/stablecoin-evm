pragma solidity ^0.4.18;

import './PausableTokenByRole.sol';
import "./storage/EternalStorageUpdater.sol";

/**
 * @title Blacklistable Token
 * @dev Allows accounts to be blacklisted by a "blacklister" role
*/
contract BlacklistableTokenByRole is EternalStorageUpdater {

    address public blacklister;

    event Blacklisted(address _account);
    event UnBlacklisted(address _account);

    constructor(address _blacklister) public {
        blacklister = _blacklister;
    }

    /**
     * @dev Throws if called by any account other than the blacklister
    */
    modifier onlyBlacklister() {
        require(msg.sender == blacklister);
        _;
    }

    /**
     * @dev Throws if either argument account is blacklisted
     * @param _secondAccount An account to check
     * @param _secondAccount An additional account to check
    */
    modifier notBlacklistedBoth(address _firstAccount, address _secondAccount) {
        require(isAnyBlacklisted(_firstAccount, _secondAccount) == false);
        _;
    }

    /**
     * @dev Throws if argument account is blacklisted
     * @param _account An additional account to check
    */
    modifier notBlacklisted(address _account) {
        require(isBlacklisted(_account) == false);
        _;
    }

    /**
     * @dev Checks if account is blacklisted
     * @param _account The address to check
    */
    function isAccountBlacklisted(address _account) public constant returns (bool) {
        return isBlacklisted(_account);
    }

    /**
     * @dev Adds account to blacklist
     * @param _account The address to blacklist
    */
    function blacklist(address _account) public onlyBlacklister {
        setBlacklisted(_account, true);
        emit Blacklisted(_account);
    }

    /**
     * @dev Removes account from blacklist
     * @param _account The address to remove from the blacklist
    */
    function unBlacklist(address _account) public onlyBlacklister {
        setBlacklisted(_account, false);
        emit UnBlacklisted(_account);
    }

}
