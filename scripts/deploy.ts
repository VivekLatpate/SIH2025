import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SafetyEscrow contract...");

  const SafetyEscrow = await ethers.getContractFactory("SafetyEscrow");
  const safetyEscrow = await SafetyEscrow.deploy();

  await safetyEscrow.waitForDeployment();

  const address = await safetyEscrow.getAddress();
  console.log("SafetyEscrow deployed to:", address);

  // Get the owner address
  const owner = await safetyEscrow.owner();
  console.log("Contract owner:", owner);

  // Verify the contract is working by checking some constants
  const slaTimeout = await safetyEscrow.SLA_TIMEOUT_HOURS();
  const penaltyPercentage = await safetyEscrow.PENALTY_PERCENTAGE();
  
  console.log("SLA Timeout Hours:", slaTimeout.toString());
  console.log("Penalty Percentage:", penaltyPercentage.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
