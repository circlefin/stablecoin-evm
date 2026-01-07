# Solidity style notes

Small conventions that help keep reviews consistent.

## Naming

- events: `PascalCase`
- errors: `PascalCase`
- internal/private vars: `_camelCase`
- constants: `UPPER_SNAKE_CASE`

## Layout

- group storage variables by concern
- prefer custom errors over long revert strings
- keep external functions near the top of the contract

## Safety

- validate inputs early
- minimize external calls
- document any non-obvious invariants with comments
