/**
 * Copyright 2024 Circle Internet Group, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

pragma solidity 0.6.12;

import { FiatTokenV2_2 } from "../../../v2/FiatTokenV2_2.sol";
import {
    V2_2UpgraderHelper
} from "../../../v2/upgrader/helpers/V2_2UpgraderHelper.sol";

/**
 * @title V3 Upgrader Helper
 * @dev Enables V3Upgrader to read some contract state before it renounces the
 * proxy admin role. (Proxy admins cannot call delegated methods). It is also
 * used to test approve/transferFrom.
 * @dev V3UpgraderHelper inherits all necessary methods from V2_2UpgraderHelper
 * including symbol(), version(), DOMAIN_SEPARATOR(), rescuer(), paused(), and totalSupply().
 */
contract V3UpgraderHelper is V2_2UpgraderHelper {
    /**
     * @notice Constructor
     * @param fiatTokenProxy    Address of the FiatTokenProxy contract
     */
    constructor(address fiatTokenProxy)
        public
        V2_2UpgraderHelper(fiatTokenProxy)
    {}
}
