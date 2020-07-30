/**
 * SPDX-License-Identifier: MIT
 *
 * Copyright (c) 2018-2020 CENTRE SECZ
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

import { FiatTokenV1 } from "../../v1/FiatTokenV1.sol";
import { Ownable } from "../../v1/Ownable.sol";

/**
 * @title V2 Upgrader Helper
 * @dev Enables V2Upgrader to read some contract state before it renounces the
 * proxy admin role. (Proxy admins cannot call delegated methods.) It is also
 * used to test approve/transferFrom.
 */
contract V2UpgraderHelper is Ownable {
    address private _proxy;

    /**
     * @notice Constructor
     * @param fiatTokenProxy    Address of the FiatTokenProxy contract
     */
    constructor(address fiatTokenProxy) public Ownable() {
        _proxy = fiatTokenProxy;
    }

    /**
     * @notice The address of the FiatTokenProxy contract
     * @return Contract address
     */
    function proxy() external view returns (address) {
        return address(_proxy);
    }

    /**
     * @notice Call name()
     * @return name
     */
    function name() external view returns (string memory) {
        return FiatTokenV1(_proxy).name();
    }

    /**
     * @notice Call symbol()
     * @return symbol
     */
    function symbol() external view returns (string memory) {
        return FiatTokenV1(_proxy).symbol();
    }

    /**
     * @notice Call decimals()
     * @return decimals
     */
    function decimals() external view returns (uint8) {
        return FiatTokenV1(_proxy).decimals();
    }

    /**
     * @notice Call currency()
     * @return currency
     */
    function currency() external view returns (string memory) {
        return FiatTokenV1(_proxy).currency();
    }

    /**
     * @notice Call masterMinter()
     * @return masterMinter
     */
    function masterMinter() external view returns (address) {
        return FiatTokenV1(_proxy).masterMinter();
    }

    /**
     * @notice Call owner()
     * @dev Renamed to fiatTokenOwner due to the existence of Ownable.owner()
     * @return owner
     */
    function fiatTokenOwner() external view returns (address) {
        return FiatTokenV1(_proxy).owner();
    }

    /**
     * @notice Call pauser()
     * @return pauser
     */
    function pauser() external view returns (address) {
        return FiatTokenV1(_proxy).pauser();
    }

    /**
     * @notice Call blacklister()
     * @return blacklister
     */
    function blacklister() external view returns (address) {
        return FiatTokenV1(_proxy).blacklister();
    }

    /**
     * @notice Call balanceOf(address)
     * @param account   Account
     * @return balance
     */
    function balanceOf(address account) external view returns (uint256) {
        return FiatTokenV1(_proxy).balanceOf(account);
    }

    /**
     * @notice Call transferFrom(address,address,uint256)
     * @param from     Sender
     * @param to       Recipient
     * @param value    Amount
     * @return result
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        return FiatTokenV1(_proxy).transferFrom(from, to, value);
    }

    /**
     * @notice Tear down the contract (self-destruct)
     */
    function tearDown() external onlyOwner {
        selfdestruct(msg.sender);
    }
}
