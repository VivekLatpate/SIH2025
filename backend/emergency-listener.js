const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Contract ABI (simplified for the listener)
const EMERGENCY_ALERT_ABI = [
  "event AlertTriggered(uint256 indexed alertId, address indexed tourist, uint8 alertType, string location, uint256 timestamp, string description)",
  "event AlertResolved(uint256 indexed alertId, address indexed tourist, uint256 resolvedAt)",
  "function getAlert(uint256 alertId) external view returns (tuple(address tourist, uint8 alertType, string location, uint256 timestamp, bool isActive, string description))",
  "function getAlertTypeString(uint8 alertType) external pure returns (string)"
];

// Configuration
const CONFIG = {
  // Update these with your deployed contract address and RPC URL
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  RPC_URL: process.env.RPC_URL || "http://127.0.0.1:8545", // Hardhat local
  // For testnets, use:
  // RPC_URL: "https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY" // Polygon Mumbai
  // RPC_URL: "https://sepolia.infura.io/v3/YOUR_API_KEY" // Ethereum Sepolia
  
  // Emergency contacts
  EMERGENCY_CONTACTS: {
    POLICE: "911",
    AMBULANCE: "108", 
    TOURISM_AUTHORITY: "+1-800-TOURISM"
  },
  
  // File paths
  EFIR_DIR: path.join(__dirname, 'efir-reports'),
  LOG_FILE: path.join(__dirname, 'emergency-logs.txt')
};

class EmergencyAlertListener {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.isListening = false;
    this.alertTypes = ['PANIC', 'GEOFENCE', 'ANOMALY'];
    
    // Create e-FIR directory if it doesn't exist
    if (!fs.existsSync(CONFIG.EFIR_DIR)) {
      fs.mkdirSync(CONFIG.EFIR_DIR, { recursive: true });
    }
    
    this.initializeProvider();
  }
  
  async initializeProvider() {
    try {
      console.log('🚀 Initializing Emergency Alert Listener...');
      console.log(`📡 Connecting to: ${CONFIG.RPC_URL}`);
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
      
      // Initialize contract
      this.contract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        EMERGENCY_ALERT_ABI,
        this.provider
      );
      
      console.log(`📋 Contract address: ${CONFIG.CONTRACT_ADDRESS}`);
      
      // Test connection
      const network = await this.provider.getNetwork();
      console.log(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      // Start listening
      await this.startListening();
      
    } catch (error) {
      console.error('❌ Failed to initialize provider:', error.message);
      this.retryConnection();
    }
  }
  
  async startListening() {
    if (this.isListening) {
      console.log('⚠️  Already listening for events');
      return;
    }
    
    try {
      console.log('👂 Starting to listen for emergency alerts...');
      
      // Listen for AlertTriggered events
      this.contract.on('AlertTriggered', async (alertId, tourist, alertType, location, timestamp, description, event) => {
        await this.handleAlertTriggered(alertId, tourist, alertType, location, timestamp, description, event);
      });
      
      // Listen for AlertResolved events
      this.contract.on('AlertResolved', async (alertId, tourist, resolvedAt, event) => {
        await this.handleAlertResolved(alertId, tourist, resolvedAt, event);
      });
      
      this.isListening = true;
      console.log('✅ Successfully started listening for emergency alerts');
      
      // Log startup
      this.logEvent('SYSTEM', 'Emergency Alert Listener started', {
        contractAddress: CONFIG.CONTRACT_ADDRESS,
        rpcUrl: CONFIG.RPC_URL,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Failed to start listening:', error.message);
      this.retryConnection();
    }
  }
  
  async handleAlertTriggered(alertId, tourist, alertType, location, timestamp, description, event) {
    try {
      const alertTypeString = this.alertTypes[alertType] || 'UNKNOWN';
      const timestampDate = new Date(Number(timestamp) * 1000);
      
      console.log('\n🚨 ===== EMERGENCY ALERT TRIGGERED =====');
      console.log(`🆔 Alert ID: ${alertId.toString()}`);
      console.log(`👤 Tourist: ${tourist}`);
      console.log(`⚠️  Type: ${alertTypeString}`);
      console.log(`📍 Location: ${location}`);
      console.log(`🕐 Time: ${timestampDate.toISOString()}`);
      console.log(`📝 Description: ${description}`);
      console.log(`🔗 Transaction: ${event.transactionHash}`);
      console.log('=====================================\n');
      
      // Generate e-FIR
      const efirData = await this.generateEFIR({
        alertId: alertId.toString(),
        tourist,
        alertType: alertTypeString,
        location,
        timestamp: timestampDate.toISOString(),
        description,
        transactionHash: event.transactionHash
      });
      
      // Notify emergency services
      await this.notifyEmergencyServices(alertTypeString, location, tourist, alertId.toString());
      
      // Log the event
      this.logEvent('ALERT_TRIGGERED', `${alertTypeString} alert from ${tourist}`, {
        alertId: alertId.toString(),
        tourist,
        alertType: alertTypeString,
        location,
        timestamp: timestampDate.toISOString(),
        description,
        transactionHash: event.transactionHash
      });
      
    } catch (error) {
      console.error('❌ Error handling alert:', error.message);
    }
  }
  
  async handleAlertResolved(alertId, tourist, resolvedAt, event) {
    try {
      const resolvedDate = new Date(Number(resolvedAt) * 1000);
      
      console.log('\n✅ ===== ALERT RESOLVED =====');
      console.log(`🆔 Alert ID: ${alertId.toString()}`);
      console.log(`👤 Tourist: ${tourist}`);
      console.log(`🕐 Resolved at: ${resolvedDate.toISOString()}`);
      console.log(`🔗 Transaction: ${event.transactionHash}`);
      console.log('============================\n');
      
      // Log the event
      this.logEvent('ALERT_RESOLVED', `Alert ${alertId} resolved by ${tourist}`, {
        alertId: alertId.toString(),
        tourist,
        resolvedAt: resolvedDate.toISOString(),
        transactionHash: event.transactionHash
      });
      
    } catch (error) {
      console.error('❌ Error handling alert resolution:', error.message);
    }
  }
  
  async generateEFIR(alertData) {
    try {
      const efirData = {
        reportId: `EFIR-${Date.now()}-${alertData.alertId}`,
        timestamp: new Date().toISOString(),
        alertData: {
          alertId: alertData.alertId,
          tourist: alertData.tourist,
          alertType: alertData.alertType,
          location: alertData.location,
          timestamp: alertData.timestamp,
          description: alertData.description,
          transactionHash: alertData.transactionHash
        },
        emergencyContacts: CONFIG.EMERGENCY_CONTACTS,
        status: 'PENDING_VERIFICATION',
        priority: this.getAlertPriority(alertData.alertType),
        autoGenerated: true,
        blockchainVerified: true
      };
      
      // Save e-FIR to file
      const filename = `efir-${alertData.alertId}-${Date.now()}.json`;
      const filepath = path.join(CONFIG.EFIR_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(efirData, null, 2));
      
      console.log(`📄 e-FIR generated: ${filename}`);
      console.log(`📁 Saved to: ${filepath}`);
      
      // Simulate IPFS upload (in real implementation, use IPFS SDK)
      const ipfsHash = this.simulateIPFSUpload(efirData);
      console.log(`🌐 IPFS Hash (simulated): ${ipfsHash}`);
      
      return {
        ...efirData,
        ipfsHash,
        filepath
      };
      
    } catch (error) {
      console.error('❌ Error generating e-FIR:', error.message);
      return null;
    }
  }
  
  async notifyEmergencyServices(alertType, location, tourist, alertId) {
    try {
      console.log('\n📞 ===== NOTIFYING EMERGENCY SERVICES =====');
      
      // Determine priority and contacts based on alert type
      const contacts = this.getEmergencyContacts(alertType);
      const priority = this.getAlertPriority(alertType);
      
      console.log(`🚨 Priority: ${priority}`);
      console.log(`📞 Notifying contacts: ${contacts.join(', ')}`);
      
      // Simulate notifications
      for (const contact of contacts) {
        console.log(`📱 Notifying ${contact}: Emergency ${alertType} alert from tourist ${tourist} at ${location} (Alert ID: ${alertId})`);
        
        // In real implementation, integrate with:
        // - SMS services (Twilio, AWS SNS)
        // - Push notifications (Firebase, OneSignal)
        // - Email services (SendGrid, AWS SES)
        // - Emergency dispatch systems
      }
      
      console.log('==========================================\n');
      
    } catch (error) {
      console.error('❌ Error notifying emergency services:', error.message);
    }
  }
  
  getEmergencyContacts(alertType) {
    switch (alertType) {
      case 'PANIC':
        return ['POLICE', 'AMBULANCE', 'TOURISM_AUTHORITY'];
      case 'GEOFENCE':
        return ['POLICE', 'TOURISM_AUTHORITY'];
      case 'ANOMALY':
        return ['TOURISM_AUTHORITY'];
      default:
        return ['POLICE'];
    }
  }
  
  getAlertPriority(alertType) {
    switch (alertType) {
      case 'PANIC':
        return 'CRITICAL';
      case 'GEOFENCE':
        return 'HIGH';
      case 'ANOMALY':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }
  
  simulateIPFSUpload(data) {
    // Simulate IPFS hash generation
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return `Qm${hash.digest('hex').substring(0, 44)}`;
  }
  
  logEvent(type, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to log file
    fs.appendFileSync(CONFIG.LOG_FILE, logLine);
    
    // Also log to console for development
    console.log(`📝 LOG [${type}]: ${message}`);
  }
  
  retryConnection() {
    console.log('🔄 Retrying connection in 10 seconds...');
    setTimeout(() => {
      this.initializeProvider();
    }, 10000);
  }
  
  async stopListening() {
    if (this.contract && this.isListening) {
      this.contract.removeAllListeners();
      this.isListening = false;
      console.log('🛑 Stopped listening for events');
    }
  }
  
  async getContractStats() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      // Get contract statistics
      const stats = await this.contract.getContractStats();
      
      console.log('\n📊 ===== CONTRACT STATISTICS =====');
      console.log(`📈 Total Alerts: ${stats.totalAlerts.toString()}`);
      console.log(`🚨 Active Alerts: ${stats.activeAlerts.toString()}`);
      console.log(`👥 Unique Tourists: ${stats.totalTourists.toString()}`);
      console.log('==================================\n');
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting contract stats:', error.message);
      return null;
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Emergency Alert Listener...');
  if (global.emergencyListener) {
    await global.emergencyListener.stopListening();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Emergency Alert Listener...');
  if (global.emergencyListener) {
    await global.emergencyListener.stopListening();
  }
  process.exit(0);
});

// Start the listener
async function main() {
  try {
    global.emergencyListener = new EmergencyAlertListener();
    
    // Get initial stats
    setTimeout(async () => {
      await global.emergencyListener.getContractStats();
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start Emergency Alert Listener:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = EmergencyAlertListener;
