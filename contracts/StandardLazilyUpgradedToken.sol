pragma solidity ^0.4.18;

import './LazilyUpgradedToken.sol';
import './UpgradedFiatToken.sol';

contract StandardLazilyUpgradedToken is LazilyUpgradedToken {

  function isBalanceValid(address account) public view returns (bool) {
    return balances[account].isValid;
  }

  function isAllowanceValid(address owner, address spender) public view returns (bool) {
    return allowed[owner][spender].isValid;
  }

  function setBalance(address account, uint256 amount) internal returns (bool) {
	balances[account].balance = amount;
	balances[account].isValid = true;
	return true;
  }

  function setAllowed(address owner, address spender, uint256 amount) internal returns (bool) {
    allowed[owner][spender].allowed = amount;
    allowed[owner][spender].isValid = true;
    return true;
  }

  function balanceOfLocal(address _account) public view returns (uint256) {
    return balances[_account].balance;
  }

  function allowanceLocal(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender].allowed;
  }

  function balanceOf(address _owner) public view returns (uint256) {
     if (upgraded) {
      return UpgradedFiatToken(upgradedAddress).balanceOf(_owner);
    }
    return balanceOfWithUpgrades(_owner);
  }

  function allowance(address _owner, address _spender) public view returns (uint256) {
    if (upgraded) {
      return UpgradedFiatToken(upgradedAddress).allowance(_owner, _spender);
    }
    return allowanceWithUpgrades(_owner, _spender);
  }

  function approve(address _spender, uint256 _value) public returns (bool) {
    if (upgraded) {
      return UpgradedFiatToken(upgradedAddress).approve(_spender, _value);
    }
    setAllowed(msg.sender, _spender, _value);
    Approval(msg.sender, _spender, _value);
    return true;
  }

  function increaseApproval(address _spender, uint _addedValue) public returns (bool) { 
    if (upgraded) {
      return UpgradedFiatToken(upgradedAddress).increaseApproval(_spender, _addedValue);
    }
    uint256 newAllowance = allowance(msg.sender, _spender).add(_addedValue);
    setAllowed(msg.sender, _spender, newAllowance);
    Approval(msg.sender, _spender, newAllowance);
    return true;
  }

  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    if (upgraded) {
      return UpgradedFiatToken(upgradedAddress).decreaseApproval(_spender, _subtractedValue);
    }
    uint oldValue = allowance(msg.sender, _spender);
    if (_subtractedValue > oldValue) {
      setAllowed(msg.sender, _spender, 0);
    } else {
      setAllowed(msg.sender, _spender, oldValue.sub(_subtractedValue));
    }
    Approval(msg.sender, _spender, allowance(msg.sender, _spender));
    return true;
  }

  function balanceOfWithUpgrades(address account) public view returns (uint256) {
    uint256 localBalance = balanceOfLocal(account);
    if ((isBalanceValid(account) == true) || (deprecatedAddress == address(0))) {
      return localBalance;
    } else {
      return UpgradedFiatToken(deprecatedAddress).balanceOfWithUpgrades(account);
    }
  }

  function allowanceWithUpgrades(address owner, address spender) public view returns (uint256) {
    uint256 localAllowance = allowanceLocal(owner, spender);
    if ((isAllowanceValid(owner, spender) == true) || (deprecatedAddress == address(0))) {
    return localAllowance;
    } else {
    return UpgradedFiatToken(deprecatedAddress).allowanceWithUpgrades(owner, spender);
    }
  }
} 
