pragma solidity ^0.4.18;

import './EternalStorageUpdater.sol';

/**
 * @title Blacklistable Token
 * @dev Allows accounts to be blacklisted by a "blacklister" role
*/
contract BlacklistableTokenByRole is EternalStorageUpdater {

  address public blacklister;

  event Blacklisted(address _account);
  event UnBlacklisted(address _account);

  /**
   * @dev Throws if called by any account other than the blacklister
  */
  modifier onlyBlacklister() {
    require(msg.sender == blacklister);
    _;
  }

  /**
   * @dev Throws if called by any account that is blacklisted
  */
  modifier notBlacklisted() {
    require(isBlacklisted(msg.sender) != true);
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
    Blacklisted(_account);
  }

  /**
   * @dev Removes account from blacklist
   * @param _account The address to remove from the blacklist
  */
  function unBlacklist(address _account) public onlyBlacklister {
    setBlacklisted(_account, false);
    UnBlacklisted(_account);
  }

}
