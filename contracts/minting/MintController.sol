/**
* Copyright CENTRE SECZ 2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

pragma solidity ^0.4.24;

import "./Controller.sol";
import "./MinterManagementInterface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title MintController
 * @dev allows control of configure/remove minter by different addresses
 *
 */
contract MintController is Controller {
    using SafeMath for uint256;

    MinterManagementInterface public minterManager;

    event MinterManagerSet(
        address indexed _oldMinterManager,
        address indexed _newMinterManager
    );
    event MinterConfigured(
        address indexed _msgSender,
        address indexed _minter,
        uint256 _allowance
    );
    event MinterRemoved(
        address indexed _msgSender,
        address indexed _minter
    );
    event MinterAllowanceIncrement(
        address indexed _msgSender,
        address indexed _minter,
        uint256 _increment,
        uint256 _newAllowance
    );

    constructor(address _minterManager) public {
        minterManager = MinterManagementInterface(_minterManager);
    }

    // onlyOwner functions

    /**
     * @dev sets the minterManager
     */
    function setMinterManager(
        address _newMinterManager
    )
        public
        onlyOwner
        returns (bool)
    {
        emit MinterManagerSet(address(minterManager), _newMinterManager);
        minterManager = MinterManagementInterface(_newMinterManager);
        return true;
    }

    // onlyController functions

    /**
     * @dev remove the controller's minter.
     */
    function removeMinter() public onlyController returns (bool) {
        address minter = controllers[msg.sender];
        emit MinterRemoved(msg.sender, minter);
        return minterManager.removeMinter(minter);
    }

    /**
     * @dev Enables the minter and sets its allowance
     */
    function configureMinter(
        uint256 _newAllowance
    )
        public
        onlyController
        returns (bool)
    {
        address minter = controllers[msg.sender];
        emit MinterConfigured(msg.sender, minter, _newAllowance);
        return internal_setMinterAllowance(minter, _newAllowance);
    }

    /**
     * @dev Increases the minter allowance if and only if the minter is
     * currently active. The controller can safely send a signed
     * incrementMinterAllowance() transaction to a minter and not worry
     * about it being used to undo a removeMinter() transaction.
     */

    function incrementMinterAllowance(
        uint256 _allowanceIncrement
    )
        public
        onlyController
        returns (bool)
    {
        require(_allowanceIncrement > 0, "Allowance increment must be greater than 0");
        address minter = controllers[msg.sender];
        require(minterManager.isMinter(minter), 
            "Can only increment allowance for minters in minterManager");

        uint256 currentAllowance = minterManager.minterAllowance(minter);
        uint256 newAllowance = currentAllowance.add(_allowanceIncrement);

        emit MinterAllowanceIncrement(
            msg.sender,
            minter,
            _allowanceIncrement,
            newAllowance
        );

        return internal_setMinterAllowance(minter, newAllowance);
    }

   // Internal functions

    /**
     * @dev Uses the MinterManagementInterface to enable the minter and
     * set its allowance.
     */
    function internal_setMinterAllowance(
        address _minter,
        uint256 _newAllowance
    )
        internal
        returns (bool)
    {
        return minterManager.configureMinter(_minter, _newAllowance);
    }
}
