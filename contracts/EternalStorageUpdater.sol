pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/math/SafeMath.sol';

import './EternalStorage.sol';

contract EternalStorageUpdater {
  using SafeMath for uint256;

  EternalStorage contractStorage = EternalStorage(0);

  function getAllowed(address _from, address _spender) internal view returns (uint256) {
    return contractStorage.getAllowed(_from, _spender);
  }

  function setAllowed(address _from, address _spender, uint256 _amount) internal {
    contractStorage.setAllowed(_from,  _spender, _amount);
  }

  function getBalance(address _account) internal view returns (uint256) {
    return contractStorage.getBalance(_account);
  }

  function getBalances(address _firstAccount, address _secondAccount) internal view returns (uint256, uint256) {
    return contractStorage.getBalances(_firstAccount, _secondAccount);
  }

  function setBalance(address _account, uint256 _amount) internal {
    contractStorage.setBalance(_account, _amount);
  }

  function setBalances(address _firstAccount, uint256 _firstAmount,
                      address _secondAccount, uint256 _secondAmount) internal {
    contractStorage.setBalances(_firstAccount, _firstAmount, _secondAccount, _secondAmount);
  }

  function getTotalSupply() internal view returns (uint256) {
    return contractStorage.getTotalSupply();
  }

  function setTotalSupply(uint256 _amount) internal {
    contractStorage.setTotalSupply(_amount);
  }

  function isBlacklisted(address _account) internal view returns (bool) {
    return contractStorage.isBlacklisted(_account);
  }

  function isAnyBlacklisted(address _account1, address _account2) internal view returns (bool) {
    return contractStorage.isAnyBlacklisted(_account1, _account2);
  }


  function setBlacklisted(address _account, bool _status) internal {
    contractStorage.setBlacklisted(_account, _status);
  }

  function isMinter(address _account) internal view returns (bool) {
    return contractStorage.isMinter(_account);
  }

  function setMinter(address _account, bool _status) internal {
    return contractStorage.setMinter(_account, _status);
  }

  function getMinterAllowed(address _minter) internal view returns (uint256) {
    return contractStorage.getMinterAllowed(_minter);
  }

  function setMinterAllowed(address _minter, uint256 _amount) internal {
    contractStorage.setMinterAllowed(_minter, _amount);
  }

}
