# Environment File Safety Notes

This project uses an `.env` file for local deployment and scripts.

## Keep placeholders empty
These should remain empty in templates and examples:
- `DEPLOYER_PRIVATE_KEY=`
- any production keys or credentials

## Required fields (local runs)
Fill these for local/test usage:
- `PROXY_ADMIN_ADDRESS=...`
- `OWNER_ADDRESS=...`
- `MASTER_MINTER_OWNER_ADDRESS=...`

## Recommended workflow
1. Copy the template to `.env`
2. Fill only test values
3. Confirm `.env` is gitignored
4. Double-check with `git diff` before commit
