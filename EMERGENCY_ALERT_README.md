# 🚨 Emergency Alert System

A comprehensive blockchain-based emergency alert system for tourist safety with real-time monitoring, automatic e-FIR generation, and emergency service notifications.

## 🏗️ System Architecture

### Smart Contract Features
- **Alert Types**: PANIC, GEOFENCE, ANOMALY detection
- **Real-time Events**: Instant alert emission with full details
- **Emergency Contacts**: Configurable emergency service addresses
- **Alert Management**: Track, resolve, and monitor alert status
- **Statistics**: Real-time contract statistics and analytics

### Backend Features
- **Event Listening**: Real-time blockchain event monitoring
- **e-FIR Generation**: Automatic electronic First Information Report creation
- **Emergency Notifications**: Multi-channel alert notifications
- **IPFS Integration**: Decentralized document storage simulation
- **Logging**: Comprehensive event logging and audit trail

### Frontend Features
- **Real-time Dashboard**: Live alert monitoring and statistics
- **Alert Triggering**: Easy emergency alert creation
- **Event Streaming**: Automatic UI updates on new alerts
- **Responsive Design**: Mobile-friendly emergency interface

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Git

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Deploy Smart Contract

```bash
# Start Hardhat local network
npx hardhat node

# In another terminal, deploy the contract
npx hardhat run scripts/deploy-emergency.ts --network localhost
```

Copy the deployed contract address from the output.

### 3. Configure Backend

Update `backend/emergency-listener.js` with your contract address:

```javascript
const CONFIG = {
  CONTRACT_ADDRESS: "YOUR_DEPLOYED_CONTRACT_ADDRESS",
  RPC_URL: "http://127.0.0.1:8545", // or your testnet RPC
  // ...
}
```

### 4. Start Backend Listener

```bash
cd backend
npm start
```

The backend will start listening for emergency alert events and generate e-FIR reports.

### 5. Configure Frontend

Update `src/components/digital-ids/EmergencyAlertDashboard.tsx` with your contract address:

```typescript
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"
```

### 6. Start Frontend

```bash
npm run dev
```

Visit `http://localhost:3000` and click "Emergency Alerts" in the sidebar.

## 🧪 Testing the System

### 1. Connect Wallet
- Click "Connect MetaMask Wallet" in the dashboard
- Ensure you're connected to the correct network

### 2. Trigger Test Alert
- Select alert type (PANIC, GEOFENCE, ANOMALY)
- Enter location (e.g., "40.7128,-74.0060" or "Times Square, NYC")
- Add optional description
- Click "🚨 Trigger Alert"

### 3. Monitor Backend
Watch the backend console for:
- Event detection
- e-FIR generation
- Emergency service notifications
- IPFS hash simulation

### 4. View Dashboard
The frontend dashboard will automatically update with:
- New alert in the table
- Updated statistics
- Real-time event notifications

## 📋 Alert Types

### 🚨 PANIC Alert
- **Trigger**: Manual panic button press
- **Priority**: CRITICAL
- **Contacts**: Police, Ambulance, Tourism Authority
- **Use Case**: Immediate danger, medical emergency, safety threat

### 📍 GEOFENCE Alert
- **Trigger**: Tourist enters/exits restricted area
- **Priority**: HIGH
- **Contacts**: Police, Tourism Authority
- **Use Case**: Unauthorized area access, safety zone breach

### ⚠️ ANOMALY Alert
- **Trigger**: AI/ML anomaly detection
- **Priority**: MEDIUM
- **Contacts**: Tourism Authority
- **Use Case**: Unusual behavior, pattern detection, risk assessment

## 🔧 Smart Contract Functions

### Public Functions
- `triggerAlert(alertType, location, description)` - Create new emergency alert
- `getAlert(alertId)` - Retrieve alert details
- `getRecentAlerts(count)` - Get recent alerts
- `getActiveAlertsCount()` - Count active alerts
- `getAlertsByType(alertType)` - Filter alerts by type
- `getContractStats()` - Get contract statistics

### Owner Functions
- `addEmergencyContact(contactType, address)` - Add emergency contact
- `removeEmergencyContact(contactType)` - Remove emergency contact
- `resolveAlert(alertId)` - Resolve active alert

### Events
- `AlertTriggered(alertId, tourist, alertType, location, timestamp, description)`
- `AlertResolved(alertId, tourist, resolvedAt)`
- `EmergencyContactAdded(contactType, address)`
- `EmergencyContactRemoved(contactType)`

## 📊 Backend Features

### Event Processing
- Real-time blockchain event monitoring
- Automatic e-FIR generation
- Emergency service notifications
- IPFS document storage simulation

### e-FIR Generation
Each alert automatically generates an e-FIR with:
- Alert details and metadata
- Tourist information
- Location and timestamp
- Emergency contact information
- Blockchain transaction hash
- Priority classification

### Notification System
- Multi-channel emergency notifications
- Priority-based contact routing
- Simulated SMS/Email/Push notifications
- Emergency dispatch integration ready

## 🌐 Network Support

### Local Development
- Hardhat local network (Chain ID: 31337)
- Test ETH available from Hardhat accounts

### Testnets
- **Polygon Mumbai**: `https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY`
- **Ethereum Sepolia**: `https://sepolia.infura.io/v3/YOUR_API_KEY`
- **Arbitrum Goerli**: `https://goerli-rollup.arbitrum.io/rpc`

### Production
- Mainnet deployment ready
- Requires real ETH for transactions

## 🔒 Security Features

- **Access Control**: Role-based function access
- **Input Validation**: Comprehensive parameter checking
- **Event Logging**: Complete transaction audit trail
- **Emergency Contacts**: Configurable trusted addresses
- **Ownable**: Owner-only administrative functions

## 📱 Frontend Dashboard

### Real-time Features
- Live alert monitoring
- Automatic event updates
- Real-time statistics
- Event streaming

### Alert Management
- Easy alert triggering
- Alert status tracking
- Historical alert viewing
- Filter by alert type

### User Interface
- Responsive design
- Mobile-friendly
- Dark theme
- Glass morphism effects

## 🐛 Troubleshooting

### Common Issues

**Contract Not Found**
- Verify contract address is correct
- Ensure contract is deployed to the correct network
- Check RPC URL configuration

**Events Not Detecting**
- Verify backend is running
- Check network connection
- Ensure contract address matches

**MetaMask Connection Failed**
- Install MetaMask extension
- Connect to correct network
- Check account permissions

### Debug Commands

```bash
# Check contract deployment
npx hardhat run scripts/deploy-emergency.ts --network localhost

# Verify contract functions
npx hardhat console --network localhost

# Check backend logs
cd backend && npm start

# Test frontend connection
npm run dev
```

## 📈 Future Enhancements

- [ ] **Multi-chain Support**: Deploy on multiple blockchains
- [ ] **AI Integration**: Advanced anomaly detection
- [ ] **Mobile App**: Native mobile emergency app
- [ ] **GPS Integration**: Real-time location tracking
- [ ] **Voice Alerts**: Audio emergency notifications
- [ ] **Biometric Integration**: Health monitoring alerts
- [ ] **IoT Integration**: Smart device emergency triggers
- [ ] **Machine Learning**: Predictive safety analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/emergency-enhancement`)
3. Commit changes (`git commit -m 'Add emergency enhancement'`)
4. Push to branch (`git push origin feature/emergency-enhancement`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the test cases for usage examples

---

**Built with ❤️ for tourist safety and emergency response innovation**

## 🚀 Deployment Checklist

- [ ] Deploy smart contract to target network
- [ ] Update contract address in frontend
- [ ] Update contract address in backend
- [ ] Configure RPC URLs for target network
- [ ] Set up emergency contact addresses
- [ ] Test alert triggering and event detection
- [ ] Verify e-FIR generation
- [ ] Test emergency notifications
- [ ] Deploy frontend to production
- [ ] Deploy backend to production
- [ ] Set up monitoring and logging
