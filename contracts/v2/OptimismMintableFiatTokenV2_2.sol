// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import { FiatTokenV1 } from "../v1/FiatTokenV1.sol";
import { FiatTokenV2_2 } from "./FiatTokenV2_2.sol";
import {
    IOptimismMintableERC20,
    IOptimismMintableFiatToken
} from "./IOptimismMintableFiatToken.sol";
import { IERC165 } from "@openzeppelin/contracts/introspection/IERC165.sol";

/**
 * @title OptimismMintableFiatTokenV2_2
 * @author Lattice (https://lattice.xyz)
 * @notice Adds compatibility with IOptimismMintableERC20 to the Bridged USDC Standard,
 *         so it can be used with Optimism's StandardBridge.
 */
contract OptimismMintableFiatTokenV2_2 is
    FiatTokenV2_2,
    IOptimismMintableFiatToken
{
    address private immutable l1RemoteToken;

    constructor(address _l1RemoteToken) public FiatTokenV2_2() {
        l1RemoteToken = _l1RemoteToken;
    }

    function remoteToken() external override view returns (address) {
        return l1RemoteToken;
    }

    function bridge() external override returns (address) {
        // OP Stack L2StandardBridge predeploy
        // https://specs.optimism.io/protocol/predeploys.html
        return address(0x4200000000000000000000000000000000000010);
    }

    function supportsInterface(bytes4 interfaceId)
        external
        override
        view
        returns (bool)
    {
        return
            interfaceId == type(IOptimismMintableERC20).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @notice Allows a minter to burn tokens for the given account.
     * @dev The caller must be a minter, must not be blacklisted, and the amount to burn
     *      should be less than or equal to the account's balance.
     *      The function is a requirement for IOptimismMintableERC20.
     *      It is mostly equivalent to FiatTokenV1.burn, with the only change being
     *      the additional _from parameter to burn from instead of burning from msg.sender.
     * @param _amount the amount of tokens to be burned.
     */
    function burn(address _from, uint256 _amount)
        external
        override
        whenNotPaused
        onlyMinters
        notBlacklisted(msg.sender)
    {
        uint256 balance = _balanceOf(_from);
        require(_amount > 0, "FiatToken: burn amount not greater than 0");
        require(balance >= _amount, "FiatToken: burn amount exceeds balance");

        totalSupply_ = totalSupply_.sub(_amount);
        _setBalance(_from, balance.sub(_amount));
        emit Burn(msg.sender, _amount);
        emit Transfer(_from, address(0), _amount);
    }
}
