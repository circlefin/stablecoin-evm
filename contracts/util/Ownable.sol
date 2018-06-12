pragma solidity ^0.4.18;

/**
 * @title Ownable
 * @dev The Ownable contract is copied from openzeppelin v1.6.0 with modifications 
 * to add an emit prefix to events as well as replace the constuctor function name with "constructor" as enforced by a later version of solidity.
 * Openzeppelin's later version of Ownable is not used as it introduces new functionality not needed in the token.
 * Has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions.
 */
contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
    */
    constructor() public {
        owner = msg.sender;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
