// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.6.12;

interface IFiatTokenV2_Circle {
    function initializeV2_2(
        address[] calldata accountsToBlacklist,
        string calldata newSymbol
    ) external;

    function initializeV2_1(address lostAndFound) external;

    function initializeV2(string calldata newName) external;

    function initialize(
        string memory tokenName,
        string memory tokenSymbol,
        string memory tokenCurrency,
        uint8 tokenDecimals,
        address newMasterMinter,
        address newPauser,
        address newBlacklister,
        address newOwner
    ) external;

    function initializeV2_Circle(address _l1Token, address _l2Bridge) external;

    function configureMinter(address minter, uint256 minterAllowedAmount)
        external;
}
