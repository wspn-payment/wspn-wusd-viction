const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.SPENDER_PRIVATE_KEY) {
        throw new Error("SPENDER_PRIVATE_KEY not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Owner address (address from which tokens will be transferred)
    const ownerAddress = "0xA469e1b097510E15379d57e5713dbF26E0c377B1";
    
    // Recipient address (address that will receive the tokens)
    const recipientAddress = "0x1F580625d31D52A9D5B3e485194B97E8d3F02d24";
    
    // Amount to transfer
    const transferAmount = ethers.parseUnits("14", 18);

    console.log("Starting transferFrom process...");
    console.log("Contract address:", contractAddress);
    console.log("Owner address:", ownerAddress);
    console.log("Recipient address:", recipientAddress);
    console.log("Amount to transfer:", ethers.formatUnits(transferAmount, 18), "tokens");

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the spender's private key
        const spenderWallet = new ethers.Wallet(process.env.SPENDER_PRIVATE_KEY, ethers.provider);
        console.log("Spender address:", await spenderWallet.getAddress());

        // Connect the contract with the spender's wallet
        const contractWithSigner = contract.connect(spenderWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Check allowance
        const allowance = await contract.allowance(ownerAddress, await spenderWallet.getAddress());
        console.log("\nCurrent allowance:", ethers.formatUnits(allowance, 18), tokenSymbol);

        if (allowance < transferAmount) {
            throw new Error("Insufficient allowance for transfer");
        }

        // Get initial balances
        const ownerInitialBalance = await contract.balanceOf(ownerAddress);
        const recipientInitialBalance = await contract.balanceOf(recipientAddress);
        
        console.log("\nInitial Balances:");
        console.log("Owner:", ethers.formatUnits(ownerInitialBalance, 18), tokenSymbol);
        console.log("Recipient:", ethers.formatUnits(recipientInitialBalance, 18), tokenSymbol);

        // Perform transferFrom
        console.log("\nInitiating transferFrom...");
        const tx = await contractWithSigner.transferFrom(ownerAddress, recipientAddress, transferAmount, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Get final balances
        const ownerFinalBalance = await contract.balanceOf(ownerAddress);
        const recipientFinalBalance = await contract.balanceOf(recipientAddress);
        
        console.log("\nFinal Balances:");
        console.log("Owner:", ethers.formatUnits(ownerFinalBalance, 18), tokenSymbol);
        console.log("Recipient:", ethers.formatUnits(recipientFinalBalance, 18), tokenSymbol);

        // Check remaining allowance
        const remainingAllowance = await contract.allowance(ownerAddress, await spenderWallet.getAddress());
        console.log("\nRemaining allowance:", ethers.formatUnits(remainingAllowance, 18), tokenSymbol);

        // Verify transfer was successful
        const ownerDecrease = ownerInitialBalance - ownerFinalBalance;
        const recipientIncrease = recipientFinalBalance - recipientInitialBalance;

        console.log("\nTransfer Verification:");
        console.log("Owner decrease:", ethers.formatUnits(ownerDecrease, 18), tokenSymbol);
        console.log("Recipient increase:", ethers.formatUnits(recipientIncrease, 18), tokenSymbol);

        if (ownerDecrease.toString() === transferAmount.toString() &&
            recipientIncrease.toString() === transferAmount.toString()) {
            console.log("\nTransferFrom successful!");
        } else {
            console.log("\nTransferFrom amount mismatch!");
        }

    } catch (error) {
        console.error("\nTransferFrom failed:", error);
        if (error.message.includes("insufficient allowance")) {
            console.error("Insufficient allowance for transfer");
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