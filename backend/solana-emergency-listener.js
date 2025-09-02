const { Connection, PublicKey } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@coral-xyz/anchor');
const fs = require('fs');
const path = require('path');

// Solana Program ID (placeholder - will be updated after actual deployment)
const PROGRAM_ID = new PublicKey("11111111111111111111111111111112");

// Program IDL (same as frontend)
const IDL = {
  "version": "0.1.0",
  "name": "emergency_alert",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "authority", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": []
    },
    {
      "name": "triggerAlert",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "alert", "isMut": true, "isSigner": false },
        { "name": "tourist", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "alertType", "type": "u8" },
        { "name": "location", "type": "string" },
        { "name": "description", "type": "string" }
      ]
    },
    {
      "name": "resolveAlert",
      "accounts": [
        { "name": "emergencyAlert", "isMut": true, "isSigner": false },
        { "name": "alert", "isMut": true, "isSigner": false },
        { "name": "tourist", "isMut": false, "isSigner": true }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "EmergencyAlert",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "publicKey" },
          { "name": "alertCounter", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Alert",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "alertId", "type": "u64" },
          { "name": "tourist", "type": "publicKey" },
          { "name": "alertType", "type": "u8" },
          { "name": "location", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "timestamp", "type": "i64" },
          { "name": "isActive", "type": "bool" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "AlertTriggered",
      "fields": [
        { "name": "alertId", "type": "u64", "index": false },
        { "name": "tourist", "type": "publicKey", "index": false },
        { "name": "alertType", "type": "u8", "index": false },
        { "name": "location", "type": "string", "index": false },
        { "name": "description", "type": "string", "index": false },
        { "name": "timestamp", "type": "i64", "index": false }
      ]
    },
    {
      "name": "AlertResolved",
      "fields": [
        { "name": "alertId", "type": "u64", "index": false },
        { "name": "tourist", "type": "publicKey", "index": false },
        { "name": "resolvedAt", "type": "i64", "index": false }
      ]
    }
  ],
  "errors": [
    { "code": 6000, "name": "InvalidAlertType", "msg": "Invalid alert type" },
    { "code": 6001, "name": "AlertAlreadyResolved", "msg": "Alert already resolved" },
    { "code": 6002, "name": "Unauthorized", "msg": "Unauthorized" }
  ]
};

// Configuration
const CONFIG = {
  // Solana RPC URL
  RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  
  // Emergency contacts
  EMERGENCY_CONTACTS: {
    POLICE: "911",
    AMBULANCE: "108", 
    TOURISM_AUTHORITY: "+1-800-TOURISM"
  },
  
  // File paths
  EFIR_DIR: path.join(__dirname, 'efir-reports'),
  LOG_FILE: path.join(__dirname, 'solana-emergency-logs.txt')
};

class SolanaEmergencyAlertListener {
  constructor() {
    this.connection = null;
    this.program = null;
    this.isListening = false;
    this.alertTypes = ['PANIC', 'GEOFENCE', 'ANOMALY'];
    this.lastProcessedSignature = null;
    
    // Create e-FIR directory if it doesn't exist
    if (!fs.existsSync(CONFIG.EFIR_DIR)) {
      fs.mkdirSync(CONFIG.EFIR_DIR, { recursive: true });
    }
    
    this.initializeConnection();
  }
  
  async initializeConnection() {
    try {
      console.log('🚀 Initializing Solana Emergency Alert Listener...');
      console.log(`📡 Connecting to: ${CONFIG.RPC_URL}`);
      
      // Initialize connection
      this.connection = new Connection(CONFIG.RPC_URL, 'confirmed');
      
      // Initialize program (without wallet for read-only operations)
      this.program = new Program(IDL, PROGRAM_ID, {
        connection: this.connection,
        // No wallet needed for event listening
      });
      
      console.log(`📋 Program ID: ${PROGRAM_ID.toString()}`);
      
      // Test connection
      const version = await this.connection.getVersion();
      console.log(`🌐 Connected to Solana ${version['solana-core']}`);
      
      // Start listening
      await this.startListening();
      
    } catch (error) {
      console.error('❌ Failed to initialize connection:', error.message);
      this.retryConnection();
    }
  }
  
  async startListening() {
    if (this.isListening) {
      console.log('⚠️  Already listening for events');
      return;
    }
    
    try {
      console.log('👂 Starting to listen for Solana emergency alerts...');
      
      // Listen for program logs (events are emitted as logs in Solana)
      this.connection.onLogs(
        PROGRAM_ID,
        async (logs, context) => {
          await this.handleProgramLogs(logs, context);
        },
        'confirmed'
      );
      
      this.isListening = true;
      console.log('✅ Successfully started listening for Solana emergency alerts');
      
      // Log startup
      this.logEvent('SYSTEM', 'Solana Emergency Alert Listener started', {
        programId: PROGRAM_ID.toString(),
        rpcUrl: CONFIG.RPC_URL,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Failed to start listening:', error.message);
      this.retryConnection();
    }
  }
  
  async handleProgramLogs(logs, context) {
    try {
      // Parse logs to extract events
      for (const log of logs.logs) {
        if (log.includes('AlertTriggered')) {
          await this.handleAlertTriggered(log, context);
        } else if (log.includes('AlertResolved')) {
          await this.handleAlertResolved(log, context);
        }
      }
    } catch (error) {
      console.error('❌ Error handling program logs:', error.message);
    }
  }
  
  async handleAlertTriggered(log, context) {
    try {
      // Parse the log to extract event data
      // In a real implementation, you would parse the structured log data
      const alertId = Math.floor(Math.random() * 1000); // Placeholder
      const tourist = "Tourist" + Math.floor(Math.random() * 100); // Placeholder
      const alertType = Math.floor(Math.random() * 3);
      const alertTypeString = this.alertTypes[alertType] || 'UNKNOWN';
      const location = "Location" + Math.floor(Math.random() * 100); // Placeholder
      const description = "Emergency alert triggered"; // Placeholder
      const timestamp = Date.now();
      
      console.log('\n🚨 ===== SOLANA EMERGENCY ALERT TRIGGERED =====');
      console.log(`🆔 Alert ID: ${alertId}`);
      console.log(`👤 Tourist: ${tourist}`);
      console.log(`⚠️  Type: ${alertTypeString}`);
      console.log(`📍 Location: ${location}`);
      console.log(`🕐 Time: ${new Date(timestamp).toISOString()}`);
      console.log(`📝 Description: ${description}`);
      console.log(`🔗 Signature: ${context.signature}`);
      console.log('===============================================\n');
      
      // Generate e-FIR
      const efirData = await this.generateEFIR({
        alertId: alertId.toString(),
        tourist,
        alertType: alertTypeString,
        location,
        timestamp: new Date(timestamp).toISOString(),
        description,
        signature: context.signature
      });
      
      // Notify emergency services
      await this.notifyEmergencyServices(alertTypeString, location, tourist, alertId.toString());
      
      // Log the event
      this.logEvent('ALERT_TRIGGERED', `${alertTypeString} alert from ${tourist}`, {
        alertId: alertId.toString(),
        tourist,
        alertType: alertTypeString,
        location,
        timestamp: new Date(timestamp).toISOString(),
        description,
        signature: context.signature
      });
      
    } catch (error) {
      console.error('❌ Error handling alert:', error.message);
    }
  }
  
  async handleAlertResolved(log, context) {
    try {
      const alertId = Math.floor(Math.random() * 1000); // Placeholder
      const tourist = "Tourist" + Math.floor(Math.random() * 100); // Placeholder
      const resolvedAt = Date.now();
      
      console.log('\n✅ ===== SOLANA ALERT RESOLVED =====');
      console.log(`🆔 Alert ID: ${alertId}`);
      console.log(`👤 Tourist: ${tourist}`);
      console.log(`🕐 Resolved at: ${new Date(resolvedAt).toISOString()}`);
      console.log(`🔗 Signature: ${context.signature}`);
      console.log('====================================\n');
      
      // Log the event
      this.logEvent('ALERT_RESOLVED', `Alert ${alertId} resolved by ${tourist}`, {
        alertId: alertId.toString(),
        tourist,
        resolvedAt: new Date(resolvedAt).toISOString(),
        signature: context.signature
      });
      
    } catch (error) {
      console.error('❌ Error handling alert resolution:', error.message);
    }
  }
  
  async generateEFIR(alertData) {
    try {
      const efirData = {
        reportId: `SOLANA-EFIR-${Date.now()}-${alertData.alertId}`,
        timestamp: new Date().toISOString(),
        blockchain: "Solana",
        alertData: {
          alertId: alertData.alertId,
          tourist: alertData.tourist,
          alertType: alertData.alertType,
          location: alertData.location,
          timestamp: alertData.timestamp,
          description: alertData.description,
          signature: alertData.signature
        },
        emergencyContacts: CONFIG.EMERGENCY_CONTACTS,
        status: 'PENDING_VERIFICATION',
        priority: this.getAlertPriority(alertData.alertType),
        autoGenerated: true,
        blockchainVerified: true
      };
      
      // Save e-FIR to file
      const filename = `solana-efir-${alertData.alertId}-${Date.now()}.json`;
      const filepath = path.join(CONFIG.EFIR_DIR, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(efirData, null, 2));
      
      console.log(`📄 Solana e-FIR generated: ${filename}`);
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
        console.log(`📱 Notifying ${contact}: Solana Emergency ${alertType} alert from tourist ${tourist} at ${location} (Alert ID: ${alertId})`);
        
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
      this.initializeConnection();
    }, 10000);
  }
  
  async stopListening() {
    if (this.connection && this.isListening) {
      // Remove all listeners
      this.connection.removeAllListeners();
      this.isListening = false;
      console.log('🛑 Stopped listening for Solana events');
    }
  }
  
  async getProgramStats() {
    try {
      if (!this.program) {
        throw new Error('Program not initialized');
      }
      
      // Get emergency alert account
      const [emergencyAlertPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("emergency_alert")],
        PROGRAM_ID
      );
      
      try {
        const emergencyAlertAccount = await this.program.account.emergencyAlert.fetch(emergencyAlertPDA);
        
        // Get all alert accounts
        const alertAccounts = await this.program.account.alert.all();
        const activeAlerts = alertAccounts.filter(account => account.account.isActive).length;
        const uniqueTourists = new Set(alertAccounts.map(account => account.account.tourist.toString())).size;
        
        console.log('\n📊 ===== SOLANA PROGRAM STATISTICS =====');
        console.log(`📈 Total Alerts: ${emergencyAlertAccount.alertCounter.toString()}`);
        console.log(`🚨 Active Alerts: ${activeAlerts}`);
        console.log(`👥 Unique Tourists: ${uniqueTourists}`);
        console.log('========================================\n');
        
        return {
          totalAlerts: Number(emergencyAlertAccount.alertCounter),
          activeAlerts,
          totalTourists: uniqueTourists
        };
        
      } catch (error) {
        console.log('📊 Program not yet initialized or no alerts found');
        return {
          totalAlerts: 0,
          activeAlerts: 0,
          totalTourists: 0
        };
      }
      
    } catch (error) {
      console.error('❌ Error getting program stats:', error.message);
      return null;
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Solana Emergency Alert Listener...');
  if (global.solanaEmergencyListener) {
    await global.solanaEmergencyListener.stopListening();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down Solana Emergency Alert Listener...');
  if (global.solanaEmergencyListener) {
    await global.solanaEmergencyListener.stopListening();
  }
  process.exit(0);
});

// Start the listener
async function main() {
  try {
    global.solanaEmergencyListener = new SolanaEmergencyAlertListener();
    
    // Get initial stats
    setTimeout(async () => {
      await global.solanaEmergencyListener.getProgramStats();
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start Solana Emergency Alert Listener:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = SolanaEmergencyAlertListener;
