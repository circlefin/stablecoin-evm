# Exception handling in Solidity

The stablecoin contracts use custom errors and revert messages to signal failures.

## Custom errors

Contracts define custom errors (e.g. `Unauthorized(address sender)`) to save gas and provide context. These are emitted with the `revert` statement.

## require vs. revert

- `require(condition, "message")` is used for simple validations.
- `revert CustomError(args)` is used when more context is needed.

## Frontend integration

Your UI should decode revert reasons and display user‑friendly messages. Avoid exposing raw revert strings directly to end users.

Document new custom errors here when adding them to contracts.
