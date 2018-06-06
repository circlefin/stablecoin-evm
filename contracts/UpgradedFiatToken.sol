pragma solidity ^0.4.22;

import './FiatToken.sol';
import './UpgradedContract.sol';

/**
 * @title UpgradedFiatToken
 * @dev UpgradedERC20 Token backed by fiat reserves
 */
contract UpgradedFiatToken is FiatToken, UpgradedContract {
  
    address public priorContractAddress;

    constructor(address _contractStorageAddress, address _priorContractAddress, string _name, string _symbol, string _currency, uint8 _decimals, address _masterMinter, address _pauser, address _blacklister, address _upgrader, address _roleAddressChanger) FiatToken(_contractStorageAddress, _name, _symbol, _currency, _decimals, _masterMinter, _pauser, _blacklister, _upgrader, _roleAddressChanger) {

    priorContractAddress = _priorContractAddress;
  }

  /**   
   * @dev Throws if called by address other than the priorContract
  */
  modifier onlyPriorContract() {
    require(msg.sender == priorContractAddress);
    _;
  }

  /**
   * @dev Approve an address as a spender
   * @param _spender address The address approve
   * @param _value uint256 The amount to approve
   * @return True if the operation was successful.
  */
  function approve(address _spender, uint256 _value) public returns (bool) {
    if (isUpgraded()) {
      return UpgradedContract(upgradedAddress).approveViaPriorContract(msg.sender, _spender, _value);
    }
    return doApprove(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Approve an address as a spender via the prior contract
   * Validates that only the prior contract may call the function
   * @param _from address The address to be spent from
   * @param _spender address The address approve
   * @param _value uint256 The amount to approve
   * @return True if the operation was successful.
  */
  function approveViaPriorContract(address _from, address _spender, uint256 _value) public onlyPriorContract returns (bool) {
    return doApprove(_from, _spender, _value);
    return true;
  }

  /**
   * @dev Updates allowed balance
   * Validates that the contract is not paused, the 
   * @param _from address The address to be spent from
   * @param _spender address The address approve
   * @param _value uint256 The amount to approve
  */
  function doApprove(address _from, address _spender, uint256 _value) whenNotPaused notBlacklistedBoth(_from, _spender) private returns (bool) {
    setAllowed(_from, _spender, _value);
    emit Approval(_from, _spender, _value);
  }

  /**
   * @dev transfer tokens to a specified address
   * @param _to address The address to transfer to
   * @param _value uint256 The amount to be transferred
   * @return bool success
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    if (isUpgraded()) {
      return UpgradedContract(upgradedAddress).transferViaPriorContract(msg.sender, _to,  _value);
    }
    doTransfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev transfer tokens to a specified address via the prior contract
   * Validates that only the prior contract may call the function
   * @param _from address The address to transfer from
   * @param _to address The address to transfer to
   * @param _value uint256 The amount to be transferred
   * @return bool success
  */
  function transferViaPriorContract(address _from, address _to, uint256 _value) public onlyPriorContract returns (bool) {
    doTransfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Transfer tokens from one address to another with the from address's approval
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @return bool success
  */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    if (isUpgraded()) {
      return UpgradedContract(upgradedAddress).transferFromViaPriorContract(msg.sender, _from, _to, _value);
    }

    doTransferFrom(msg.sender, _from, _to, _value);
    return true;
  }

  /**
   * @dev Transfer tokens from one address to another with the from address's approval via the prior contract
   * Validates that only the prior contract may call the function
   * @param _sender address The address sending tokens on behalf of the from address
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   * @return bool success
  */
  function transferFromViaPriorContract(address _sender, address _from, address _to, uint256 _value) public onlyPriorContract returns (bool) {
    doTransferFrom(_sender, _from, _to, _value);
    return true;
  }

  /**
   * @dev updates balances for sender, recipient for a transferFrom
   * Validates that the totalAmount <= the allowed amount for the sender on the from account.
   * @param _sender address The address sending tokens on behalf of the from address
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
  */
  function doTransferFrom(address _sender, address _from, address _to, uint256 _value) private {
    uint256 allowed;
    allowed = getAllowed(_from, _sender);

    require(_value <= allowed);

    doTransfer(_from, _to, _value);
    setAllowed(_from, _sender, allowed.sub(_value));
  }

  /**
   * @dev updates balances for sender, recipient for a transfer
   * Validates that _to address exists, totalAmount <= balance of the from account, contract is not paused, sender and receiver are not blacklisted
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
  */
  function doTransfer(address _from, address _to, uint256 _value) private whenNotPaused notBlacklistedBoth(_from, _to)  {
    require(_to != address(0));

    uint256 balance;
    uint256 toBalance;

    (balance, toBalance) = getBalances(_from, _to);

    require(_value <= balance);

    // SafeMath.sub will throw if there is not enough balance.
    setBalances(_from, balance.sub(_value), _to, toBalance.add(_value));
    emit Transfer(_from, _to, _value);
  }

}
