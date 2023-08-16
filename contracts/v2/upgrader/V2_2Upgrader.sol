/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2023 CENTRE SECZ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

pragma solidity 0.6.12;

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "../../v1/Ownable.sol";
import { FiatTokenV2_2 } from "../FiatTokenV2_2.sol";
import { FiatTokenProxy } from "../../v1/FiatTokenProxy.sol";
import { V2_2UpgraderHelper } from "./helpers/V2_2UpgraderHelper.sol";
import { AbstractV2Upgrader } from "./AbstractV2Upgrader.sol";

/**
 * @title V2.2 Upgrader
 * @notice Performs USDC v2.2 upgrade, and runs a basic sanity test in a single
 * atomic transaction, rolling back if any issues are found. By performing the
 * upgrade atomically, it ensures that there is no disruption of service if the
 * upgrade is not successful for some unforeseen circumstances.
 * @dev Read doc/v2.2_upgrade.md
 */
contract V2_2Upgrader is AbstractV2Upgrader {
    using SafeMath for uint256;

    struct FiatTokenMetadata {
        string name;
        string symbol;
        uint8 decimals;
        string currency;
        string version;
        bytes32 domainSeparator;
        address masterMinter;
        address owner;
        address pauser;
        address blacklister;
        address rescuer;
        bool paused;
        uint256 totalSupply;
    }

    address[] private _accountsToBlacklist;

    /**
     * @notice Constructor
     * @param proxy               FiatTokenProxy contract
     * @param implementation      FiatTokenV2_2 implementation contract
     * @param newProxyAdmin       Grantee of proxy admin role after upgrade
     * @param accountsToBlacklist Accounts to add to the new blacklist data structure
     */
    constructor(
        FiatTokenProxy proxy,
        FiatTokenV2_2 implementation,
        address newProxyAdmin,
        address[] memory accountsToBlacklist
    ) public AbstractV2Upgrader(proxy, address(implementation), newProxyAdmin) {
        _helper = new V2_2UpgraderHelper(address(proxy));
        _accountsToBlacklist = accountsToBlacklist;
    }

    /**
     * @notice The list of blacklisted accounts to migrate to the blacklist data structure.
     * @return Address[] the list of accounts to blacklist.
     */
    function accountsToBlacklist() external view returns (address[] memory) {
        return _accountsToBlacklist;
    }

    /**
     * @notice Upgrade, transfer proxy admin role to a given address, run a
     * sanity test, and tear down the upgrader contract, in a single atomic
     * transaction. It rolls back if there is an error.
     */
    function upgrade() external onlyOwner {
        // The helper needs to be used to read contract state because
        // AdminUpgradeabilityProxy does not allow the proxy admin to make
        // proxy calls.
        V2_2UpgraderHelper v2_2Helper = V2_2UpgraderHelper(address(_helper));

        // Check that this contract sufficient funds to run the tests
        uint256 contractBal = v2_2Helper.balanceOf(address(this));
        require(contractBal >= 2e5, "V2_2Upgrader: 0.2 FiatToken needed");

        uint256 callerBal = v2_2Helper.balanceOf(msg.sender);

        // Keep original contract metadata
        FiatTokenMetadata memory originalMetadata = FiatTokenMetadata(
            v2_2Helper.name(),
            v2_2Helper.symbol(),
            v2_2Helper.decimals(),
            v2_2Helper.currency(),
            v2_2Helper.version(),
            v2_2Helper.DOMAIN_SEPARATOR(),
            v2_2Helper.masterMinter(),
            v2_2Helper.fiatTokenOwner(),
            v2_2Helper.pauser(),
            v2_2Helper.blacklister(),
            v2_2Helper.rescuer(),
            v2_2Helper.paused(),
            v2_2Helper.totalSupply()
        );

        // Change implementation contract address
        _proxy.upgradeTo(_implementation);

        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Initialize V2 contract
        FiatTokenV2_2 v2_2 = FiatTokenV2_2(address(_proxy));
        v2_2.initializeV2_2(_accountsToBlacklist);

        // Sanity test
        // Check metadata
        FiatTokenMetadata memory upgradedMetadata = FiatTokenMetadata(
            v2_2.name(),
            v2_2.symbol(),
            v2_2.decimals(),
            v2_2.currency(),
            v2_2.version(),
            v2_2.DOMAIN_SEPARATOR(),
            v2_2.masterMinter(),
            v2_2.owner(),
            v2_2.pauser(),
            v2_2.blacklister(),
            v2_2.rescuer(),
            v2_2.paused(),
            v2_2.totalSupply()
        );
        require(
            checkFiatTokenMetadataEqual(originalMetadata, upgradedMetadata),
            "V2_2Upgrader: metadata test failed"
        );

        // Test balanceOf
        require(
            v2_2.balanceOf(address(this)) == contractBal,
            "V2_2Upgrader: balanceOf test failed"
        );

        // Test transfer
        require(
            v2_2.transfer(msg.sender, 1e5) &&
                v2_2.balanceOf(msg.sender) == callerBal.add(1e5) &&
                v2_2.balanceOf(address(this)) == contractBal.sub(1e5),
            "V2_2Upgrader: transfer test failed"
        );

        // Test approve/transferFrom
        require(
            v2_2.approve(address(v2_2Helper), 1e5) &&
                v2_2.allowance(address(this), address(v2_2Helper)) == 1e5 &&
                v2_2Helper.transferFrom(address(this), msg.sender, 1e5) &&
                v2_2.allowance(address(this), msg.sender) == 0 &&
                v2_2.balanceOf(msg.sender) == callerBal.add(2e5) &&
                v2_2.balanceOf(address(this)) == contractBal.sub(2e5),
            "V2_2Upgrader: approve/transferFrom test failed"
        );

        // Transfer any remaining FiatToken to the caller
        withdrawFiatToken();

        // Tear down
        tearDown();
    }

    /**
     * @dev Checks whether two FiatTokenMetadata are equal.
     * @return true if the two metadata are equal, false otherwise.
     */
    function checkFiatTokenMetadataEqual(
        FiatTokenMetadata memory a,
        FiatTokenMetadata memory b
    ) private pure returns (bool) {
        return
            keccak256(bytes(a.name)) == keccak256(bytes(b.name)) &&
            keccak256(bytes(a.symbol)) == keccak256(bytes(b.symbol)) &&
            a.decimals == b.decimals &&
            keccak256(bytes(a.currency)) == keccak256(bytes(b.currency)) &&
            keccak256(bytes(a.version)) == keccak256(bytes(b.version)) &&
            a.domainSeparator == b.domainSeparator &&
            a.masterMinter == b.masterMinter &&
            a.owner == b.owner &&
            a.pauser == b.pauser &&
            a.blacklister == b.blacklister &&
            a.rescuer == b.rescuer &&
            a.paused == b.paused &&
            a.totalSupply == b.totalSupply;
    }
}
