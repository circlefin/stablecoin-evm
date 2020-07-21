pragma solidity ^0.4.24;

import "contracts/FiatTokenV1.sol";

contract Test is FiatTokenV1 {
    //Note: These are special addresses used by echidna––don't change.
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

    function echidna_max_balance() public returns (bool) {
        // config.yaml specifies testerAddr is always the 'sender' address in transfers.
        return (balanceOf(testerAddr) <= initial_totalSupply / 2 &&
            balanceOf(otherAddr) >= initial_totalSupply / 2);
    }

    function echidna_no_burn_using_zero() public returns (bool) {
        return (balanceOf(0x0) == 0);
    }

    function echidna_self_transfer() public returns (bool) {
        uint256 balance = balanceOf(testerAddr);
        var b = transfer(testerAddr, balance);
        return (balanceOf(testerAddr) == balance && b);
    }

    function echidna_zero_transfer() public returns (bool) {
        return (transfer(otherAddr, 0));
    }

    function echidna_fixed_supply() public returns (bool) {
        return (totalSupply() == initial_totalSupply);
    }

    function echidna_self_approve_and_self_transferFrom()
        public
        returns (bool)
    {
        uint256 balance = balanceOf(testerAddr);
        approve(testerAddr, 0);
        approve(testerAddr, balance);
        return (transferFrom(testerAddr, testerAddr, balance));
    }

    function echidna_self_approve_and_transferFrom() public returns (bool) {
        uint256 balance = balanceOf(testerAddr);
        approve(testerAddr, 0);
        approve(testerAddr, balance);
        return (transferFrom(testerAddr, otherAddr, balance));
    }

    function echidna_multiple_approves() public returns (bool) {
        uint256 balance = balanceOf(testerAddr);
        approve(ownerAddr, balance);
        approve(ownerAddr, balance);
        return (allowed[testerAddr][ownerAddr] == balance);
    }
}
