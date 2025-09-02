# 🚨 Solana Emergency Alert System

A comprehensive blockchain-based emergency alert system for tourist safety built on **Solana** with **Phantom wallet** integration, real-time location tracking, and automatic e-FIR generation.

## 🌟 Key Features

### 🔗 **Solana Blockchain Integration**
- **Fast & Low-Cost**: Solana's high-speed, low-fee transactions
- **Phantom Wallet**: Seamless wallet integration for tourists
- **Program Accounts**: Efficient on-chain data storage
- **Event Logs**: Real-time event monitoring

### 📍 **Live Location Tracking**
- **GPS Integration**: Real-time location monitoring
- **Auto-Fill**: Automatic location field population
- **Permission Management**: Secure location access control
- **High Accuracy**: Precise coordinate tracking

### 🚨 **Emergency Alert Types**
- **PANIC**: Critical emergency (Police, Ambulance, Tourism Authority)
- **GEOFENCE**: Area breach detection (Police, Tourism Authority)
- **ANOMALY**: AI-detected unusual behavior (Tourism Authority)

## 🏗️ System Architecture

### Solana Program (Smart Contract)
- **Anchor Framework**: Rust-based Solana program
- **Program Accounts**: EmergencyAlert, Alert, EmergencyContact
- **Event Emission**: AlertTriggered, AlertResolved events
- **Access Control**: Authority-based permissions

### Frontend Dashboard
- **Phantom Wallet**: Direct Solana wallet integration
- **Location Tracking**: Browser geolocation API
- **Real-time Updates**: Live alert monitoring
- **Responsive Design**: Mobile-friendly interface

### Backend Listener
- **Solana Web3.js**: Blockchain event monitoring
- **e-FIR Generation**: Automatic report creation
- **Emergency Notifications**: Multi-channel alerts
- **IPFS Simulation**: Decentralized document storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Phantom wallet browser extension
- Solana CLI (optional, for development)

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Deploy Solana Program

```bash
# Deploy to Solana devnet
npx ts-node scripts/deploy-solana.ts
```

Copy the program ID and PDA addresses from the output.

### 3. Configure Backend

Update `backend/solana-emergency-listener.js` with your program ID:

```javascript
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");
```

### 4. Start Backend Listener

```bash
cd backend
npm start
```

The backend will start listening for Solana program events.

### 5. Configure Frontend

Update `src/components/digital-ids/SolanaEmergencyAlertDashboard.tsx` with your program ID:

```typescript
const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID")
```

### 6. Start Frontend

```bash
npm run dev
```

Visit `http://localhost:3000` and click "Emergency Alerts" in the sidebar.

## 🧪 Testing the System

### 1. Connect Phantom Wallet
- Click "Connect Phantom Wallet" in the dashboard
- Ensure you're connected to Solana devnet
- Fund your wallet with devnet SOL (use Solana faucet)

### 2. Enable Location Tracking
- Click "Enable Location Tracking"
- Allow location access in your browser
- Watch real-time coordinates update

### 3. Trigger Test Alert
- Select alert type (PANIC, GEOFENCE, ANOMALY)
- Location field auto-fills from GPS
- Add optional description
- Click "🚨 Trigger Alert"

### 4. Monitor Backend
Watch the backend console for:
- Solana event detection
- e-FIR generation
- Emergency service notifications
- IPFS hash simulation

### 5. View Dashboard
The frontend dashboard will automatically update with:
- New alert in the table
- Updated statistics
- Real-time event notifications

## 📋 Alert Types & Priorities

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

## 🔧 Solana Program Functions

### Public Functions
- `initialize()` - Initialize emergency alert system
- `triggerAlert(alertType, location, description)` - Create new emergency alert
- `resolveAlert()` - Resolve active alert

### Program Accounts
- `EmergencyAlert` - System configuration and counter
- `Alert` - Individual alert data
- `EmergencyContact` - Emergency service contacts

### Events
- `AlertTriggered(alertId, tourist, alertType, location, description, timestamp)`
- `AlertResolved(alertId, tourist, resolvedAt)`

## 📊 Backend Features

### Event Processing
- Real-time Solana program log monitoring
- Automatic e-FIR generation
- Emergency service notifications
- IPFS document storage simulation

### e-FIR Generation
Each alert automatically generates an e-FIR with:
- Alert details and metadata
- Tourist wallet address
- Location coordinates and timestamp
- Emergency contact information
- Solana transaction signature
- Priority classification

### Notification System
- Multi-channel emergency notifications
- Priority-based contact routing
- Simulated SMS/Email/Push notifications
- Emergency dispatch integration ready

## 🌐 Network Support

### Development
- **Solana Devnet**: `https://api.devnet.solana.com`
- **Test SOL**: Available from Solana faucet
- **Fast Transactions**: ~400ms confirmation time

### Production
- **Solana Mainnet**: `https://api.mainnet-beta.solana.com`
- **Real SOL**: Requires actual SOL for transactions
- **High Performance**: 65,000 TPS capacity

## 🔒 Security Features

- **Program Accounts**: Secure on-chain data storage
- **PDA (Program Derived Addresses)**: Deterministic account generation
- **Authority Control**: Owner-only administrative functions
- **Input Validation**: Comprehensive parameter checking
- **Event Logging**: Complete transaction audit trail

## 📱 Frontend Dashboard

### Real-time Features
- Live alert monitoring
- Automatic event updates
- Real-time statistics
- Event streaming

### Location Features
- GPS location tracking
- Auto-fill location fields
- Permission management
- High-accuracy positioning

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

**Phantom Wallet Not Found**
- Install Phantom wallet extension
- Ensure extension is enabled
- Check browser compatibility

**Location Permission Denied**
- Enable location access in browser settings
- Check HTTPS requirement
- Verify geolocation API support

**Program Not Found**
- Verify program ID is correct
- Ensure program is deployed to correct network
- Check RPC URL configuration

**Events Not Detecting**
- Verify backend is running
- Check network connection
- Ensure program ID matches

### Debug Commands

```bash
# Check program deployment
npx ts-node scripts/deploy-solana.ts

# Verify program account
solana account YOUR_PROGRAM_ID --url devnet

# Check backend logs
cd backend && npm start

# Test frontend connection
npm run dev
```

## 📈 Future Enhancements

- [ ] **Multi-chain Support**: Deploy on multiple blockchains
- [ ] **AI Integration**: Advanced anomaly detection
- [ ] **Mobile App**: Native mobile emergency app
- [ ] **Voice Alerts**: Audio emergency notifications
- [ ] **Biometric Integration**: Health monitoring alerts
- [ ] **IoT Integration**: Smart device emergency triggers
- [ ] **Machine Learning**: Predictive safety analytics
- [ ] **Cross-chain Bridge**: Multi-blockchain interoperability

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/solana-enhancement`)
3. Commit changes (`git commit -m 'Add Solana enhancement'`)
4. Push to branch (`git push origin feature/solana-enhancement`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the test cases for usage examples

---

**Built with ❤️ for tourist safety and emergency response innovation on Solana**

## 🚀 Deployment Checklist

- [ ] Deploy Solana program to devnet/mainnet
- [ ] Update program ID in frontend
- [ ] Update program ID in backend
- [ ] Configure RPC URLs for target network
- [ ] Set up emergency contact addresses
- [ ] Test alert triggering and event detection
- [ ] Verify e-FIR generation
- [ ] Test emergency notifications
- [ ] Deploy frontend to production
- [ ] Deploy backend to production
- [ ] Set up monitoring and logging

## 🔗 Useful Links

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Phantom Wallet](https://phantom.app/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Solana Faucet](https://faucet.solana.com/)
