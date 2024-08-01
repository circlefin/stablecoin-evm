// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import { IERC165 } from "@openzeppelin/contracts/introspection/IERC165.sol";

/**
 * @title IOptimismMintableERC20
 * @notice This interface is available on the OptimismMintableERC20 contract.
 *         We declare it as a separate interface so that it can be used in
 *         custom implementations of OptimismMintableERC20.
 * @notice From https://github.com/ethereum-optimism/optimism/blob/6b231760b3f352d5c4f6df8431b67d836f316f84/packages/contracts-bedrock/src/universal/IOptimismMintableERC20.sol#L10-L18
 */
interface IOptimismMintableERC20 is IERC165 {
    function remoteToken() external view returns (address);

    function bridge() external returns (address);

    function mint(address _to, uint256 _amount) external;

    function burn(address _from, uint256 _amount) external;
}

/**
 * @title IOptimismMintableFiatToken
 * @author Lattice (https://lattice.xyz)
 * @notice This interface adds the functions from IOptimismMintableERC20 missing from FiatTokenV2_2.
 *         It doesn't include `mint(address _to, uint256 _amount)`, as this function already exists
 *         on FiatTokenV2_2 (from FiatTokenV1), and can't be overridden. The only difference is a
 *         (bool) return type for the FiatTokenV1 version, which doesn't matter for consumers of
 *         IOptimismMintableERC20 that don't expect a return type.
 */
interface IOptimismMintableFiatToken is IERC165 {
    function remoteToken() external view returns (address);

    function bridge() external returns (address);

    function burn(address _from, uint256 _amount) external;
}
