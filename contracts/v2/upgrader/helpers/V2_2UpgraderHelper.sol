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

import { FiatTokenV2_1 } from "../../../v2/FiatTokenV2_1.sol";
import { V2UpgraderHelper } from "./V2UpgraderHelper.sol";

/**
 * @title V2.2 Upgrader Helper
 * @dev Enables V2_2Upgrader to read some contract state before it renounces the
 * proxy admin role. (Proxy admins cannot call delegated methods). It is also
 * used to test approve/transferFrom.
 */
contract V2_2UpgraderHelper is V2UpgraderHelper {
    /**
     * @notice Constructor
     * @param fiatTokenProxy    Address of the FiatTokenProxy contract
     */
    constructor(address fiatTokenProxy)
        public
        V2UpgraderHelper(fiatTokenProxy)
    {}

    /**
     * @notice Call version()
     * @return version
     */
    function version() external view returns (string memory) {
        return FiatTokenV2_1(_proxy).version();
    }

    /**
     * @notice Call DOMAIN_SEPARATOR()
     * @return domainSeparator
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return FiatTokenV2_1(_proxy).DOMAIN_SEPARATOR();
    }

    /**
     * @notice Call rescuer()
     * @return rescuer
     */
    function rescuer() external view returns (address) {
        return FiatTokenV2_1(_proxy).rescuer();
    }

    /**
     * @notice Call paused()
     * @return paused
     */
    function paused() external view returns (bool) {
        return FiatTokenV2_1(_proxy).paused();
    }

    /**
     * @notice Call totalSupply()
     * @return totalSupply
     */
    function totalSupply() external view returns (uint256) {
        return FiatTokenV2_1(_proxy).totalSupply();
    }
}
