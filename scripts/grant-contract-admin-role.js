const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.PRIVATE_KEY) {
        throw new Error("PRIVATE_KEY not found in .env file");
    }
    if (!process.env.CONTRACT_ADMIN_ADDRESS) {
        throw new Error("CONTRACT_ADMIN_ADDRESS not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Address to receive the CONTRACT_ADMIN_ROLE
    const addressToGrant = process.env.CONTRACT_ADMIN_ADDRESS;

    console.log("Starting grant CONTRACT_ADMIN_ROLE process...");
    console.log("Contract address:", contractAddress);
    console.log("Address to grant role to:", addressToGrant);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the admin's private key
        const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
        console.log("Admin address:", await adminWallet.getAddress());

        // Connect the contract with the admin's wallet
        const contractWithSigner = contract.connect(adminWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Calculate CONTRACT_ADMIN_ROLE hash
        const CONTRACT_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CONTRACT_ADMIN_ROLE"));
        console.log("CONTRACT_ADMIN_ROLE hash:", CONTRACT_ADMIN_ROLE);

        // Check if the admin has DEFAULT_ADMIN_ROLE
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, await adminWallet.getAddress());
        console.log("Admin has DEFAULT_ADMIN_ROLE:", hasAdminRole);

        if (!hasAdminRole) {
            throw new Error("Admin does not have DEFAULT_ADMIN_ROLE. Only admins can grant roles.");
        }

        // Check if address already has the role
        const hasRole = await contract.hasRole(CONTRACT_ADMIN_ROLE, addressToGrant);
        if (hasRole) {
            console.log("\nAddress already has CONTRACT_ADMIN_ROLE");
            return;
        }

        // Grant the role
        console.log("\nGranting CONTRACT_ADMIN_ROLE...");
        const tx = await contractWithSigner.grantRole(CONTRACT_ADMIN_ROLE, addressToGrant, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify the role was granted
        const roleGranted = await contract.hasRole(CONTRACT_ADMIN_ROLE, addressToGrant);
        console.log("\nRole granted successfully:", roleGranted);

        if (roleGranted) {
            console.log("CONTRACT_ADMIN_ROLE successfully granted!");
        } else {
            console.log("Failed to grant CONTRACT_ADMIN_ROLE!");
        }

    } catch (error) {
        console.error("\nFailed to grant role:", error);
        if (error.message.includes("DEFAULT_ADMIN_ROLE")) {
            console.error("Your account needs to have DEFAULT_ADMIN_ROLE to grant roles");
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