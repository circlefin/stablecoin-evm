pragma solidity ^0.4.18;

import './../../lib/openzeppelin/contracts/ownership/Ownable.sol';

contract EternalStorage is Ownable {

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply = 0;
    mapping(address => bool) private blacklisted;
    mapping(address => bool) private minters;
    mapping(address => uint256) private minterAllowed;


    /**** Get Methods ***********/


    function getAllowed(address _from, address _spender) external view returns (uint256) {
        return allowed[_from][_spender];
    }

    function getBalance(address _account) external view returns (uint256) {
        return balances[_account];
    }

    function getBalances(address _firstAccount, address _secondAccount) external view returns (uint256, uint256) {
        return (balances[_firstAccount], balances[_secondAccount]);
    }

    function getTotalSupply() external view returns (uint256) {
        return totalSupply;
    }

    function isBlacklisted(address _account) external view returns (bool) {
        return blacklisted[_account];
    }

    function isAnyBlacklisted(address _account1, address _account2) external view returns (bool) {
      return blacklisted[_account1] || blacklisted[_account2];
    }

    function getMinterAllowed(address _minter) external view returns (uint256) {
        return minterAllowed[_minter];
    }

    function isMinter(address _account) external view returns (bool) {
        return minters[_account];
    }


    /**** Set Methods ***********/


    function setAllowed(address _from, address _spender, uint256 _amount) onlyOwner external {
        allowed[_from][_spender] = _amount;
    }

    function setBalance(address _account, uint256 _amount) onlyOwner external {
        balances[_account] = _amount;
    }

    function setBalances(address _firstAccount, uint256 _firstAmount,
                        address _secondAccount, uint256 _secondAmount) onlyOwner external {
        balances[_firstAccount] = _firstAmount;
        balances[_secondAccount] = _secondAmount;
    }

    function setTotalSupply(uint256 _totalSupply) onlyOwner external {
        totalSupply = _totalSupply;
    }

    function setBlacklisted(address _account, bool _status) onlyOwner external {
        blacklisted[_account] = _status;
    }

    function setMinterAllowed(address _minter, uint256 _amount) onlyOwner external {
        minterAllowed[_minter] = _amount;
    }

    function setMinter(address _account, bool _status) onlyOwner external {
        minters[_account] = _status;
    }

}
