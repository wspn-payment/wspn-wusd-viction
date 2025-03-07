const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Contract address (proxy address)
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Address to receive the MINTER_ROLE
    const addressToGrant = process.env.MINTER_ADDRESS;

    console.log("Starting grant MINTER_ROLE process...");
    console.log("Contract address:", contractAddress);
    console.log("Address to grant role to:", addressToGrant);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Get the signer
        const [signer] = await ethers.getSigners();
        console.log("Granting from address:", await signer.getAddress());

        // Calculate MINTER_ROLE hash
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        console.log("MINTER_ROLE hash:", MINTER_ROLE);

        // Check if the signer has DEFAULT_ADMIN_ROLE
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, await signer.getAddress());
        console.log("Signer has DEFAULT_ADMIN_ROLE:", hasAdminRole);

        if (!hasAdminRole) {
            throw new Error("Signer does not have DEFAULT_ADMIN_ROLE. Only admins can grant roles.");
        }

        // Check if address already has the role
        const hasRole = await contract.hasRole(MINTER_ROLE, addressToGrant);
        if (hasRole) {
            console.log("Address already has MINTER_ROLE");
            return;
        }

        // Grant the role
        console.log("Granting MINTER_ROLE...");
        const tx = await contract.grantRole(MINTER_ROLE, addressToGrant, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify the role was granted
        const roleGranted = await contract.hasRole(MINTER_ROLE, addressToGrant);
        console.log("Role granted successfully:", roleGranted);

    } catch (error) {
        console.error("Failed to grant role:", error);
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