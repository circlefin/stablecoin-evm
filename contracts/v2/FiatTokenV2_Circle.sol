// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.6.12;
import "./FiatTokenV2_2.sol";
import "../interface/IL2StandardERC20.sol";

contract FiatTokenV2_Circle is FiatTokenV2_2 {
    address public l1Token;
    address public l2Bridge;

    /**
     * @param _l2Bridge Address of the L2 standard bridge.
     * @param _l1Token Address of the corresponding L1 token.
     */
    function initializeV2_Circle(address _l1Token, address _l2Bridge) external {
        l1Token = _l1Token;
        l2Bridge = _l2Bridge;
    }

    function supportsInterface(bytes4 _interfaceId) public pure returns (bool) {
        bytes4 firstSupportedInterface = bytes4(
            keccak256("supportsInterface(bytes4)")
        ); // ERC165
        bytes4 secondSupportedInterface = IL2StandardERC20.l1Token.selector ^
            IL2StandardERC20.mint.selector ^
            IL2StandardERC20.burn.selector;
        return
            _interfaceId == firstSupportedInterface ||
            _interfaceId == secondSupportedInterface;
    }
}
