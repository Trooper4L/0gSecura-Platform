const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to 0G Galileo Testnet...");
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Verify we're on 0G Galileo Testnet
  if (network.chainId !== 16601n) {
    throw new Error(`❌ Wrong network! Expected Chain ID 16601 (0G Galileo), got ${network.chainId}`);
  }

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);
  
  console.log(`👤 Deployer: ${deployerAddress}`);
  console.log(`💰 Deployer balance: ${ethers.formatEther(deployerBalance)} OG`);
  
  // Check minimum balance (0.1 OG for deployment)
  const minimumBalance = ethers.parseEther("0.1");
  if (deployerBalance < minimumBalance) {
    throw new Error(`❌ Insufficient balance! Need at least 0.1 OG, have ${ethers.formatEther(deployerBalance)} OG`);
  }

  console.log("\n📋 Deployment Plan:");
  console.log("1. Deploy OGSecuraAuth contract");
  console.log("2. Verify deployment");
  console.log("3. Set up initial configuration");
  
  // Deploy OGSecuraAuth contract
  console.log("\n🔨 Deploying OGSecuraAuth contract...");
  
  const OGSecuraAuth = await ethers.getContractFactory("OGSecuraAuth");
  
  // Estimate gas for deployment
  const deploymentData = OGSecuraAuth.interface.encodeDeploy([]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData
  });
  console.log(`⛽ Estimated gas for deployment: ${estimatedGas.toString()}`);
  
  // Deploy with explicit gas limit
  const contract = await OGSecuraAuth.deploy({
    gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
  });
  
  console.log(`📄 Transaction hash: ${contract.deploymentTransaction().hash}`);
  console.log("⏳ Waiting for deployment confirmation...");
  
  // Wait for deployment
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log(`✅ OGSecuraAuth deployed to: ${contractAddress}`);
  
  // Verify deployment by calling a read function
  console.log("\n🔍 Verifying deployment...");
  try {
    const version = await contract.VERSION();
    const networkInfo = await contract.getNetworkInfo();
    
    console.log(`📊 Contract version: ${version}`);
    console.log(`🌐 Network verification: Chain ID ${networkInfo.chainId}, is 0G Network: ${networkInfo.isOGNetwork}`);
    
    if (!networkInfo.isOGNetwork) {
      throw new Error("❌ Contract deployed on wrong network!");
    }
    
  } catch (error) {
    console.error("❌ Deployment verification failed:", error.message);
    throw error;
  }
  
  // Get contract statistics
  const stats = await contract.getContractStats();
  console.log(`📈 Initial stats - Users: ${stats.totalUsers}, Scans: ${stats.totalScans}, Threats: ${stats.totalThreats}`);
  
  // Output deployment summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: 0G Galileo Testnet (${network.chainId})`);
  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Gas Used: ${estimatedGas.toString()}`);
  console.log(`Block Explorer: https://chainscan-galileo.0g.ai/address/${contractAddress}`);
  console.log("=".repeat(50));
  
  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    chainId: Number(network.chainId),
    network: "0G Galileo Testnet",
    deployer: deployerAddress,
    deploymentHash: contract.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    version: await contract.VERSION()
  };
  
  console.log("\n💾 Saving deployment information...");
  const fs = require('fs');
  const path = require('path');
  
  // Ensure deployment directory exists
  const deployDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  
  // Save deployment info
  fs.writeFileSync(
    path.join(deployDir, 'og-galileo.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Update environment variables file
  const envUpdate = `\n# 0gSecura Contract Deployment (${new Date().toISOString()})\nNEXT_PUBLIC_AUTH_CONTRACT_ADDRESS=${contractAddress}\n`;
  console.log("\n📝 Environment variable to add to .env.local:");
  console.log(envUpdate.trim());
  
  console.log("\n✨ Deployment completed successfully!");
  console.log("📚 Next steps:");
  console.log("1. Add the contract address to your .env.local file");
  console.log("2. Update your frontend to use the deployed contract");
  console.log("3. Test the authentication flow");
  console.log("4. Register the first admin user");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
