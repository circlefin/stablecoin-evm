/**
 * SPDX-License-Identifier: MIT
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
import { V2UpgraderHelper } from "../../v2/upgrader/V2UpgraderHelper.sol";

/**
 * @title v2.2 Upgrader
 * @notice Performs USDC v2.2 upgrade
 * @dev docs TBD
 */
contract V2_2Upgrader is Ownable {
    using SafeMath for uint256;

    FiatTokenProxy private _proxy;
    FiatTokenV2_2 private _implementation;
    address private _newProxyAdmin;
    string private _newName;
    V2UpgraderHelper private _helper;
    address[] private _accountsToBlacklist;

    /**
     * @notice Constructor
     * @param proxy                 FiatTokenProxy contract
     * @param implementation        FiatTokenV2_2 implementation contract
     * @param newProxyAdmin         Grantee of proxy admin role after upgrade
     * @param accountsToBlacklist   Accounts to re-add to the blacklist
     */
    constructor(
        FiatTokenProxy proxy,
        FiatTokenV2_2 implementation,
        address newProxyAdmin,
        address[] memory accountsToBlacklist
    ) public Ownable() {
        _proxy = proxy;
        _implementation = implementation;
        _newProxyAdmin = newProxyAdmin;
        _helper = new V2UpgraderHelper(address(proxy));
        _accountsToBlacklist = accountsToBlacklist;
    }

    /**
     * @notice The address of the FiatTokenProxy contract
     * @return Contract address
     */
    function proxy() external view returns (address) {
        return address(_proxy);
    }

    /**
     * @notice The address of the FiatTokenV2_2 implementation contract
     * @return Contract address
     */
    function implementation() external view returns (address) {
        return address(_implementation);
    }

    /**
     * @notice The address of the V2UpgraderHelper contract
     * @return Contract address
     */
    function helper() external view returns (address) {
        return address(_helper);
    }

    /**
     * @notice The address to which the proxy admin role will be transferred
     * after the upgrade is completed
     * @return Address
     */
    function newProxyAdmin() external view returns (address) {
        return _newProxyAdmin;
    }

    /**
     * @notice Previously blacklisted accounts to re-add to the blacklist
     * @return Address[]
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

        // Check that this contract sufficient funds to run the tests
        uint256 contractBal = _helper.balanceOf(address(this));
        require(contractBal >= 2e5, "V2_2Upgrader: 0.2 USDC needed");

        uint256 callerBal = _helper.balanceOf(msg.sender);

        // Keep original contract metadata
        string memory name = _helper.name();
        string memory symbol = _helper.symbol();
        uint8 decimals = _helper.decimals();
        string memory currency = _helper.currency();
        address masterMinter = _helper.masterMinter();
        address owner = _helper.fiatTokenOwner();
        address pauser = _helper.pauser();
        address blacklister = _helper.blacklister();

        // Change implementation contract address
        _proxy.upgradeTo(address(_implementation));

        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Initialize V2_2 contract
        FiatTokenV2_2 v2_2 = FiatTokenV2_2(address(_proxy));
        v2_2.initializeV2_2(_accountsToBlacklist);

        // Sanity test
        // Check metadata
        require(
            keccak256(bytes(name)) == keccak256(bytes(v2_2.name())) &&
                keccak256(bytes(symbol)) == keccak256(bytes(v2_2.symbol())) &&
                decimals == v2_2.decimals() &&
                keccak256(bytes(currency)) == keccak256(bytes(v2_2.currency())) &&
                masterMinter == v2_2.masterMinter() &&
                owner == v2_2.owner() &&
                pauser == v2_2.pauser() &&
                blacklister == v2_2.blacklister(),
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
            v2_2.approve(address(_helper), 1e5) &&
                v2_2.allowance(address(this), address(_helper)) == 1e5 &&
                _helper.transferFrom(address(this), msg.sender, 1e5) &&
                v2_2.allowance(address(this), msg.sender) == 0 &&
                v2_2.balanceOf(msg.sender) == callerBal.add(2e5) &&
                v2_2.balanceOf(address(this)) == contractBal.sub(2e5),
            "V2_2Upgrader: approve/transferFrom test failed"
        );

        // Check that addresses that should be blacklisted are
        for (uint256 i = 0; i < _accountsToBlacklist.length; i++) {
            require(v2_2.isBlacklisted(_accountsToBlacklist[i]), "V2_2Upgrader: blacklist test failed");
        }

        // Transfer any remaining USDC to the caller
        withdrawUSDC();

        // Tear down
        _helper.tearDown();
        selfdestruct(msg.sender);
    }

    /**
     * @notice Withdraw any USDC in the contract
     */
    function withdrawUSDC() public onlyOwner {
        IERC20 usdc = IERC20(address(_proxy));
        uint256 balance = usdc.balanceOf(address(this));
        if (balance > 0) {
            require(
                usdc.transfer(msg.sender, balance),
                "V2_2Upgrader: failed to withdraw USDC"
            );
        }
    }

    /**
     * @notice Transfer proxy admin role to newProxyAdmin, and self-destruct
     */
    function abortUpgrade() external onlyOwner {
        // Transfer proxy admin role
        _proxy.changeAdmin(_newProxyAdmin);

        // Tear down
        _helper.tearDown();
        selfdestruct(msg.sender);
    }
}
