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

import "../Ownable.sol";

/**
 * @title Controller
 * @dev Generic implementation of the owner-controller-worker model.
 *
 */
contract Controller is Ownable {
    // controllers[controller] = worker
    // The controller manages a single worker address.
    mapping(address => address) public controllers;

    event ControllerConfigured(
        address indexed _controller,
        address indexed _worker
    );
    event ControllerRemoved(address indexed _controller);

    /**
     * @dev ensure that caller is the controller of a non-zero worker address
     */
    modifier onlyController() {
        require(controllers[msg.sender] != address(0), "The value of controller[msg.sender] must be non-zero.");
        _;
    }

    constructor() public {
    }

    // onlyOwner functions

    /**
     * @dev set the controller of a particular _worker.
     * Argument _worker must not be 0x00. Call removeController(_controller)
     * instead to disable the controller.
     */
    function configureController(
        address _controller,
        address _worker
    )
        public 
        onlyOwner 
        returns (bool)
    {
        require(_worker != address(0), "Worker must be a non-zero address.");
        controllers[_controller] = _worker;
        emit ControllerConfigured(_controller, _worker);
        return true;
    }

    /**
     * @dev disables a controller by setting its worker to address(0);
     */
    function removeController(
        address _controller
    )
        public 
        onlyOwner 
        returns (bool)
    {
        controllers[_controller] = address(0);
        emit ControllerRemoved(_controller);
        return true;
    }
}
