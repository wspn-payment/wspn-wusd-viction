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
    
    // Address to send tokens to
    const recipientAddress = "";
    
    // Amount to transfer (e.g., 100 tokens with 18 decimals)
    const transferAmount = ethers.parseUnits("100", 18);

    console.log("Starting transfer process...");
    console.log("Contract address:", contractAddress);
    console.log("Recipient address:", recipientAddress);
    console.log("Amount to transfer:", ethers.formatUnits(transferAmount, 18), "tokens");

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the sender's private key
        const senderWallet = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY, ethers.provider);
        console.log("Sender address:", await senderWallet.getAddress());

        // Connect the contract with the sender's wallet
        const contractWithSigner = contract.connect(senderWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);

        // Get initial balances
        const senderInitialBalance = await contract.balanceOf(await senderWallet.getAddress());
        const recipientInitialBalance = await contract.balanceOf(recipientAddress);
        
        console.log("\nInitial Balances:");
        console.log("Sender:", ethers.formatUnits(senderInitialBalance, 18), tokenSymbol);
        console.log("Recipient:", ethers.formatUnits(recipientInitialBalance, 18), tokenSymbol);

        // Check if sender has enough balance
        if (senderInitialBalance < transferAmount) {
            throw new Error("Insufficient balance for transfer");
        }

        // Perform transfer
        console.log("\nInitiating transfer...");
        const tx = await contractWithSigner.transfer(recipientAddress, transferAmount, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Get final balances
        const senderFinalBalance = await contract.balanceOf(await senderWallet.getAddress());
        const recipientFinalBalance = await contract.balanceOf(recipientAddress);
        
        console.log("\nFinal Balances:");
        console.log("Sender:", ethers.formatUnits(senderFinalBalance, 18), tokenSymbol);
        console.log("Recipient:", ethers.formatUnits(recipientFinalBalance, 18), tokenSymbol);

        // Verify transfer was successful
        const senderDecrease = senderInitialBalance - senderFinalBalance;
        const recipientIncrease = recipientFinalBalance - recipientInitialBalance;

        console.log("\nTransfer Verification:");
        console.log("Sender decrease:", ethers.formatUnits(senderDecrease, 18), tokenSymbol);
        console.log("Recipient increase:", ethers.formatUnits(recipientIncrease, 18), tokenSymbol);

        if (senderDecrease.toString() === transferAmount.toString() &&
            recipientIncrease.toString() === transferAmount.toString()) {
            console.log("\nTransfer successful!");
        } else {
            console.log("\nTransfer amount mismatch!");
        }

    } catch (error) {
        console.error("\nTransfer failed:", error);
        if (error.message.includes("insufficient balance")) {
            console.error("Sender has insufficient balance");
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