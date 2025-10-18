// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.4.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.4.0/contracts/access/Ownable.sol";

contract DollarToken is ERC20, Ownable {
    bool private _contractCreated;
    address private _tokenFactory;
    
    modifier onlyTokenFactory() {
        require(msg.sender == _tokenFactory, "Only the token factory can create instances of this contract");
        _;
    }
    
    constructor(address tokenFactory) ERC20("Dollar", "$") {
        require(!_contractCreated, "Contract already created");
        _contractCreated = true;
        _tokenFactory = tokenFactory;
        
        uint256 initialSupply = 32674174016000000000000 * (10**6); // 32,674,174,016 tokens with 6 decimals
        _mint(msg.sender, initialSupply);
    }
    
    function additionalMint(uint256 amount) public onlyOwner {
        _mint(msg.sender, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
 