# VRC25 Token Contract

## Overview
The VRC25 token contract is a sophisticated, upgradeable ERC20-compatible token implementation built for the Viction blockchain. It incorporates advanced features such as role-based access control, pausability, permit functionality for gasless approvals, and a token recovery mechanism.

## Features

### Role-Based Access Control
The contract implements a comprehensive role-based access control system with the following roles:

- `DEFAULT_ADMIN_ROLE`: Can grant and revoke all other roles
- `UPGRADER_ROLE`: Can upgrade the contract implementation
- `PAUSER_ROLE`: Can pause and unpause contract operations
- `CONTRACT_ADMIN_ROLE`: Can update the access registry
- `MINTER_ROLE`: Can mint new tokens
- `BURNER_ROLE`: Can burn tokens
- `RECOVERY_ROLE`: Can recover tokens from non-compliant addresses

### Upgradeability
- Implements the UUPS (Universal Upgradeable Proxy Standard)
- Allows for contract logic updates while preserving state
- Upgrades can only be performed by addresses with `UPGRADER_ROLE`

### Access Registry Integration
- Integrates with an external Access Registry contract
- Validates token transfers against allowed addresses
- Can be updated by addresses with `CONTRACT_ADMIN_ROLE`

### Security Features
- Pausable functionality for emergency situations
- Token recovery mechanism for non-compliant addresses
- Role-based access control for critical functions
- EIP-712 compliant permit functionality for gasless approvals

## Contract Setup

### Environment Variables
Create a `.env` file with the following variables:
```
CONTRACT_ADDRESS=your_contract_address
PRIVATE_KEY=your_private_key
MINTER_PRIVATE_KEY=minter_private_key
PAUSER_PRIVATE_KEY=pauser_private_key
RECOVERY_PRIVATE_KEY=recovery_private_key
ACCESS_REGISTRY_ADDRESS=access_registry_address
```

### Deployment
Deploy the contract using:
```bash
npx hardhat run scripts/deploy-vrc25.js --network tomo-testnet
```

## Administrative Functions

### Role Management
Grant roles using the provided scripts:
```bash
# Grant Minter Role
npx hardhat run scripts/grant-minter-role.js --network tomo-testnet

# Grant Pauser Role
npx hardhat run scripts/grant-pauser-role.js --network tomo-testnet

# Grant Recovery Role
npx hardhat run scripts/grant-recovery-role.js --network tomo-testnet

# Grant Contract Admin Role
npx hardhat run scripts/grant-contract-admin-role.js --network tomo-testnet
```

### Token Operations
```bash
# Mint Tokens
npx hardhat run scripts/mint-with-address.js --network tomo-testnet

# Recover Tokens
npx hardhat run scripts/recover-tokens.js --network tomo-testnet

# Check Balance
npx hardhat run scripts/check-balance.js --network tomo-testnet
```

### Contract Management
```bash
# Pause Contract
npx hardhat run scripts/pause.js --network tomo-testnet

# Unpause Contract
npx hardhat run scripts/unpause.js --network tomo-testnet

# Update Access Registry
npx hardhat run scripts/update-access-registry.js --network tomo-testnet
```

## Token Details
- Name: Worldwide USD
- Symbol: WUSD
- Decimals: 18
- Features: Upgradeable, Pausable, Access Control, Permit functionality

## Security Considerations

### Role Management
- Only grant roles to trusted addresses
- Maintain secure private key management for admin accounts
- Regularly audit role assignments

### Access Registry
- Ensure Access Registry contract is properly configured
- Test access control rules before deployment
- Maintain proper documentation of allowed addresses

### Recovery Process
1. Verify target address is non-compliant
2. Ensure recovery wallet has sufficient gas
3. Execute recovery through authorized address
4. Verify successful token recovery

## Development

### Prerequisites
- Node.js v14+ and npm
- Hardhat
- Access to Viction network (testnet/mainnet)

### Testing
Run the test suite:
```bash
npx hardhat test
```

### Contract Size Optimization
Monitor contract size:
```bash
npx hardhat run scripts/measure-contract-size.js
```

## License
AGPL-3.0-or-later

## Support
For support and inquiries, please contact support@fireblocks.com