const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Owner address (address that approved the tokens)
    const ownerAddress = "";
    
    // Spender address (address that was approved to spend tokens)
    const spenderAddress = "";

    console.log("Starting allowance check process...");
    console.log("Contract address:", contractAddress);
    console.log("Owner address:", ownerAddress);
    console.log("Spender address:", spenderAddress);

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

        // Check allowance
        const allowance = await contract.allowance(ownerAddress, spenderAddress);
        
        console.log("\nAllowance Information:");
        console.log("Raw allowance:", allowance.toString());
        console.log("Formatted allowance:", ethers.formatUnits(allowance, tokenDecimals), tokenSymbol);

        // Get owner's balance for context
        const ownerBalance = await contract.balanceOf(ownerAddress);
        console.log("\nOwner Balance Information:");
        console.log("Raw balance:", ownerBalance.toString());
        console.log("Formatted balance:", ethers.formatUnits(ownerBalance, tokenDecimals), tokenSymbol);

        // Calculate percentage of balance approved (if balance > 0)
        if (ownerBalance > 0) {
            const percentageApproved = (allowance * BigInt(100)) / ownerBalance;
            console.log("\nPercentage of balance approved:", percentageApproved.toString() + "%");
        }

    } catch (error) {
        console.error("Failed to check allowance:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 