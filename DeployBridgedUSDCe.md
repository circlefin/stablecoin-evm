# Configuration

- Add karak config in `truffle-config.js`
- Edit corresponding variables in config.js:
  - L1_TOKEN_ADDRESS (USDC on eth).
  - MNEMONIC, INFURA_KEY, PROXY_ADMIN_ADDRESS, OWNER_ADDRESS,
  - MASTERMINTER_OWNER_ADDRESS, PAUSER_ADDRESS, BLACKLISTER_ADDRESS
  - LOST_AND_FOUND_ADDRESS

## Deployment

- yarn truffle migrate --network karak
- forge script --private-keys <priv_keys> scripts/DeployUSDCe.s.sol --sig
  "run(address,address,uint256)" <proxyContractDeployed> <L2_BRIDGE_ADDRESS>
  <allowance> --broadcast --rpc-url <> //Deployer must be master minter
