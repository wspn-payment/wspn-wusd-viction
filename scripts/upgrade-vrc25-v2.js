const { ethers, upgrades } = require("hardhat");

async function main() {
    // Get the proxy address from the previous deployment
    // Replace this with your deployed proxy address after running deploy-vrc25.js
    const proxyAddress = "0x4d359e559ef722C7471AA2c7a0167a830ac49ae4";
    
    console.log("Starting upgrade process...");
    console.log("Proxy address:", proxyAddress);

    try {
        // Get the contract factory and attach to existing proxy
        console.log("Getting contract factory...");
        const VRC25V2 = await ethers.getContractFactory("VRC26");
        const contract = VRC25V2.attach(proxyAddress);

        // Get the signer's address
        const [signer] = await ethers.getSigners();
        console.log("Signer address:", await signer.getAddress());

        // Check for UPGRADER_ROLE
        const UPGRADER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPGRADER_ROLE"));
        const hasRole = await contract.hasRole(UPGRADER_ROLE, await signer.getAddress());
        console.log("Has UPGRADER_ROLE:", hasRole);

        if (!hasRole) {
            throw new Error("Signer does not have UPGRADER_ROLE");
        }

        // Validate upgrade
        console.log("Validating upgrade...");
        await upgrades.validateUpgrade(proxyAddress, VRC25V2);

        console.log("Deploying new implementation and upgrading proxy...");
        const upgraded = await upgrades.upgradeProxy(proxyAddress, VRC25V2, {
            kind: 'uups',
            gasLimit: 15000000, // Increased gas limit
            gasPrice: 250000000
        });

        await upgraded.waitForDeployment();

        // Get the new implementation address
        const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(
            await upgraded.getAddress()
        );

        console.log("Upgrade successful!");
        console.log("Proxy address:", await upgraded.getAddress());
        console.log("New implementation address:", newImplementationAddress);

    } catch (error) {
        console.error("Upgrade failed:", error);
        if (error.message.includes("Signer does not have UPGRADER_ROLE")) {
            console.error("Your account needs to be granted UPGRADER_ROLE first");
        } else if (error.message.includes("delegatecall")) {
            console.error("This might be a delegatecall revert. Check if the proxy admin has UPGRADER_ROLE.");
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