import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Transaction, SystemProgram, PublicKey, TransactionInstruction } from '@solana/web3.js'
import QRCode from 'qrcode.react'

type DigitalIDForm = {
  fullName: string
  idNumber: string
  emergencyContact: string
  visitStartDate: string
  visitEndDate: string
  destination: string
}

type CreateIDModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (id: any) => void
}

export default function CreateIDModal({ isOpen, onClose, onSuccess }: CreateIDModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [formData, setFormData] = useState<DigitalIDForm>({
    fullName: '',
    idNumber: '',
    emergencyContact: '',
    visitStartDate: '',
    visitEndDate: '',
    destination: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }, [])

  const generateIDHash = useCallback((data: DigitalIDForm) => {
    // Simple hash generation (in production, use proper hashing)
    const jsonString = JSON.stringify(data)
    return btoa(jsonString).slice(0, 32)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!connected || !publicKey) {
      alert('Please connect your wallet first')
      return
    }

    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.fullName || !formData.idNumber || !formData.emergencyContact || 
          !formData.visitStartDate || !formData.visitEndDate || !formData.destination) {
        alert('Please fill in all required fields.')
        setIsSubmitting(false)
        return
      }

      // Validate dates
      const startDate = new Date(formData.visitStartDate)
      const endDate = new Date(formData.visitEndDate)
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        alert('Please enter valid dates.')
        setIsSubmitting(false)
        return
      }

      if (endDate <= startDate) {
        alert('End date must be after start date.')
        setIsSubmitting(false)
        return
      }

      if (endDate <= new Date()) {
        alert('End date must be in the future.')
        setIsSubmitting(false)
        return
      }

      // Generate ID hash and metadata
      const idHash = generateIDHash(formData)
      const expiryTimestamp = endDate.getTime()
      
      // Store form data locally (in production, use IPFS/Arweave)
      const digitalID = {
        id: idHash,
        ...formData,
        createdAt: new Date().toISOString(),
        expiryTimestamp,
        isActive: true
      }
      
      // Save to localStorage for now
      const existingIDs = JSON.parse(localStorage.getItem('digitalIDs') || '[]')
      existingIDs.push(digitalID)
      localStorage.setItem('digitalIDs', JSON.stringify(existingIDs))

      // Create Solana transaction
      const transaction = new Transaction()
      
      // Add a memo instruction with ID hash and expiry
      const memoData = `DIGITAL_ID:${idHash}:${expiryTimestamp}`
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
        data: Buffer.from(memoData, 'utf8')
      })
      
      transaction.add(memoInstruction)
      
      // Add a small transfer to make it a valid transaction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: publicKey, // Self transfer
        lamports: 1000 // 0.000001 SOL
      })
      
      transaction.add(transferInstruction)

      // Send transaction
      const signature = await sendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      setTransactionHash(signature)
      
      // Generate QR code data
      const qrData = {
        name: formData.fullName,
        idNumber: formData.idNumber,
        validUntil: formData.visitEndDate,
        txHash: signature,
        id: idHash
      }
      
      setGeneratedQR(JSON.stringify(qrData))
      setShowSuccess(true)
      
      // Notify parent component
      onSuccess({
        ...digitalID,
        transactionHash: signature
      })
      
    } catch (error) {
      console.error('Error creating Digital ID:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [connected, publicKey, sendTransaction, connection, onSuccess])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedQR)
    alert('ID data copied to clipboard!')
  }, [generatedQR])

  const resetAndClose = useCallback(() => {
    setFormData({
      fullName: '',
      idNumber: '',
      emergencyContact: '',
      visitStartDate: '',
      visitEndDate: '',
      destination: ''
    })
    setShowSuccess(false)
    setTransactionHash('')
    setGeneratedQR('')
    onClose()
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border border-cyan-500/20"
          >
            {!showSuccess ? (
              // Form View
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold gradient-text">Create Digital ID</h2>
                  <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-white/50 focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Passport / Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        name="idNumber"
                        value={formData.idNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-white/50 focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="Enter ID number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Emergency Contact *
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-white/50 focus:border-cyan-500/50 focus:outline-none transition-colors"
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Visit Start Date *
                      </label>
                      <input
                        type="date"
                        name="visitStartDate"
                        value={formData.visitStartDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]} // Today or later
                        required
                        className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Visit End Date *
                      </label>
                      <input
                        type="date"
                        name="visitEndDate"
                        value={formData.visitEndDate}
                        onChange={handleInputChange}
                        min={formData.visitStartDate || new Date().toISOString().split('T')[0]} // Start date or today
                        required
                        className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Destination / Trip Plan *
                    </label>
                    <textarea
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-white/50 focus:border-cyan-500/50 focus:outline-none transition-colors resize-none"
                      placeholder="Describe your destination and travel plans..."
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 glass rounded-xl border border-white/20 text-white hover:border-white/40 transition-colors"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={!connected || isSubmitting}
                      whileHover={{ scale: connected ? 1.02 : 1 }}
                      whileTap={{ scale: connected ? 0.98 : 1 }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? 'Creating...' : 'Generate Digital ID'}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : (
              // Success View
              <div className="p-6 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Digital ID Created Successfully!
                  </h2>
                  <p className="text-white/80">
                    Valid until {new Date(formData.visitEndDate).toLocaleDateString()}
                  </p>
                </div>

                {transactionHash && (
                  <div className="glass rounded-xl p-4 mb-6">
                    <p className="text-sm text-white/80 mb-2">Transaction Hash:</p>
                    <a
                      href={`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-mono break-all underline"
                    >
                      {transactionHash}
                    </a>
                  </div>
                )}

                {generatedQR && (
                  <div className="glass rounded-xl p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Digital ID QR Code</h3>
                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                      <QRCode value={generatedQR} size={200} />
                    </div>
                    <motion.button
                      onClick={copyToClipboard}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-white text-sm font-semibold"
                    >
                      Copy ID Data
                    </motion.button>
                  </div>
                )}

                <motion.button
                  onClick={resetAndClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white font-semibold"
                >
                  Done
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
