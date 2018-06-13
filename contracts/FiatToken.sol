pragma solidity ^0.4.18;

import './../lib/openzeppelin/contracts/token/ERC20/ERC20.sol';
import './../lib/openzeppelin/contracts/math/SafeMath.sol';

import './PausableTokenByRole.sol';
import './BlacklistableTokenByRole.sol';
import './Upgradable.sol';
import './UpgradedContract.sol';

/**
 * @title FiatToken
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatToken is ERC20, PausableTokenByRole, BlacklistableTokenByRole, Upgradable {

    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint8 public decimals;
    string public currency;
    address public roleAddressChanger;
    address public masterMinter;

    event Mint(address indexed minter, address indexed to, uint256 amount);
    event Burn(address indexed burner, uint256 amount);
    event RoleAddressChange(string role, address indexed newAddress);
    event MinterConfigured(address minter, uint256 minterAllowedAmount);
    event MinterRemoved(address oldMinter);

    constructor(address _contractStorageAddress, string _name, string _symbol, string _currency, uint8 _decimals, address _masterMinter, address _pauser, address _blacklister, address _upgrader, address _roleAddressChanger) public {

        name = _name;
        symbol = _symbol;
        currency = _currency;
        decimals = _decimals;
        masterMinter = _masterMinter;
        pauser = _pauser;
        blacklister = _blacklister;
        upgrader = _upgrader;
        roleAddressChanger = _roleAddressChanger;

        if(_contractStorageAddress != address(0x0)) {
          contractStorage = EternalStorage(_contractStorageAddress);
        } else {
          contractStorage = new EternalStorage();
        } 
    }

    /**
     * @dev Throws if called by any account other than the roleAddressChanger
    */
    modifier onlyRoleAddressChanger() {
        require(msg.sender == roleAddressChanger);
        _;
    }

    /**
     * @dev Throws if called by any account other than a minter
    */
    modifier onlyMinters() {
        require(isMinter(msg.sender) == true);
        _;
    }

    /**
     * @dev Function to get address of data contract
    */
    function getDataContractAddress() external view returns (address) {
        return address(contractStorage);
    }

    /**
     * @dev Function to mint tokens
     * @param _amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) whenNotPaused onlyMinters notBlacklistedBoth(msg.sender, _to) public returns (bool) {
        require(_to != address(0));


        uint256 mintingAllowedAmount = getMinterAllowed(msg.sender);
        require(_amount <= mintingAllowedAmount);

        setTotalSupply(getTotalSupply().add(_amount));
        setBalance(_to, getBalance(_to).add(_amount));
        setMinterAllowed(msg.sender, mintingAllowedAmount.sub(_amount));
        emit Mint(msg.sender, _to, _amount);
        return true;
    }

    /**
     * @dev Throws if called by any account other than the masterMinter
    */
    modifier onlyMasterMinter() {
        require(msg.sender == masterMinter);
        _;
    }

    /**
     * @dev Function to get minter allowance
     * @param minter The address of the minter
    */
    function minterAllowance(address minter) public view returns (uint256) {
        return getMinterAllowed(minter);
    }

    /**
     * @dev Get allowed amount for an account
     * @param owner address The account owner
     * @param spender address The account spender
    */
    function allowance(address owner, address spender) public view returns (uint256) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).allowance(owner, spender);
        }
        return getAllowed(owner, spender);
    }

    /**
     * @dev Get totalSupply of token
    */
    function totalSupply() public view returns (uint256) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).totalSupply();
        }
        return getTotalSupply();
    }

    /**
     * @dev Get token balance of an account
     * @param account address The account
    */
    function balanceOf(address account) public view returns (uint256) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).balanceOf(account);
        }
        return getBalance(account);
    }

    /**
     * @dev Adds blacklisted check to approve
     * @return True if the operation was successful.
    */
    function approve(address _spender, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _spender) public returns (bool) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).approveViaPriorContract(msg.sender, _spender, _value);
        }

        setAllowed(msg.sender, _spender, _value);
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another.
     * Validates that the totalAmount <= the allowed amount for the sender on the from account.
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @return bool success
    */
    function transferFrom(address _from, address _to, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _from) public returns (bool) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).transferFromViaPriorContract(msg.sender, _from, _to, _value);
        }

        require(isBlacklisted(_to) == false);

        uint256 allowed;
        allowed = getAllowed(_from, msg.sender);

        require(_value <= allowed);

        doTransfer(_from, _to, _value);
        setAllowed(_from, msg.sender, allowed.sub(_value));
        return true;
    }

    /**
     * @dev transfer token for a specified address
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @return bool success
    */
    function transfer(address _to, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _to) public returns (bool) {
        if (isUpgraded()) {
            return UpgradedContract(upgradedAddress).transferViaPriorContract(msg.sender, _to, _value);
        }

        doTransfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev updates balances for sender, recipient.
     * Validates that _to address exists, totalAmount <= balance of the from account.
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
    */
    function doTransfer(address _from, address _to, uint256 _value) private {
        require(_to != address(0));

        uint256 balance;
        uint256 toBalance;

        (balance, toBalance) = getBalances(_from, _to);

        require(_value <= balance);

        // SafeMath.sub will throw if there is not enough balance.
        setBalances(_from, balance.sub(_value), _to, toBalance.add(_value));
        emit Transfer(_from, _to, _value);
    }

    /**
     * @dev Function to check if an account is a minter
     * @param account The address of the account
    */
    function isAccountMinter(address account) public view returns (bool) {
        return isMinter(account);
    }

    /**
     * @dev Function to add/update a new minter
     * @param minter The address of the minter
     * @param minterAllowedAmount The minting amount allowed for the minter
     * @return True if the operation was successful.
    */
    function configureMinter(address minter, uint256 minterAllowedAmount) whenNotPaused onlyMasterMinter public returns (bool) {
        setMinter(minter, true);
        setMinterAllowed(minter, minterAllowedAmount);
        emit MinterConfigured(minter, minterAllowedAmount);
        return true;
    }

    /**
     * @dev Function to remove a minter
     * @param minter The address of the minter to remove
     * @return True if the operation was successful.
    */
    function removeMinter(address minter) onlyMasterMinter public returns (bool) {
        setMinter(minter, false);
        setMinterAllowed(minter, 0);
        emit MinterRemoved(minter);
        return true;
    }

    /**
     * @dev allows a minter to burn some of its own tokens
     * Validates that caller is a minter and that sender is not blacklisted
     * amount is less than or equal to the minter's account balance
     * @param _amount uint256 the amount of tokens to be burned
    */
    function burn(uint256 _amount) whenNotPaused onlyMinters notBlacklisted(msg.sender) public {
        uint256 balance = getBalance(msg.sender);
        require(balance >= _amount);

        setTotalSupply(getTotalSupply().sub(_amount));
        setBalance(msg.sender, balance.sub(_amount));
        emit Burn(msg.sender, _amount);
    }

    /**
     * @dev updates the upgrader address
     * Validates that caller is the upgrader
     * @param _newAddress address The new upgrader address
    */
    function updateUpgraderAddress(address _newAddress) onlyUpgrader public {
        upgrader = _newAddress;
        emit RoleAddressChange('upgrader', _newAddress);
    }

    /**
     * @dev updates a role's address with the roleAddressChanger
     * Validates that caller is the roleAddressChanger
     * @param _newAddress address The new role address
     * @param _role string The role to update
    */
    function updateRoleAddress(address _newAddress, string _role) onlyRoleAddressChanger public {
        bytes32 roleHash = keccak256(_role);
        if (roleHash == keccak256('masterMinter')) {
            masterMinter = _newAddress;
            emit RoleAddressChange(_role, _newAddress);
        }
        if (roleHash == keccak256('blacklister')) {
            blacklister = _newAddress;
            emit RoleAddressChange(_role, _newAddress);
        }
        if (roleHash == keccak256('pauser')) {
            pauser = _newAddress;
            emit RoleAddressChange(_role, _newAddress);
        }
        if (roleHash == keccak256('roleAddressChanger')) {
            roleAddressChanger = _newAddress;
            emit RoleAddressChange(_role, _newAddress);
        }
    }

}
