const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Contract address from .env file
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    
    // Address to check balance
    const walletAddress = ""
    console.log("Starting balance check process...");
    console.log("Contract address:", contractAddress);
    console.log("Wallet address:", walletAddress);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        const tokenDecimals = await contract.decimals();

        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);
        console.log("Decimals:", tokenDecimals);

        // Get balance
        const balance = await contract.balanceOf(walletAddress);
        
        console.log("\nBalance Information:");
        console.log("Raw balance:", balance.toString());
        console.log("Formatted balance:", ethers.formatUnits(balance, tokenDecimals), tokenSymbol);

    } catch (error) {
        console.error("Failed to check balance:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 