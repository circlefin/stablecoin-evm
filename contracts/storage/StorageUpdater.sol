pragma solidity ^0.4.23;

import './../thirdparty/openzeppelin/SafeMath.sol';
import './../thirdparty/zeppelinos/ownership/Ownable.sol';

contract StorageUpdater is Ownable {
    using SafeMath for uint256;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowed;
    uint256 private totalSupply = 0;
    mapping(address => bool) private blacklisted;
    mapping(address => bool) private minters;
    mapping(address => uint256) private minterAllowed;


    /**** Get Methods ***********/


    function getAllowed(address _from, address _spender) internal view returns (uint256) {
        return allowed[_from][_spender];
    }

    function getBalance(address _account) internal view returns (uint256) {
        return balances[_account];
    }

    function getBalances(address _firstAccount, address _secondAccount) internal view returns (uint256, uint256) {
        return (balances[_firstAccount], balances[_secondAccount]);
    }

    function getTotalSupply() internal view returns (uint256) {
        return totalSupply;
    }

    function isBlacklisted(address _account) internal view returns (bool) {
        return blacklisted[_account];
    }

    function isAnyBlacklisted(address _account1, address _account2) internal view returns (bool) {
        return blacklisted[_account1] || blacklisted[_account2];
    }

    function getMinterAllowed(address _minter) internal view returns (uint256) {
        return minterAllowed[_minter];
    }

    function isMinter(address _account) internal view returns (bool) {
        return minters[_account];
    }


    /**** Set Methods ***********/


    function setAllowed(address _from, address _spender, uint256 _amount) internal {
        allowed[_from][_spender] = _amount;
    }

    function setBalance(address _account, uint256 _amount) internal {
        balances[_account] = _amount;
    }

    function moveBalanceAmount(address _originAccount, address _destinationAccount, uint256 _amount) internal {
        balances[_originAccount] = balances[_originAccount].sub(_amount);
        balances[_destinationAccount] = balances[_destinationAccount].add(_amount);
    }

    function setTotalSupply(uint256 _totalSupply) internal {
        totalSupply = _totalSupply;
    }

    function setBlacklisted(address _account, bool _status) internal {
        blacklisted[_account] = _status;
    }

    function setMinterAllowed(address _minter, uint256 _amount) internal {
        minterAllowed[_minter] = _amount;
    }

    function setMinter(address _account, bool _status) internal {
        minters[_account] = _status;
    }

}
