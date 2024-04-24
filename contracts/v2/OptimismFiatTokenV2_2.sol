// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import { FiatTokenV1 } from "../v1/FiatTokenV1.sol";
import { FiatTokenV2_2 } from "./FiatTokenV2_2.sol";
import { IOptimismMintableERC20 } from "./IOptimismMintableERC20.sol";
import { IERC165 } from "@openzeppelin/contracts/introspection/IERC165.sol";

/**
 * @title OptimismFiatTokenV2_2
 * @author Lattice (https://lattice.xyz)
 * @notice Adds compatibility with IOptimismMintableERC20 to the Bridged USDC Standard,
 *         so it can be used with Optimism's StandardBridge.
 * @dev    This contract does not extend `IOptimismMintableERC20` to avoid the requirement to override `mint` and `burn` functions.
 */
contract OptimismFiatTokenV2_2 is FiatTokenV2_2, IERC165 {
    address private immutable l1RemoteToken;

    constructor(address _l1RemoteToken) public {
        l1RemoteToken = _l1RemoteToken;
    }

    function remoteToken() external view returns (address) {
        return l1RemoteToken;
    }

    function bridge() external pure returns (address) {
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
}
