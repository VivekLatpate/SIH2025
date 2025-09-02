'use client'

import { useState, useEffect, useCallback } from 'react'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor'
import { motion, AnimatePresence } from 'framer-motion'

// Solana Program ID
const PROGRAM_ID = new PublicKey("EmergencyAlert1111111111111111111111111111111")

// Program IDL (Interface Definition Language)
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
}

// Alert types enum
enum AlertType {
  PANIC = 0,
  GEOFENCE = 1,
  ANOMALY = 2
}

interface Alert {
  alertId: number
  tourist: string
  alertType: AlertType
  location: string
  timestamp: number
  isActive: boolean
  description: string
  alertTypeString: string
}

interface ContractStats {
  totalAlerts: number
  activeAlerts: number
  totalTourists: number
}

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface EmergencyAlertDashboardProps {
  programId?: string
}

export default function EmergencyAlertDashboard({ 
  programId = "EmergencyAlert1111111111111111111111111111111" 
}: EmergencyAlertDashboardProps) {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [provider, setProvider] = useState<AnchorProvider | null>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Alert data state
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Location tracking state
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)

  // Alert form state
  const [alertType, setAlertType] = useState<AlertType>(AlertType.PANIC)
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum)
        await provider.send("eth_requestAccounts", [])
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        
        setProvider(provider)
        setSigner(signer)
        setAccount(address)
        setIsConnected(true)
        
        // Initialize contract
        const contract = new ethers.Contract(contractAddress, EMERGENCY_ALERT_ABI, signer)
        setContract(contract)
        
        setSuccess("Wallet connected successfully!")
        setTimeout(() => setSuccess(""), 3000)
        
        // Load initial data
        await loadAlerts()
        await loadStats()
        
      } else {
        setError("MetaMask is not installed. Please install MetaMask to continue.")
      }
    } catch (err: any) {
      setError(`Failed to connect wallet: ${err.message}`)
    }
  }

  // Load recent alerts
  const loadAlerts = async () => {
    if (!contract) return

    try {
      setLoading(true)
      
      // Get recent alerts (last 20)
      const recentAlertIds = await contract.getRecentAlerts(20)
      
      const alertsData: Alert[] = []
      
      for (const alertId of recentAlertIds) {
        try {
          const alertData = await contract.getAlert(alertId)
          const alertTypeString = await contract.getAlertTypeString(alertData.alertType)
          
          alertsData.push({
            alertId: Number(alertId),
            tourist: alertData.tourist,
            alertType: Number(alertData.alertType),
            location: alertData.location,
            timestamp: Number(alertData.timestamp),
            isActive: alertData.isActive,
            description: alertData.description,
            alertTypeString
          })
        } catch (err) {
          console.warn(`Failed to load alert ${alertId}:`, err)
        }
      }
      
      setAlerts(alertsData)
      
    } catch (err: any) {
      setError(`Failed to load alerts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load contract statistics
  const loadStats = async () => {
    if (!contract) return

    try {
      const statsData = await contract.getContractStats()
      setStats({
        totalAlerts: Number(statsData.totalAlerts),
        activeAlerts: Number(statsData.activeAlerts),
        totalTourists: Number(statsData.totalTourists)
      })
    } catch (err: any) {
      console.error('Failed to load stats:', err)
    }
  }

  // Trigger emergency alert
  const triggerAlert = async () => {
    if (!contract || !location.trim()) {
      setError("Please fill in the location field")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      const tx = await contract.triggerAlert(alertType, location, description)
      
      setSuccess(`Emergency alert triggered! Transaction: ${tx.hash}`)
      await tx.wait()
      
      // Refresh data
      await loadAlerts()
      await loadStats()
      
      // Clear form
      setLocation("")
      setDescription("")
      
    } catch (err: any) {
      setError(`Failed to trigger alert: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Start listening for events
  const startListening = useCallback(async () => {
    if (!contract || isListening) return

    try {
      setIsListening(true)
      
      // Listen for AlertTriggered events
      contract.on('AlertTriggered', async (alertId, tourist, alertType, location, timestamp, description) => {
        console.log('New alert detected:', { alertId, tourist, alertType, location })
        
        // Refresh alerts and stats
        await loadAlerts()
        await loadStats()
        
        // Show notification
        setSuccess(`New ${getAlertTypeString(Number(alertType))} alert from ${tourist}`)
        setTimeout(() => setSuccess(""), 5000)
      })
      
      // Listen for AlertResolved events
      contract.on('AlertResolved', async (alertId, tourist) => {
        console.log('Alert resolved:', { alertId, tourist })
        
        // Refresh data
        await loadAlerts()
        await loadStats()
      })
      
      console.log('Started listening for emergency alert events')
      
    } catch (err: any) {
      setError(`Failed to start listening: ${err.message}`)
      setIsListening(false)
    }
  }, [contract, isListening])

  // Stop listening for events
  const stopListening = useCallback(() => {
    if (contract && isListening) {
      contract.removeAllListeners()
      setIsListening(false)
      console.log('Stopped listening for events')
    }
  }, [contract, isListening])

  // Get alert type string
  const getAlertTypeString = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "PANIC"
      case AlertType.GEOFENCE: return "GEOFENCE"
      case AlertType.ANOMALY: return "ANOMALY"
      default: return "UNKNOWN"
    }
  }

  // Get alert type color
  const getAlertTypeColor = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "text-red-400 bg-red-500/20"
      case AlertType.GEOFENCE: return "text-orange-400 bg-orange-500/20"
      case AlertType.ANOMALY: return "text-yellow-400 bg-yellow-500/20"
      default: return "text-gray-400 bg-gray-500/20"
    }
  }

  // Get alert priority
  const getAlertPriority = (type: AlertType): string => {
    switch (type) {
      case AlertType.PANIC: return "CRITICAL"
      case AlertType.GEOFENCE: return "HIGH"
      case AlertType.ANOMALY: return "MEDIUM"
      default: return "LOW"
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  // Format address
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (isConnected && contract) {
      const interval = setInterval(async () => {
        await loadAlerts()
        await loadStats()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isConnected, contract])

  // Start/stop listening when contract changes
  useEffect(() => {
    if (contract && isConnected) {
      startListening()
    }
    
    return () => {
      stopListening()
    }
  }, [contract, isConnected, startListening, stopListening])

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="glass-strong rounded-xl p-8 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🚨 Emergency Alert System</h1>
            <p className="text-white/70">Real-time tourist safety monitoring and emergency response</p>
          </div>

          {/* Connection Status */}
          {!isConnected ? (
            <div className="text-center py-8">
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Connect MetaMask Wallet
              </button>
              <p className="text-white/60 mt-4 text-sm">
                Connect your wallet to access the emergency alert system
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Info */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold mb-1">Connected Wallet</h3>
                    <p className="text-white/70 text-sm font-mono">{account}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                    <span className="text-white/70 text-sm">
                      {isListening ? 'Listening' : 'Not Listening'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Total Alerts</h4>
                    <p className="text-2xl font-bold text-white">{stats.totalAlerts}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Active Alerts</h4>
                    <p className="text-2xl font-bold text-red-400">{stats.activeAlerts}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-white/70 text-sm mb-1">Unique Tourists</h4>
                    <p className="text-2xl font-bold text-blue-400">{stats.totalTourists}</p>
                  </div>
                </div>
              )}

              {/* Trigger Alert Form */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <h3 className="text-white font-semibold mb-4">🚨 Trigger Emergency Alert</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Alert Type</label>
                    <select
                      value={alertType}
                      onChange={(e) => setAlertType(Number(e.target.value) as AlertType)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value={AlertType.PANIC}>🚨 PANIC</option>
                      <option value={AlertType.GEOFENCE}>📍 GEOFENCE</option>
                      <option value={AlertType.ANOMALY}>⚠️ ANOMALY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Location *</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., 40.7128,-74.0060 or Times Square, NYC"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details (optional)"
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
                <button
                  onClick={triggerAlert}
                  disabled={loading || !location.trim()}
                  className="mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? "Triggering..." : "🚨 Trigger Alert"}
                </button>
              </div>

              {/* Alerts Table */}
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">📊 Recent Emergency Alerts</h3>
                  <button
                    onClick={loadAlerts}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-1 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No alerts found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left text-white/70 text-sm py-3">ID</th>
                          <th className="text-left text-white/70 text-sm py-3">Type</th>
                          <th className="text-left text-white/70 text-sm py-3">Tourist</th>
                          <th className="text-left text-white/70 text-sm py-3">Location</th>
                          <th className="text-left text-white/70 text-sm py-3">Time</th>
                          <th className="text-left text-white/70 text-sm py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map((alert) => (
                          <motion.tr
                            key={alert.alertId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-3 text-white font-mono text-sm">
                              #{alert.alertId}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAlertTypeColor(alert.alertType)}`}>
                                {alert.alertTypeString}
                              </span>
                            </td>
                            <td className="py-3 text-white font-mono text-sm">
                              {formatAddress(alert.tourist)}
                            </td>
                            <td className="py-3 text-white text-sm max-w-xs truncate">
                              {alert.location}
                            </td>
                            <td className="py-3 text-white/70 text-sm">
                              {formatTimestamp(alert.timestamp)}
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                alert.isActive 
                                  ? 'text-red-400 bg-red-500/20' 
                                  : 'text-green-400 bg-green-500/20'
                              }`}>
                                {alert.isActive ? 'ACTIVE' : 'RESOLVED'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
                  >
                    <p className="text-red-300">{error}</p>
                  </motion.div>
                )}
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-green-500/20 border border-green-500/50 rounded-lg p-4"
                  >
                    <p className="text-green-300">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
