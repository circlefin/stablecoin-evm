include .env
export

# fill the rpc url and etherscan api key
# !need to  test the scripts and fix them on the next deployment
d:
	forge script scripts/deploy/deploy-fiat-token.s.sol --gas-estimate-multiplier $(GAS_MULTIPLIER) --rpc-url $(RPC_URL) -vvv

deploy-verify:
	forge script scripts/deploy/deploy-fiat-token.s.sol -vv --gas-estimate-multiplier $(GAS_MULTIPLIER) --rpc-url $(RPC_URL) --etherscan-api-key $(ETHERSCAN_KEY) --verifier $(VERIFIER) --verify --verifier-url $(VERIFIER_URL) --broadcast --slow

deploy:
	forge script scripts/deploy/deploy-fiat-token.s.sol -vvvv --gas-estimate-multiplier $(GAS_MULTIPLIER) --rpc-url $(RPC_URL) --broadcast --slow

gen:
	cat artifacts/foundry/SignatureChecker.sol/SignatureChecker.json | jq -jr '.rawMetadata' > verification_artifacts/SignatureChecker.json
	cat artifacts/foundry/FiatTokenProxy.sol/FiatTokenProxy.json | jq -jr '.rawMetadata' > verification_artifacts/FiatTokenProxy.json
	cat artifacts/foundry/FiatTokenV2_2.sol/FiatTokenV2_2.json | jq -jr '.rawMetadata' > verification_artifacts/FiatTokenV2_2.json

