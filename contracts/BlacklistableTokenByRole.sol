pragma solidity ^0.4.18;

import './PausableTokenByRole.sol';
import './EternalStorageUpdater.sol';

/**
 * @title Blacklistable Token
 * @dev Allows accounts to be blacklisted by a "blacklister" role
*/
contract BlacklistableTokenByRole is PausableTokenByRole, EternalStorageUpdater {

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
   * @dev Throws if called by any account that is blacklisted, or if the address passed in is blacklisted
   * @param _secondAccount An additional account to check
  */
  modifier notBlacklisted(address _secondAccount) {
    require(isAnyBlacklisted(msg.sender, _secondAccount) == false);
    _;
  }

  /**
   * @dev Throws if called by an account that is blacklisted
  */
  modifier senderNotBlacklisted() {
    require(isBlacklisted(msg.sender) == false);
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
  function unBlacklist(address _account) public whenNotPaused onlyBlacklister {
    setBlacklisted(_account, false);
    emit UnBlacklisted(_account);
  }

}
