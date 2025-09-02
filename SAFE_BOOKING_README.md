# Safe Booking Escrow System

A comprehensive blockchain-based escrow system for secure tour bookings with safety SLA verification, built with Solidity, Hardhat, and Next.js.

## 🏗️ System Architecture

### Smart Contract Features
- **ETH Escrow**: Secure payment holding until safety verification
- **SLA Verification**: Oracle-based safety compliance checking
- **Dispute Resolution**: Arbiter-mediated conflict resolution
- **Timeout Protection**: Automatic refunds if SLA verification is delayed
- **Penalty System**: Partial operator compensation for failed SLAs

### Frontend Features
- **MetaMask Integration**: Seamless wallet connection
- **Real-time Status**: Live booking status updates
- **Countdown Timer**: SLA deadline tracking
- **Transaction History**: Complete audit trail
- **Dispute Management**: Easy dispute raising and resolution

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MetaMask browser extension
- Git

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install Hardhat dependencies
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat ethers
```

### 2. Start Hardhat Local Network

```bash
# Start local Hardhat node
npx hardhat node
```

This will start a local blockchain at `http://127.0.0.1:8545` with 20 test accounts.

### 3. Deploy Smart Contract

In a new terminal:

```bash
# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the deployed contract address from the output.

### 4. Configure MetaMask

1. Open MetaMask
2. Add new network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
3. Import test account using private key from Hardhat output

### 5. Update Contract Address

Edit `src/components/digital-ids/SafeBookingEscrow.tsx` and update the `contractAddress`:

```typescript
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"
```

### 6. Start Frontend

```bash
# Start Next.js development server
npm run dev
```

Visit `http://localhost:3000` and click "Safe Booking" in the sidebar.

## 🧪 Testing

### Run Smart Contract Tests

```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/SafetyEscrow.test.ts
```

### Test Scenarios Covered
- ✅ Contract deployment and initialization
- ✅ Booking creation and validation
- ✅ SLA verification (pass/fail)
- ✅ Fund release to operators
- ✅ Refund mechanisms (full and with penalty)
- ✅ Timeout handling
- ✅ Dispute resolution
- ✅ Oracle and arbiter management
- ✅ Edge cases and error handling

## 📋 Usage Guide

### For Tourists

1. **Connect Wallet**: Click "Connect MetaMask Wallet"
2. **Create Booking**: 
   - Enter unique booking ID
   - Provide operator's wallet address
   - Specify deposit amount in ETH
   - Click "Deposit Booking Fee"
3. **Monitor Status**: View real-time booking status and countdown timer
4. **Raise Dispute**: If needed, raise a dispute after SLA verification

### For Tour Operators

1. **Receive Booking**: Get notified when tourists create bookings
2. **Provide Service**: Deliver tour services according to safety standards
3. **SLA Verification**: Wait for oracle to verify safety compliance
4. **Receive Payment**: Funds released automatically if SLA passes

### For Oracles (Safety Authorities)

1. **Verify Safety**: Call `verifySLA(bookingId, true/false)` on the contract
2. **Monitor Bookings**: Track pending SLA verifications
3. **Maintain Standards**: Ensure consistent safety evaluation

### For Arbiters (Tourism Authorities)

1. **Resolve Disputes**: Call `resolveDispute(bookingId, operatorWins)` 
2. **Review Evidence**: Evaluate dispute claims
3. **Make Decisions**: Determine fair outcomes

## 🔧 Contract Functions

### Public Functions
- `createBooking(bookingId, operator)` - Create new booking with ETH deposit
- `getBooking(bookingId)` - Retrieve booking details
- `getTimeRemaining(bookingId)` - Get SLA deadline countdown
- `isTimedOut(bookingId)` - Check if booking has expired
- `raiseDispute(bookingId)` - Raise dispute (tourist/operator only)

### Oracle Functions
- `verifySLA(bookingId, slaPassed)` - Verify safety compliance

### Arbiter Functions  
- `resolveDispute(bookingId, operatorWins)` - Resolve disputes

### Owner Functions
- `authorizeOracle(oracle)` - Add new oracle
- `authorizeArbiter(arbiter)` - Add new arbiter
- `revokeOracle(oracle)` - Remove oracle
- `revokeArbiter(arbiter)` - Remove arbiter

## 📊 Contract Configuration

### Constants
- **SLA_TIMEOUT_HOURS**: 24 hours
- **PENALTY_PERCENTAGE**: 10% (1000 basis points)
- **BASIS_POINTS**: 10000

### Booking Statuses
- `0` - Pending (awaiting SLA verification)
- `1` - SLAPassed (safety verified, ready for payment)
- `2` - SLAFailed (safety failed, ready for refund)
- `3` - Refunded (funds returned to tourist)
- `4` - Paid (funds released to operator)
- `5` - Disputed (awaiting arbiter decision)

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Role-based function access
- **Event Logging**: Complete transaction audit trail

## 🌐 Network Support

### Local Development
- Hardhat local network (Chain ID: 31337)
- Test ETH available from Hardhat accounts

### Testnets
- Sepolia testnet support
- Configure in `hardhat.config.ts`
- Use testnet ETH from faucets

### Production
- Mainnet deployment ready
- Requires real ETH for transactions

## 🐛 Troubleshooting

### Common Issues

**MetaMask Connection Failed**
- Ensure MetaMask is installed and unlocked
- Check network configuration
- Verify contract address is correct

**Transaction Reverted**
- Check account has sufficient ETH
- Verify booking ID is unique
- Ensure operator address is valid

**Contract Not Found**
- Redeploy contract to local network
- Update contract address in frontend
- Restart Hardhat node if needed

### Debug Commands

```bash
# Check Hardhat node status
npx hardhat node --help

# Verify contract deployment
npx hardhat run scripts/deploy.ts --network localhost

# Compile contracts
npx hardhat compile

# Clean build artifacts
npx hardhat clean
```

## 📈 Future Enhancements

- [ ] Multi-token support (USDC, DAI)
- [ ] Automated SLA verification via Chainlink oracles
- [ ] Insurance integration
- [ ] Mobile app development
- [ ] Multi-signature dispute resolution
- [ ] Reputation system for operators
- [ ] Integration with tourism APIs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the test cases for usage examples

---

**Built with ❤️ for secure tourism and blockchain innovation**
