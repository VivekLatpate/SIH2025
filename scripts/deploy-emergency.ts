import { ethers } from "hardhat";

async function main() {
  console.log("Deploying EmergencyAlert contract...");

  const EmergencyAlert = await ethers.getContractFactory("EmergencyAlert");
  const emergencyAlert = await EmergencyAlert.deploy();

  await emergencyAlert.waitForDeployment();

  const address = await emergencyAlert.getAddress();
  console.log("EmergencyAlert deployed to:", address);

  // Get the owner address
  const owner = await emergencyAlert.owner();
  console.log("Contract owner:", owner);

  // Add some default emergency contacts
  console.log("Adding default emergency contacts...");
  
  // Note: In a real deployment, you would add actual emergency contact addresses
  // For demo purposes, we'll use the owner address as a placeholder
  await emergencyAlert.addEmergencyContact("POLICE", owner);
  await emergencyAlert.addEmergencyContact("AMBULANCE", owner);
  await emergencyAlert.addEmergencyContact("TOURISM_AUTHORITY", owner);

  console.log("Default emergency contacts added");

  // Get contract statistics
  const stats = await emergencyAlert.getContractStats();
  console.log("Contract Statistics:");
  console.log("- Total Alerts:", stats.totalAlerts.toString());
  console.log("- Active Alerts:", stats.activeAlerts.toString());
  console.log("- Total Tourists:", stats.totalTourists.toString());

  // Get contact types
  const contactTypes = await emergencyAlert.getContactTypes();
  console.log("Emergency Contact Types:", contactTypes);

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Contract Address:", address);
  console.log("Network:", await emergencyAlert.runner?.provider?.getNetwork());
  console.log("\nNext steps:");
  console.log("1. Update the contract address in your frontend component");
  console.log("2. Update the contract address in your backend listener");
  console.log("3. Start the backend listener: cd backend && npm start");
  console.log("4. Test the system by triggering alerts from the frontend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
