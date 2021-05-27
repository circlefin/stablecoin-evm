pragma solidity ^0.4.24;

import "contracts/FiatTokenV1.sol";

contract Test is FiatTokenV1 {
    //Note: These are special addresses used by echidna––please don't change.
    address testerAddr = 0x00a329c0648769a73afac7f9381e08fb43dbea70;
    address otherAddr = 0x67518339e369ab3d591d3569ab0a0d83b2ff5198;
    address ownerAddr = 0x00a329c0648769a73afac7f9381e08fb43dbea72;
    uint256 initial_totalSupply = 1000000000;

    constructor() public {
        /* config.yaml sets this contract's address to ownerAddr, so we
    need to initialize all the contract roles to this address so that calls
    from the contract pass funtion modifiers.*/
        initialize(
            "Test",
            "",
            "",
            6,
            ownerAddr,
            ownerAddr,
            ownerAddr,
            ownerAddr
        );
        configureMinter(ownerAddr, initial_totalSupply);
        mint(testerAddr, initial_totalSupply / 2);
        require(balanceOf(testerAddr) == initial_totalSupply / 2);
        mint(otherAddr, initial_totalSupply / 2);
        require(balanceOf(otherAddr) == initial_totalSupply / 2);
    }

    function echidna_failed_transaction() public returns (bool) {
        uint256 balance = balanceOf(testerAddr);
        transfer(testerAddr, balance + 1);
        return (true);
    }

    function echidna_self_approve_and_failed_transferFrom_to_zero()
        public
        returns (bool)
    {
        uint256 balance = balanceOf(testerAddr);
        approve(testerAddr, 0);
        approve(testerAddr, balance);
        transferFrom(testerAddr, 0x0, balance);
        return (true);
    }

    function echidna_multiple_approves() public returns (bool) {
        transfer(ownerAddr, 1);
        uint256 balance = balanceOf(ownerAddr);
        approve(testerAddr, balance);
        approve(testerAddr, balance);
        return (allowed[ownerAddr][testerAddr] == balance);
    }
}
