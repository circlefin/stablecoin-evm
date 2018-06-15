pragma solidity ^0.4.23;

import './thirdparty/openzeppelin/ERC20.sol';

/**
 * @title Upgrdaded Contract
 * @dev ERC20 interface
*/
contract UpgradedContract is ERC20 {

    function approveViaPriorContract(address _from, address _spender, uint256 _value) public returns (bool);

    function transferViaPriorContract(address _from, address _to, uint256 _value) public returns (bool);

    function transferFromViaPriorContract(address _sender, address _from, address _to, uint256 _value) public returns (bool);

}
