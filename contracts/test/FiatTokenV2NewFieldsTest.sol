/**
* Copyright CENTRE SECZ 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is furnished to
* do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

pragma solidity ^0.4.24;

import './../FiatTokenV1.sol';

/**
 * @title FiatTokenV2NewFieldsTest
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatTokenV2NewFieldsTest is FiatTokenV1 {

    bool public newBool;
    address public newAddress;
    uint256 public newUint;
    bool internal initializedV2;

    function initialize(
      string _name,
      string _symbol,
      string _currency,
      uint8 _decimals,
      address _masterMinter,
      address _pauser,
      address _blacklister,
      address _owner,
      bool _newBool,
      address _newAddress,
      uint256 _newUint
    ) public {
        super.initialize(_name, _symbol, _currency, _decimals, _masterMinter, _pauser, _blacklister, _owner);
        initV2(_newBool, _newAddress, _newUint);
    }

    function initV2(bool _newBool, address _newAddress, uint256 _newUint) public {
      require(!initializedV2);
      newBool = _newBool;
      newAddress = _newAddress;
      newUint = _newUint;
      initializedV2 = true;
    }


}
