/**
 * Copyright 2025 Circle Internet Group, Inc. All rights reserved.
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
pragma experimental ABIEncoderV2; // needed for compiling older solc versions: https://github.com/foundry-rs/foundry/issues/4376

import "forge-std/Test.sol"; // solhint-disable no-global-import
import "../../../../contracts/test/Create2Factory.sol";
import "../../../../scripts/deploy/create2/AddressUtils.sol";

// solhint-disable func-name-mixedcase

contract AddressUtilsTest is Test {
    AddressUtils private addressUtils;
    address private factoryAddress;
    uint256 private chainId;
    string private tokenSymbol;

    function setUp() public {
        tokenSymbol = "USDC";
        addressUtils = new AddressUtils();
        factoryAddress = address(new Create2Factory());
        chainId = 31337;
    }

    function test_signatureCheckerSaltReturnsExpectedResult() public {
        bytes32 expectedSalt = keccak256(abi.encodePacked(chainId));
        bytes32 salt = addressUtils.signatureCheckerSalt(chainId);
        assertEq(salt, expectedSalt, "Salt for SignatureChecker is incorrect");
    }

    function test_proxySaltReturnsExpectedResult() public {
        bytes32 expectedSalt = keccak256(
            abi.encodePacked(chainId, tokenSymbol)
        );
        bytes32 salt = addressUtils.proxySalt(chainId, tokenSymbol);
        assertEq(salt, expectedSalt, "Salt for FiatTokenProxy is incorrect");
    }

    function test_implSaltReturnsExpectedResult() public {
        bytes32 expectedSalt = keccak256(abi.encodePacked(chainId));
        bytes32 salt = addressUtils.implSalt(chainId);
        assertEq(salt, expectedSalt, "Salt for FiatTokenV2_2 is incorrect");
    }

    function test_masterMinterSaltReturnsExpectedResult() public {
        bytes32 expectedSalt = keccak256(
            abi.encodePacked(chainId, tokenSymbol)
        );
        bytes32 salt = addressUtils.masterMinterSalt(chainId, tokenSymbol);
        assertEq(salt, expectedSalt, "Salt for MasterMinter is incorrect");
    }

    function test_signatureCheckerCreationCodeReturnsExpectedResult() public {
        bytes memory creationCode = addressUtils.signatureCheckerCreationCode();
        bytes memory expectedCode = type(SignatureChecker).creationCode;
        assertEq(
            keccak256(creationCode),
            keccak256(expectedCode),
            "Creation code for SignatureChecker is incorrect"
        );
    }

    function test_implCreationCodeReturnsExpectedResult() public {
        bytes memory creationCode = addressUtils.implCreationCode();
        bytes memory expectedCode = type(FiatTokenV2_2).creationCode;
        assertEq(
            keccak256(creationCode),
            keccak256(expectedCode),
            "Creation code for FiatTokenV2_2 is incorrect"
        );
    }

    function test_proxyCreationCodeReturnsExpectedResult() public {
        bytes memory creationCode = addressUtils.proxyCreationCode(
            factoryAddress
        );
        bytes memory expectedCode = abi.encodePacked(
            type(FiatTokenProxy).creationCode,
            abi.encode(factoryAddress)
        );
        assertEq(
            keccak256(creationCode),
            keccak256(expectedCode),
            "Creation code for FiatTokenProxy is incorrect"
        );
    }

    function test_masterMinterCreationCodeReturnsExpectedResult() public {
        bytes memory creationCode = addressUtils.masterMinterCreationCode(
            factoryAddress
        );
        bytes memory expectedCode = abi.encodePacked(
            type(MasterMinter).creationCode,
            abi.encode(factoryAddress)
        );
        assertEq(
            keccak256(creationCode),
            keccak256(expectedCode),
            "Creation code for MasterMinter is incorrect"
        );
    }

    function test_computeSignatureCheckerAddressReturnsExpectedResult() public {
        address expectedAddress = computeExpectedAddress(
            addressUtils.signatureCheckerSalt(chainId),
            keccak256(addressUtils.signatureCheckerCreationCode())
        );
        address computedAddress = addressUtils.computeSignatureCheckerAddress(
            chainId,
            factoryAddress
        );
        assertEq(
            computedAddress,
            expectedAddress,
            "Computed address for SignatureChecker is incorrect"
        );
    }

    function test_computeImplAddressReturnsExpectedResult() public {
        address expectedAddress = computeExpectedAddress(
            addressUtils.implSalt(chainId),
            keccak256(addressUtils.implCreationCode())
        );
        address computedAddress = addressUtils.computeImplAddress(
            chainId,
            factoryAddress
        );
        assertEq(
            computedAddress,
            expectedAddress,
            "Computed address for FiatTokenV2_2 is incorrect"
        );
    }

    function test_computeProxyAddressReturnsExpectedResult() public {
        bytes memory proxyCode = addressUtils.proxyCreationCode(factoryAddress);
        address expectedAddress = computeExpectedAddress(
            addressUtils.proxySalt(chainId, tokenSymbol),
            keccak256(proxyCode)
        );
        address computedAddress = addressUtils.computeProxyAddress(
            chainId,
            factoryAddress,
            tokenSymbol
        );
        assertEq(
            computedAddress,
            expectedAddress,
            "Computed address for FiatTokenProxy is incorrect"
        );
    }

    function test_computeMasterMinterAddressReturnsExpectedResult() public {
        bytes memory minterCode = addressUtils.masterMinterCreationCode(
            factoryAddress
        );
        address expectedAddress = computeExpectedAddress(
            addressUtils.masterMinterSalt(chainId, tokenSymbol),
            keccak256(minterCode)
        );
        address computedAddress = addressUtils.computeMasterMinterAddress(
            chainId,
            factoryAddress,
            tokenSymbol
        );
        assertEq(
            computedAddress,
            expectedAddress,
            "Computed address for MasterMinter is incorrect"
        );
    }

    function computeExpectedAddress(bytes32 salt, bytes32 bytecodeHash)
        internal
        view
        returns (address)
    {
        return
            address(
                uint160(
                    uint256(
                        keccak256(
                            abi.encodePacked(
                                bytes1(0xff),
                                factoryAddress,
                                salt,
                                bytecodeHash
                            )
                        )
                    )
                )
            );
    }
}
