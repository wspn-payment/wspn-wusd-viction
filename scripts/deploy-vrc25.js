const { ethers, upgrades } = require("hardhat");

async function main() {
    console.log("Deploying VRC25 contract...");
    
    // Get the contract factory
    const VRC25 = await ethers.getContractFactory("VRC25");
    
    // Deploy parameters
    const name = "Worldwide USD";
    const symbol = "WUSD";
    const defaultAdmin = process.env.CONTRACT_ADMIN_ADDRESS;
    const minter = process.env.MINTER_ADDRESS;
    const pauser = process.env.PAUSER_ADDRESS;
    const decimals = 18;

    console.log("Starting deployProxy...");
    console.log("Deployment parameters:");
    console.log(`Name: ${name}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Default Admin: ${defaultAdmin}`);
    console.log(`Minter: ${minter}`);
    console.log(`Pauser: ${pauser}`);
    console.log(`Decimals: ${decimals}`);

    try {
        // Deploy proxy with implementation
        const vrc25 = await upgrades.deployProxy(
            VRC25, 
            [name, symbol, defaultAdmin, minter, pauser, decimals],
            { 
                initializer: 'initialize',
                kind: 'uups',
                gasLimit: 10000000,
                gasPrice: 250000000
            }
        );

        await vrc25.waitForDeployment();
        
        const implementationAddress = await upgrades.erc1967.getImplementationAddress(
            await vrc25.getAddress()
        );

        console.log("Deployment successful!");
        console.log("Proxy address:", await vrc25.getAddress());
        console.log("Implementation address:", implementationAddress);
        
    } catch (error) {
        console.error("Deployment failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 