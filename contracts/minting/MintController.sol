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
 * @notice The MintController contract manages minters for a contract that 
 * implements the MinterManagerInterface. It lets the owner designate certain 
 * addresses as controllers, and these controllers then manage the 
 * minters by adding and removing minters, as well as modifying their minting 
 * allowance. A controller may manage exactly one minter, but the same minter 
 * address may be managed by multiple controllers.
 * @dev MintController inherits from the Controller contract. It treats the 
 * Controller workers as minters.
 */
contract MintController is Controller {
    using SafeMath for uint256;

    /**
    * @title MinterManagementInterface
    * @notice MintController calls the minterManager to execute/record minter 
    * management tasks, as well as to query the status of a minter address.
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
     * @notice Initializes the minterManager.
     * @param _minterManager The address of the minterManager contract.
     */
    constructor(address _minterManager) public {
        minterManager = MinterManagementInterface(_minterManager);
    }

    // onlyOwner functions

    /**
     * @notice Sets the minterManager.
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
     * @notice Removes the controller's own minter.
     */
    function removeMinter() onlyController public returns (bool) {
        address minter = controllers[msg.sender];
        emit MinterRemoved(msg.sender, minter);
        return minterManager.removeMinter(minter);
    }

    /**
     * @notice Enables the minter and sets its allowance.
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
     * @notice Increases the minter's allowance if and only if the minter is an 
     * active minter.
     * @dev An minter is considered active if minterManager.isMinter(minter) 
     * returns true.
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
