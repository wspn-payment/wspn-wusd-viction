const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    // Check if environment variables are set
    if (!process.env.CONTRACT_ADDRESS) {
        throw new Error("CONTRACT_ADDRESS not found in .env file");
    }
    if (!process.env.RECOVERY_PRIVATE_KEY) {
        throw new Error("RECOVERY_PRIVATE_KEY not found in .env file");
    }

    // Contract address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    // Address to recover tokens from
    const accountToRecover = "";
    if (!accountToRecover) {
        throw new Error("RECOVER_FROM_ADDRESS not found in .env file");
    }

    console.log("Starting token recovery process...");
    console.log("Contract address:", contractAddress);
    console.log("Account to recover from:", accountToRecover);

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Create a wallet instance with the recovery role's private key
        const recoveryWallet = new ethers.Wallet(process.env.RECOVERY_PRIVATE_KEY, ethers.provider);
        console.log("Recovery wallet address:", await recoveryWallet.getAddress());

        // Connect the contract with the recovery wallet
        const contractWithSigner = contract.connect(recoveryWallet);

        // Get token info
        const tokenName = await contract.name();
        const tokenSymbol = await contract.symbol();
        const tokenDecimals = await contract.decimals();
        console.log("\nToken Information:");
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);
        console.log("Decimals:", tokenDecimals);

        // Check if the signer has RECOVERY_ROLE
        const RECOVERY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RECOVERY_ROLE"));
        const hasRecoveryRole = await contract.hasRole(RECOVERY_ROLE, await recoveryWallet.getAddress());
        console.log("\nHas RECOVERY_ROLE:", hasRecoveryRole);

        if (!hasRecoveryRole) {
            throw new Error("Address does not have RECOVERY_ROLE");
        }

        // Get balance of account to recover from
        const balance = await contract.balanceOf(accountToRecover);
        console.log("\nAccount balance:", ethers.formatUnits(balance, tokenDecimals), tokenSymbol);

        if (balance <= 0) {
            console.log("Account has no tokens to recover");
            return;
        }

        // Check if contract is paused
        const isPaused = await contract.paused();
        if (isPaused) {
            throw new Error("Contract is paused. Cannot recover tokens while paused.");
        }

        // Perform token recovery
        console.log("\nRecovering tokens...");
        const tx = await contractWithSigner.recoverTokens(accountToRecover, balance, {
            gasLimit: 200000,
            gasPrice: 250000000
        });

        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for transaction confirmation...");
        
        await tx.wait();
        
        // Verify the recovery
        const finalBalance = await contract.balanceOf(accountToRecover);
        console.log("\nFinal balance of recovered account:", ethers.formatUnits(finalBalance, tokenDecimals), tokenSymbol);
        
        const recoveryWalletBalance = await contract.balanceOf(await recoveryWallet.getAddress());
        console.log("Recovery wallet balance:", ethers.formatUnits(recoveryWalletBalance, tokenDecimals), tokenSymbol);

        if (finalBalance == 0) {
            console.log("\nToken recovery successful!");
        } else {
            console.log("\nToken recovery may have failed - account still has balance");
        }

    } catch (error) {
        console.error("\nToken recovery failed:", error);
        if (error.message.includes("RECOVERY_ROLE")) {
            console.error("The address does not have RECOVERY_ROLE");
        } else if (error.message.includes("AccessRegistryNotSet")) {
            console.error("Access Registry is not set");
        } else if (error.message.includes("RecoveryOnActiveAccount")) {
            console.error("Cannot recover from an active account");
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