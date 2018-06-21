pragma solidity ^0.4.23;

import './thirdparty/openzeppelin/ERC20.sol';
import './thirdparty/openzeppelin/SafeMath.sol';
import './thirdparty/openzeppelin/Ownable.sol';
import './thirdparty/openzeppelin/Pausable.sol';

import './BlacklistableTokenByRole.sol';
import './Upgradable.sol';
import './UpgradedContract.sol';

/**
 * @title FiatToken
 * @dev ERC20 Token backed by fiat reserves
 */
contract FiatToken is Ownable, ERC20, Pausable, BlacklistableTokenByRole, Upgradable {event __CoverageFiatToken(string fileName, uint256 lineNumber);
event __FunctionCoverageFiatToken(string fileName, uint256 fnId);
event __StatementCoverageFiatToken(string fileName, uint256 statementId);
event __BranchCoverageFiatToken(string fileName, uint256 branchId, uint256 locationIdx);
event __AssertPreCoverageFiatToken(string fileName, uint256 branchId);
event __AssertPostCoverageFiatToken(string fileName, uint256 branchId);

    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint8 public decimals;
    string public currency;
    address public masterMinter;

    event Mint(address indexed minter, address indexed to, uint256 amount);
    event Burn(address indexed burner, uint256 amount);
    event MinterConfigured(address minter, uint256 minterAllowedAmount);
    event MinterRemoved(address oldMinter);
    event MasterMinterChanged(address newMasterMinter);

    constructor(
        address _contractStorageAddress,
        string _name,
        string _symbol,
        string _currency,
        uint8 _decimals,
        address _masterMinter,
        address _pauser,
        address _blacklister,
        address _upgrader,
        address _owner
    )
        EternalStorageUpdater(_contractStorageAddress)
        Pausable(_pauser)
        BlacklistableTokenByRole(_blacklister)
        Upgradable(_upgrader)
        public
    {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',1);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',50);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',1);
name = _name;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',51);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',2);
symbol = _symbol;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',52);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',3);
currency = _currency;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',53);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',4);
decimals = _decimals;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',54);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',5);
masterMinter = _masterMinter;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',55);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',6);
transferOwnership(_owner);
    }

    /**
     * @dev Throws if called by any account other than a minter
    */
    modifier onlyMinters() {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',2);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',62);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',1);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',7);
require(isMinter(msg.sender) == true);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',1);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',63);
        _;
    }

    /**
     * @dev Function to get address of data contract
    */
    function getDataContractAddress() external  returns (address) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',3);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',70);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',8);
return address(contractStorage);
    }

    /**
     * @dev Function to mint tokens
     * @param _amount The amount of tokens to mint.
     * @return A boolean that indicates if the operation was successful.
    */
    function mint(address _to, uint256 _amount) whenNotPaused onlyMinters notBlacklistedBoth(msg.sender, _to) public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',4);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',79);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',2);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',9);
require(_to != address(0));emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',2);



emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',82);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',10);
uint256 mintingAllowedAmount = getMinterAllowed(msg.sender);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',83);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',3);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',11);
require(_amount <= mintingAllowedAmount);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',3);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',85);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',12);
setTotalSupply(getTotalSupply().add(_amount));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',86);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',13);
setBalance(_to, getBalance(_to).add(_amount));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',87);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',14);
setMinterAllowed(msg.sender, mintingAllowedAmount.sub(_amount));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',88);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',15);
emit Mint(msg.sender, _to, _amount);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',89);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',16);
return true;
    }

    /**
     * @dev Throws if called by any account other than the masterMinter
    */
    modifier onlyMasterMinter() {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',5);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',96);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',4);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',17);
require(msg.sender == masterMinter);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',4);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',97);
        _;
    }

    /**
     * @dev Function to get minter allowance
     * @param minter The address of the minter
    */
    function minterAllowance(address minter) public  returns (uint256) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',6);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',105);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',18);
return getMinterAllowed(minter);
    }

    /**
     * @dev Get allowed amount for an account
     * @param owner address The account owner
     * @param spender address The account spender
    */
    function allowance(address owner, address spender) public  returns (uint256) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',7);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',114);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',19);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',5,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',115);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',20);
return UpgradedContract(upgradedAddress).allowance(owner, spender);
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',5,1);}

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',117);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',21);
return getAllowed(owner, spender);
    }

    /**
     * @dev Get totalSupply of token
    */
    function totalSupply() public  returns (uint256) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',8);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',124);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',22);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',6,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',125);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',23);
return UpgradedContract(upgradedAddress).totalSupply();
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',6,1);}

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',127);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',24);
return getTotalSupply();
    }

    /**
     * @dev Get token balance of an account
     * @param account address The account
    */
    function balanceOf(address account) public  returns (uint256) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',9);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',135);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',25);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',7,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',136);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',26);
return UpgradedContract(upgradedAddress).balanceOf(account);
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',7,1);}

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',138);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',27);
return getBalance(account);
    }

    /**
     * @dev Adds blacklisted check to approve
     * @return True if the operation was successful.
    */
    function approve(address _spender, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _spender) public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',10);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',146);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',28);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',8,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',147);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',29);
return UpgradedContract(upgradedAddress).approveViaPriorContract(msg.sender, _spender, _value);
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',8,1);}


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',150);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',30);
setAllowed(msg.sender, _spender, _value);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',151);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',31);
emit Approval(msg.sender, _spender, _value);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',152);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',32);
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
    function transferFrom(address _from, address _to, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _from) public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',11);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',164);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',33);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',9,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',165);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',34);
return UpgradedContract(upgradedAddress).transferFromViaPriorContract(msg.sender, _from, _to, _value);
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',9,1);}


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',168);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',10);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',35);
require(isBlacklisted(_to) == false);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',10);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',170);
        uint256 allowed;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',171);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',36);
allowed = getAllowed(_from, msg.sender);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',173);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',11);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',37);
require(_value <= allowed);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',11);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',175);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',38);
setAllowed(_from, msg.sender, allowed.sub(_value));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',176);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',39);
doTransfer(_from, _to, _value);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',177);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',40);
return true;
    }

    /**
     * @dev transfer token for a specified address
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @return bool success
    */
    function transfer(address _to, uint256 _value) whenNotPaused notBlacklistedBoth(msg.sender, _to) public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',12);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',187);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',41);
if (isUpgraded()) {emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',12,0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',188);
            emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',42);
return UpgradedContract(upgradedAddress).transferViaPriorContract(msg.sender, _to, _value);
        }else { emit __BranchCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',12,1);}


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',191);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',43);
doTransfer(msg.sender, _to, _value);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',192);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',44);
return true;
    }

    /**
     * @dev updates balances for sender, recipient.
     * Validates that _to address exists, totalAmount <= balance of the from account.
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
    */
    function doTransfer(address _from, address _to, uint256 _value) private {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',13);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',203);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',13);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',45);
require(_to != address(0));emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',13);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',205);
        uint256 balance;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',206);
        uint256 toBalance;

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',208);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',46);
(balance, toBalance) = getBalances(_from, _to);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',210);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',14);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',47);
require(_value <= balance);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',14);


        // SafeMath.sub will throw if there is not enough balance.
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',213);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',48);
setBalances(_from, balance.sub(_value), _to, toBalance.add(_value));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',214);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',49);
emit Transfer(_from, _to, _value);
    }

    /**
     * @dev Function to check if an account is a minter
     * @param account The address of the account
    */
    function isAccountMinter(address account) public  returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',14);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',222);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',50);
return isMinter(account);
    }

    /**
     * @dev Function to add/update a new minter
     * @param minter The address of the minter
     * @param minterAllowedAmount The minting amount allowed for the minter
     * @return True if the operation was successful.
    */
    function configureMinter(address minter, uint256 minterAllowedAmount) whenNotPaused onlyMasterMinter public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',15);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',232);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',51);
setMinter(minter, true);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',233);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',52);
setMinterAllowed(minter, minterAllowedAmount);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',234);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',53);
emit MinterConfigured(minter, minterAllowedAmount);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',235);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',54);
return true;
    }

    /**
     * @dev Function to remove a minter
     * @param minter The address of the minter to remove
     * @return True if the operation was successful.
    */
    function removeMinter(address minter) onlyMasterMinter public returns (bool) {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',16);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',244);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',55);
setMinter(minter, false);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',245);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',56);
setMinterAllowed(minter, 0);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',246);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',57);
emit MinterRemoved(minter);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',247);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',58);
return true;
    }

    /**
     * @dev allows a minter to burn some of its own tokens
     * Validates that caller is a minter and that sender is not blacklisted
     * amount is less than or equal to the minter's account balance
     * @param _amount uint256 the amount of tokens to be burned
    */
    function burn(uint256 _amount) whenNotPaused onlyMinters notBlacklisted(msg.sender) public {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',17);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',257);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',59);
uint256 balance = getBalance(msg.sender);
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',258);
        emit __AssertPreCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',15);
emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',60);
require(balance >= _amount);emit __AssertPostCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',15);


emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',260);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',61);
setTotalSupply(getTotalSupply().sub(_amount));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',261);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',62);
setBalance(msg.sender, balance.sub(_amount));
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',262);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',63);
emit Burn(msg.sender, _amount);
    }

    function updateMasterMinter(address _newMasterMinter) onlyOwner public {emit __FunctionCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',18);

emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',266);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',64);
masterMinter = _newMasterMinter;
emit __CoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',267);
        emit __StatementCoverageFiatToken('/Users/alecschaefer/Documents/GitHub/centre-tokens/contracts/FiatToken.sol',65);
emit MasterMinterChanged(masterMinter);
    }
}
