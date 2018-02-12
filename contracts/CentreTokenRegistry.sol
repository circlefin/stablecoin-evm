pragma solidity ^0.4.11;

import './../lib/openzeppelin/contracts/ownership/Ownable.sol';

/**
 * @title Centre Token Registry
 * @dev Registry to store addresses and details of Centre-Approved tokens
 */
contract CentreTokenRegistry is Ownable {

    string constant public contract_version = "0.1._";

    struct TokenInfo {
        string approvedDate; // Example, "7-4-2018"
        string latestAuditDate; 
        bytes32 latestAuditHash;
        bool isValid;       // trick to check if struct exists, "null" doesn't exist
    }

    mapping(address => TokenInfo) public registry; 

    event TokenAdded(address token_address);
    event TokenRemoved(address token_address);
    event TokenUpdated(address token_address);

    modifier doesExist(address _address) {
        require(registry[_address].isValid == true);
        _;
    }

    modifier doesNotExist(address _address) {
        require(registry[_address].isValid != true);
        _;
    }

    /**
    * @dev Function to add a token to the registry
    * @param token_address The address of the token.
    * @param approvedDate The date of the Centre approval. 
    * @param latestAuditDate The date of the latest Centre audit.
    * @param latestAuditHash The hash of the latest Centre audit document.
    * @return the address of the added token
    */
    function addToken(address token_address, string approvedDate, string latestAuditDate, bytes32 latestAuditHash) 
        doesNotExist(token_address)
        onlyOwner
        public
        returns (address)
    {
        registry[token_address] = TokenInfo(approvedDate, latestAuditDate, latestAuditHash, true);
        TokenAdded(token_address);

        return token_address;
    }

    /**
    * @dev Function to remove a token from the registry
    * @param token_address The address of the token.
    * @return the address of the removed token
    */
    function removeToken(address token_address) 
        doesExist(token_address)
        onlyOwner
        public
        returns (address)
    {
        delete registry[token_address];
        TokenRemoved(token_address);

        return token_address;
    }

    /**
    * @dev Function to update the audit information of a token
    * @param token_address The address of the token.
    * @param latestAuditDate The date of the latest Centre audit.
    * @param latestAuditHash The hash of the latest Centre audit document.
    * @return the address of the added token
    */
    function updateAudit(address token_address, string latestAuditDate, bytes32 latestAuditHash) 
        doesExist(token_address)
        onlyOwner
        public
        returns (address)
    {
        registry[token_address].latestAuditDate = latestAuditDate;
        registry[token_address].latestAuditHash = latestAuditHash;  

        TokenUpdated(token_address);

        return token_address;
    }

    /**
    * @dev Function to correct the approvedDate of a token
    * @param token_address The address of the token.
    * @param approvedDate The date of the Centre approval. 
    * @return the address of the added token
    */
    function correctApprovedDate(address token_address, string approvedDate) 
        doesExist(token_address)
        onlyOwner
        public
        returns (address)
    {
        registry[token_address].approvedDate = approvedDate;
        
        TokenUpdated(token_address);

        return token_address;
    }

}
