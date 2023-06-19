// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.4.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.4.0/contracts/access/Ownable.sol";

contract DollarTokenFactory is Ownable {
    event TokenCreated(address indexed tokenAddress);

    function createToken(string memory name, string memory symbol, uint256 initialSupply) external onlyOwner {
        DollarToken token = new DollarToken(name, symbol, initialSupply);
        emit TokenCreated(address(token));
    }
}

contract DollarToken is ERC20 {
    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}

