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

import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";
import { FiatTokenV2_2 } from "../FiatTokenV2_2.sol";
import { ICeloGasToken } from "../../interface/celo/ICeloGasToken.sol";

contract FiatTokenCeloV2_2 is FiatTokenV2_2, ICeloGasToken {
    using SafeMath for uint256;
    event FeeCallerChanged(address indexed newAddress);

    /**
     * @notice Constant containing the storage slot indicating the current fee caller of
     * `debitGasFees` and `creditGasFees`. Only the fee caller should be able to represent
     * this FiatToken during a gas lifecycle. This slot starts off indicating address(0)
     * as the allowed fee caller, as the storage slot is empty.
     */
    bytes32
        private constant FEE_CALLER_SLOT = 0xdca914aef3e4e19727959ebb1e70b58822e2c7b796d303902adc19513fcb4af5;

    /**
     * @notice Returns the current fee caller address allowed on `debitGasFees` and `creditGasFees`.
     */
    function feeCaller() public view returns (address value) {
        assembly {
            value := sload(FEE_CALLER_SLOT)
        }
    }

    modifier onlyFeeCaller() virtual {
        require(
            msg.sender == feeCaller(),
            "FiatTokenCeloV2_2: caller is not the fee caller"
        );
        _;
    }

    /**
     * @notice Updates the fee caller address.
     * @param _newFeeCaller The address of the new fee caller.
     */
    function updateFeeCaller(address _newFeeCaller) external onlyOwner {
        // Security fix: prevent setting address(0) which permanently breaks Celo gas lifecycle,
        // and emit an event to ensure off-chain auditability.
        require(_newFeeCaller != address(0), "FiatTokenCeloV2_2: zero fee caller");
        assembly {
            sstore(FEE_CALLER_SLOT, _newFeeCaller)
        }
        emit FeeCallerChanged(_newFeeCaller);
    }

    /**
     * @notice Constant containing the storage slot indicating the debited value currently
     * reserved for a transaction's gas paid in this token.
     */
    bytes32
        private constant DEBITED_VALUE_SLOT = 0xd90dccaa76fe7208f2f477143b6adabfeb5d4a5136982894dfc51177fa8eda28;

    function _debitedValue() internal view returns (uint256 value) {
        assembly {
            value := sload(DEBITED_VALUE_SLOT)
        }
    }

    constructor() public {
        assert(
            DEBITED_VALUE_SLOT == keccak256("com.circle.fiattoken.celo.debit")
        );
        assert(
            FEE_CALLER_SLOT == keccak256("com.circle.fiattoken.celo.feecaller")
        );
    }

    function debitGasFees(address from, uint256 value)
        external
        override
        onlyFeeCaller
        whenNotPaused
        notBlacklisted(from)
    {
        require(
            _debitedValue() == 0,
            "FiatTokenCeloV2_2: Must fully credit before debit"
        );
        require(from != address(0), "ERC20: transfer from the zero address");

        _transferReservedGas(from, address(0), value);
        assembly {
            sstore(DEBITED_VALUE_SLOT, value)
        }
    }

    function creditGasFees(
        address from,
        address feeRecipient,
        // solhint-disable-next-line no-unused-vars
        address gatewayFeeRecipient,
        address communityFund,
        uint256 refund,
        uint256 tipTxFee,
        // solhint-disable-next-line no-unused-vars
        uint256 gatewayFee,
        uint256 baseTxFee
    )
        external
        override
        onlyFeeCaller
        whenNotPaused
        notBlacklisted(from)
        notBlacklisted(feeRecipient)
        notBlacklisted(communityFund)
    {
        uint256 creditValue = refund.add(tipTxFee).add(baseTxFee);

        require(
            _debitedValue() == creditValue,
            "FiatTokenCeloV2_2: Either no debit or mismatched debit"
        );

        _transferReservedGas(address(0), from, creditValue);
        _transfer(from, feeRecipient, tipTxFee);
        _transfer(from, communityFund, baseTxFee);

        assembly {
            sstore(DEBITED_VALUE_SLOT, 0)
        }
    }

    function _transferReservedGas(
        address _from,
        address _to,
        uint256 _value
    ) internal {
        require(_value > 0, "FiatTokenCeloV2_2: Must reserve > 0 gas");
        require(
            _value <= _balanceOf(_from),
            "ERC20: transfer amount exceeds balance"
        );

        _setBalance(_from, _balanceOf(_from).sub(_value));
        _setBalance(_to, _balanceOf(_to).add(_value));
        emit Transfer(_from, _to, _value);
    }
}