const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.MINTER_PRIVATE_KEY) {
        throw new Error("MINTER_PRIVATE_KEY not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Spender address (address being approved to spend tokens)
    const spenderAddress = "0x2f85f9b7413D30Dc861c3b23F79fd66f34b2c9e4";
    
    // Amount to approve
    const approveAmount = ethers.parseUnits("15", 18);

    console.log("Starting approve process...");
    console.log("Contract address:", contractAddress);
    console.log("Spender address:", spenderAddress);
    console.log("Amount to approve:", ethers.formatUnits(approveAmount, 18), "tokens");

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the owner's private key
        const ownerWallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, ethers.provider);
        console.log("Owner address:", await ownerWallet.getAddress());

        // Connect the contract with the owner's wallet
        const contractWithSigner = contract.connect(ownerWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Check current allowance
        const currentAllowance = await contract.allowance(await ownerWallet.getAddress(), spenderAddress);
        console.log("\nCurrent allowance:", ethers.formatUnits(currentAllowance, 18), tokenSymbol);

        // Perform approve
        console.log("\nApproving tokens...");
        const tx = await contractWithSigner.approve(spenderAddress, approveAmount, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify new allowance
        const newAllowance = await contract.allowance(await ownerWallet.getAddress(), spenderAddress);
        console.log("\nNew allowance:", ethers.formatUnits(newAllowance, 18), tokenSymbol);

        if (newAllowance.toString() === approveAmount.toString()) {
            console.log("Approve successful!");
        } else {
            console.log("Approve amount mismatch!");
        }

    } catch (error) {
        console.error("\nApprove failed:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 