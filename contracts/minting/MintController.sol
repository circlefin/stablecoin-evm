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
 * @dev Implementation of the abstract Controller contract, in which
 * the workers represent minters. A controller can manage many
 * minters, and all controllers are managed by a single owner.
 */
contract MintController is Controller {
    using SafeMath for uint256;

    /**
    * @title MinterManagementInterface
    * @dev Interface for managing the allowances of minters.
    */
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

    /**
     * @dev Initializes the minterManager.
     * @param _minterManager The address of the minterManager contract.
     */
    constructor(address _minterManager) public {
        minterManager = MinterManagementInterface(_minterManager);
    }

    // onlyOwner functions

    /**
     * @dev Sets the minterManager.
     * @param _newMinterManager The address of the new minterManager contract.
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
     * @dev Removes the controller's own minter.
     */
    function removeMinter() onlyController public returns (bool) {
        address minter = controllers[msg.sender];
        emit MinterRemoved(msg.sender, minter);
        return minterManager.removeMinter(minter);
    }

    /**
     * @dev Enables the minter and sets its allowance.
     * @param newAllowance New allowance to be set for minter.
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
     * @dev Increases the minter's allowance if and only if the minter is
     * an active minter in minterManager. An active minter is defined as a 
     * minter where minterManager.isMinter(minter) returns true.
     * @param _allowanceIncrement Amount to increase the minter allowance by.
     */
    function incrementMinterAllowance(
        uint256 _allowanceIncrement
    )
        public
        onlyController
        returns (bool)
    {
        require(_allowanceIncrement > 0, 
            "Allowance increment must be greater than 0.");
        address minter = controllers[msg.sender];
        require(minterManager.isMinter(minter), 
            "Can only increment allowance for minters in minterManager.");

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
     * @param minter Minter to set new allowance of.
     * @param newAllowance New allowance to be set for minter.
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
