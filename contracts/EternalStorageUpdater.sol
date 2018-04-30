pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/math/SafeMath.sol';

import './EternalStorage.sol';

contract EternalStorageUpdater {
  using SafeMath for uint256;

  EternalStorage contractStorage = EternalStorage(0);

  function getAllowed(address _from, address _spender) internal view returns (uint256) {
    return contractStorage.getUint(keccak256("allowed.", _from, ".", _spender));
  }

  function setAllowed(address _from, address _spender, uint256 amount) internal {
    contractStorage.setUint(keccak256("allowed.", _from, ".", _spender), amount);
  }

  function getBalance(address _account) internal view returns (uint256) {
    return contractStorage.getUint(keccak256("balance.", _account));
  }

  function setBalance(address _account, uint256 amount) internal {
    contractStorage.setUint(keccak256("balance.", _account), amount);
  }

  function getTotalSupply() internal view returns (uint256) {
    return contractStorage.getUint(keccak256("totalSupply"));
  }

  function setTotalSupply(uint256 amount) internal {
    contractStorage.setUint(keccak256("totalSupply"), amount);
  }

  function isRedeemer(address _account) internal view returns (bool) {
    return contractStorage.getBool(keccak256("redeemer.", _account));
  }

  function setRedeemer(address _account, bool status) internal {
    contractStorage.setBool(keccak256("redeemer.", _account), status);
  }

  function isBlacklisted(address _account) internal view returns (bool) {
    return contractStorage.getBool(keccak256("blacklisted.", _account));
  }

  function setBlacklisted(address _account, bool status) internal {
    contractStorage.setBool(keccak256("blacklisted.", _account), status);
  }

}



