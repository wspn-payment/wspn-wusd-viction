const { ethers } = require("hardhat");

async function main() {
    // List of contracts to measure


        try {
            // Get the contract factory
            const Contract = await ethers.getContractFactory("VRC25");
            
            // Get the bytecode
            const bytecode = Contract.bytecode;
            const deployedBytecode = Contract.deployedBytecode;

            // Show calculation steps
            console.log("\nBytecode calculation steps:");
            console.log("Total hex string length:", bytecode.length, "characters");
            console.log("Remove '0x' prefix:", bytecode.length - 2, "characters");
            console.log("Convert to bytes (divide by 2):", (bytecode.length - 2) / 2, "bytes");

            // Calculate final sizes
            const bytecodeSize = bytecode.length / 2 - 1; // Same as (bytecode.length - 2) / 2
            // const deployedSize = deployedBytecode.length / 2 - 1;

            console.log("\nFinal sizes:");
            console.log(`Creation bytecode: ${bytecodeSize} bytes (${(bytecodeSize / 1024).toFixed(2)} KB)`);
            // console.log(`Deployed bytecode: ${deployedSize} bytes (${(deployedSize / 1024).toFixed(2)} KB)`);

            // Show first few bytes as example
            console.log("\nFirst 32 characters of bytecode:");
            console.log(bytecode.substring(0, 32));
            console.log("(Note: '0x' at start, then each 2 characters = 1 byte)");

        } catch (error) {
            console.error(`Error measuring VRC25:`, error.message);
        }
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 