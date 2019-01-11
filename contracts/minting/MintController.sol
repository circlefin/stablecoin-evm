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
        address indexed oldMinterManager,
        address indexed newMinterManager
    );
    event MinterConfigured(
        address indexed msgSender,
        address indexed minter,
        uint256 allowance
    );
    event MinterRemoved(
        address indexed msgSender,
        address indexed minter
    );
    event MinterAllowanceIncrement(
        address indexed msgSender,
        address indexed minter,
        uint256 increment,
        uint256 newAllowance
    );

    event MinterAllowanceDecrement(
        address indexed msgSender,
        address indexed minter,
        uint256 decrement,
        uint256 newAllowance
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
    function removeMinter() onlyController public returns (bool) {
        address minter = controllers[msg.sender];
        emit MinterRemoved(msg.sender, minter);
        return minterManager.removeMinter(minter);
    }

    /**
     * @dev Enables the minter and sets its allowance
     */
    function configureMinter(
        uint256 newAllowance
    )
        public
        onlyController
        returns (bool)
    {
        address minter = controllers[msg.sender];
        emit MinterConfigured(msg.sender, minter, newAllowance);
        return internal_setMinterAllowance(minter, newAllowance);
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
        require(_allowanceIncrement > 0, "Allowance increment must be greater than 0.");
        address minter = controllers[msg.sender];
        require(minterManager.isMinter(minter), "Can only increment allowance for minters in minterManager.");

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

    /**
     * @dev decreases the minter allowance if and only if the minter is
     * currently active. The controller can safely send a signed decrementMinterAllowance()
     * transaction to a minter and not worry about it being used to undo a removeMinter()
     * transaction.
     */
    function decrementMinterAllowance(uint256 _allowanceDecrement) onlyController public returns (bool) {
        address minter = controllers[msg.sender];
        require(minterManager.isMinter(minter));
        require(_allowanceDecrement > 0);

        uint256 currentAllowance = minterManager.minterAllowance(minter);
        uint256 newAllowance = (currentAllowance > _allowanceDecrement ? currentAllowance : _allowanceDecrement).sub(_allowanceDecrement);

        emit MinterAllowanceDecrement(msg.sender, minter, _allowanceDecrement, newAllowance);
        return internal_setMinterAllowance(minter, newAllowance);
    }

   // Internal functions

    /**
     * @dev Uses the MinterManagementInterface to enable the minter and
     * set its allowance.
     */
    function internal_setMinterAllowance(
        address minter,
        uint256 newAllowance
    )
        internal
        returns (bool)
    {
        return minterManager.configureMinter(minter, newAllowance);
    }
}
