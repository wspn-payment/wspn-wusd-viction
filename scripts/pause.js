const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PAUSER_PRIVATE_KEY not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;

    console.log("Starting pause process...");
    console.log("Contract address:", contractAddress);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the pauser's private key
        const pauserWallet = new ethers.Wallet(process.env.PAUSER_PRIVATE_KEY, ethers.provider);
        console.log("Pauser address:", await pauserWallet.getAddress());

        // Connect the contract with the pauser's wallet
        const contractWithSigner = contract.connect(pauserWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Check if contract is already paused
        const isPaused = await contract.paused();
        if (isPaused) {
            console.log("\nContract is already paused!");
            return;
        }

        // Check if the signer has PAUSER_ROLE
        const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
        const hasPauserRole = await contract.hasRole(PAUSER_ROLE, await pauserWallet.getAddress());
        console.log("\nHas PAUSER_ROLE:", hasPauserRole);

        if (!hasPauserRole) {
            throw new Error("Address does not have PAUSER_ROLE");
        }

        // Perform pause
        console.log("\nPausing contract...");
        const tx = await contractWithSigner.pause({
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify contract is paused
        const isPausedAfter = await contract.paused();
        console.log("\nContract paused status:", isPausedAfter);

        if (isPausedAfter) {
            console.log("Contract successfully paused!");
        } else {
            console.log("Failed to pause contract!");
        }

    } catch (error) {
        console.error("\nPause failed:", error);
        if (error.message.includes("PAUSER_ROLE")) {
            console.error("The address does not have PAUSER_ROLE");
        }
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 