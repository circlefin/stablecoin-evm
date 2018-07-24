pragma solidity ^0.4.24;

import 'zos-lib/contracts/upgradeability/AdminUpgradeabilityProxy.sol';

/**
 * @title FiatTokenProxy
 * @dev This contract proxies FiatToken calls and enables FiatToken upgrades
*/ 
contract FiatTokenProxy is AdminUpgradeabilityProxy {
    constructor(address _implementation) public AdminUpgradeabilityProxy(_implementation) {
    }
}
