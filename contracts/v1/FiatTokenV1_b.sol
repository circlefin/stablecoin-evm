/**
 * SPDX-License-Identifier: MIT
 */

pragma solidity 0.6.12;

import { FiatTokenV1 } from "./FiatTokenV1.sol";

contract FiatTokenV1b is FiatTokenV1 {
    /**
     * @dev allows a minter to burn some tokens from a blacklisted address
     * Validates that caller is a minter and that From address is blacklisted
     * amount is less than or equal to the From address account balance
     * @param from The blacklisted address to burn tokens from
     * @param _amount uint256 The amount of tokens to be burned
     */
    function burnFrom(address from, uint256 _amount)
        external
        whenNotPaused
        onlyMinters
    {
        uint256 balance = balances[from];
        require(blacklisted[from] == true, "FiatToken: address is not blacklisted");
        require(_amount > 0, "FiatToken: burn amount not greater than 0");
        require(balance >= _amount, "FiatToken: burn amount exceeds balance");

        totalSupply_ = totalSupply_.sub(_amount);
        balances[from] = balance.sub(_amount);

        emit Burn(from, _amount);
        emit Transfer(from, address(0), _amount);
    }
}
