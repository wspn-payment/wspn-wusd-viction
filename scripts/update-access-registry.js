const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.CONTRACT_ADMIN_PRIVATE_KEY) {
        throw new Error("CONTRACT_ADMIN_PRIVATE_KEY not found in .env file");
    }
    if (!process.env.ACCESS_REGISTRY_ADDRESS) {
        throw new Error("ACCESS_REGISTRY_ADDRESS not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // New Access Registry address
    const accessRegistryAddress = process.env.ACCESS_REGISTRY_ADDRESS;

    console.log("Starting access registry update process...");
    console.log("Contract address:", contractAddress);
    console.log("New Access Registry address:", accessRegistryAddress);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the admin's private key
        const adminWallet = new ethers.Wallet(process.env.CONTRACT_ADMIN_PRIVATE_KEY, ethers.provider);
        console.log("Admin address:", await adminWallet.getAddress());

        // Connect the contract with the admin's wallet
        const contractWithSigner = contract.connect(adminWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Check if the admin has CONTRACT_ADMIN_ROLE
        const CONTRACT_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CONTRACT_ADMIN_ROLE"));
        const hasAdminRole = await contract.hasRole(CONTRACT_ADMIN_ROLE, await adminWallet.getAddress());
        console.log("\nHas CONTRACT_ADMIN_ROLE:", hasAdminRole);

        if (!hasAdminRole) {
            throw new Error("Address does not have CONTRACT_ADMIN_ROLE");
        }

        // Check if contract is paused
        const isPaused = await contract.paused();
        if (isPaused) {
            throw new Error("Contract is paused. Cannot update access registry while paused.");
        }

        // Update access registry
        console.log("\nUpdating access registry...");
        const tx = await contractWithSigner.accessRegistryUpdate(accessRegistryAddress, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify the update
        console.log("\nAccess Registry update successful!");

    } catch (error) {
        console.error("\nAccess Registry update failed:", error);
        if (error.message.includes("CONTRACT_ADMIN_ROLE")) {
            console.error("The address does not have CONTRACT_ADMIN_ROLE");
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