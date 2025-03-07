const { ethers } = require("hardhat");

async function main() {
    // Contract address (proxy address)
    const contractAddress = "0x0047368d7D8919D3B652Ee8C858f430862a093D3";
    
    // Address to receive the minted tokens
    const recipientAddress = "0x702b4B92b74ac470d1eeb91106A2e7Be73F8b92b";
    
    // Amount to mint (e.g., 1000 tokens with 18 decimals)
    const amountToMint = ethers.parseUnits("100000000", 18);

    console.log("Starting mint test process...");
    console.log("Contract address:", contractAddress);
    console.log("Recipient address:", recipientAddress);
    console.log("Amount to mint:", ethers.formatUnits(amountToMint, 18), "tokens");

    try {
        // Get the contract factory and attach to existing proxy
        const VRC25 = await ethers.getContractFactory("VRC25");
        const contract = VRC25.attach(contractAddress);

        // Get the signer
        const [signer] = await ethers.getSigners();
        console.log("Minting from address:", await signer.getAddress());

        // Check if signer has MINTER_ROLE
        const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
        const hasMinterRole = await contract.hasRole(MINTER_ROLE, await signer.getAddress());
        console.log("Has MINTER_ROLE:", hasMinterRole);

        if (!hasMinterRole) {
            throw new Error("Signer does not have MINTER_ROLE");
        }

        // Get initial balance
        const initialBalance = await contract.balanceOf(recipientAddress);
        console.log("Initial balance:", ethers.formatUnits(initialBalance, 18), "tokens");

        // Perform mint
        console.log("Minting tokens...");
        const tx = await contract.mint(recipientAddress, amountToMint, {
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
        if (error.message.includes("Signer does not have MINTER_ROLE")) {
            console.error("Your account needs to be granted MINTER_ROLE first");
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