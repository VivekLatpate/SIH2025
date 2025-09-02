import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Program ID (placeholder - will be generated during actual deployment)
const PROGRAM_ID = new PublicKey("11111111111111111111111111111112");

async function main() {
  console.log("🚀 Solana Emergency Alert System - Simple Deployment");
  console.log("==================================================");

  try {
    // Connect to Solana devnet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    console.log("✅ Connected to Solana devnet");

    // Create a new keypair for the authority
    const authority = Keypair.generate();
    console.log("🔑 Generated authority keypair:", authority.publicKey.toString());

    // Get PDA for emergency alert
    const [emergencyAlertPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("emergency_alert")],
      PROGRAM_ID
    );

    console.log("📍 Emergency Alert PDA:", emergencyAlertPDA.toString());

    // Check if we have enough SOL for deployment
    const balance = await connection.getBalance(authority.publicKey);
    console.log("💰 Authority balance:", balance / 1e9, "SOL");

    if (balance < 0.1e9) {
      console.log("⚠️  Warning: Low balance. You may need to fund the authority account.");
      console.log("   Use Solana faucet: https://faucet.solana.com/");
    }

    console.log("\n=== SOLANA DEPLOYMENT INFO ===");
    console.log("Program ID:", PROGRAM_ID.toString());
    console.log("Authority:", authority.publicKey.toString());
    console.log("Emergency Alert PDA:", emergencyAlertPDA.toString());
    console.log("Network: Solana Devnet");
    console.log("RPC URL: https://api.devnet.solana.com");

    console.log("\n📋 Next Steps:");
    console.log("1. Deploy your Solana program using Anchor CLI:");
    console.log("   anchor build");
    console.log("   anchor deploy --provider.cluster devnet");
    console.log("");
    console.log("2. Update the program ID in your frontend component");
    console.log("3. Update the program ID in your backend listener");
    console.log("4. Start the backend listener: cd backend && npm start");
    console.log("5. Test the system by triggering alerts from the frontend");

    // Save deployment info
    const deploymentInfo = {
      programId: PROGRAM_ID.toString(),
      authority: authority.publicKey.toString(),
      emergencyAlertPDA: emergencyAlertPDA.toString(),
      network: "devnet",
      rpcUrl: "https://api.devnet.solana.com",
      timestamp: new Date().toISOString(),
      note: "This is a placeholder deployment. Use Anchor CLI to deploy the actual program."
    };

    fs.writeFileSync(
      path.join(__dirname, '../solana-deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to solana-deployment.json");

    console.log("\n🎯 For actual program deployment, use:");
    console.log("   anchor build && anchor deploy --provider.cluster devnet");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
