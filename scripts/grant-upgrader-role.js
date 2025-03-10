const { ethers } = require("hardhat");

async function main() {
    // Contract address (proxy address)
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Address to receive the UPGRADER_ROLE (replace with the address you want to grant the role to)
    const addressToGrant = process.env.UPGRADER_ADDRESS;

    console.log("Starting grant UPGRADER_ROLE process...");
    console.log("Contract address:", contractAddress);
    console.log("Address to grant role to:", addressToGrant);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Get the signer
        const [signer] = await ethers.getSigners();
        console.log("Granting from address:", await signer.getAddress());

        // Calculate UPGRADER_ROLE hash
        const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));
        console.log("UPGRADER_ROLE hash:", UPGRADER_ROLE);

        // Check if the signer has DEFAULT_ADMIN_ROLE
        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, await signer.getAddress());
        console.log("Signer has DEFAULT_ADMIN_ROLE:", hasAdminRole);

        if (!hasAdminRole) {
            throw new Error("Signer does not have DEFAULT_ADMIN_ROLE. Only admins can grant roles.");
        }

        // Grant the role
        console.log("Granting UPGRADER_ROLE...");
        const tx = await contract.grantRole(UPGRADER_ROLE, addressToGrant, {
            gasLimit: 100000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify the role was granted
        const hasRole = await contract.hasRole(UPGRADER_ROLE, addressToGrant);
        console.log("Role granted successfully:", hasRole);

    } catch (error) {
        console.error("Failed to grant role:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 