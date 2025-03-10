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

    // Contract address (proxy address)
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Minter address that has MINTER_ROLE
    const minterAddress = process.env.MINTER_ADDRESS;
    
    // Amount to mint (e.g., 1000 tokens with 18 decimals)
    const amountToMint = ethers.parseUnits("1000", 18);
    
    // Address to receive the minted tokens (in this case, minting to the same address)
    const recipientAddress = minterAddress;

    console.log("Starting mint process...");
    console.log("Contract address:", contractAddress);
    console.log("Minter address:", minterAddress);
    console.log("Recipient address:", recipientAddress);
    console.log("Amount to mint:", ethers.formatUnits(amountToMint, 18), "tokens");

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a new wallet instance with the private key
        const minterPrivateKey = process.env.MINTER_PRIVATE_KEY;
        console.log("Minter private key loaded:", minterPrivateKey ? "Yes" : "No");
        
        const minterWallet = new ethers.Wallet(minterPrivateKey, ethers.provider);
        console.log("Minter wallet created with address:", await minterWallet.getAddress());

        // Connect the contract with the minter's wallet
        const contractWithSigner = contract.connect(minterWallet);

        // Verify MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasMinterRole = await contract.hasRole(MINTER_ROLE, minterAddress);
        console.log("Has MINTER_ROLE:", hasMinterRole);

        if (!hasMinterRole) {
            throw new Error("Address does not have MINTER_ROLE");
        }

        // Get initial balance
        const initialBalance = await contract.balanceOf(recipientAddress);
        console.log("Initial balance:", ethers.formatUnits(initialBalance, 18), "tokens");

        // Perform mint
        console.log("Minting tokens...");
        const tx = await contractWithSigner.mint(recipientAddress, amountToMint, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Get final balance
        const finalBalance = await contract.balanceOf(recipientAddress);
        console.log("Final balance:", ethers.formatUnits(finalBalance, 18), "tokens");
        
        // Verify mint was successful
        const mintedAmount = finalBalance - initialBalance;
        console.log("Minted amount:", ethers.formatUnits(mintedAmount, 18), "tokens");

        if (mintedAmount.toString() === amountToMint.toString()) {
            console.log("Mint successful!");
        } else {
            console.log("Mint amount mismatch!");
        }

    } catch (error) {
        console.error("Mint failed:", error);
        if (error.message.includes("MINTER_ROLE")) {
            console.error("The address does not have MINTER_ROLE");
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