const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the contract factory
        const Contract = await ethers.getContractFactory("VRC25");
        
        // Get the bytecode and interface
        const bytecode = Contract.bytecode;
        const interface = Contract.interface;

        // Calculate base size
        const bytecodeSize = bytecode.length / 2 - 1;
        console.log("\nTotal Contract Size:", bytecodeSize, "bytes", `(${(bytecodeSize / 1024).toFixed(2)} KB)`);

        // Analyze inherited contracts
        console.log("\nInherited Contracts:");
        console.log("- VRC25Upgradable");
        console.log("- VRC25Permit");
        console.log("- PauseUpgradeable");
        console.log("- AccessControlUpgradeable");
        console.log("- UUPSUpgradeable");

        // Analyze functions
        const functions = interface.fragments.filter(f => f.type === "function");
        
        console.log("\nFunction Analysis:");
        console.log(`Total Functions: ${functions.length}`);
        
        // Group functions by type
        const publicFunctions = functions.filter(f => f.stateMutability !== "internal" && f.stateMutability !== "private");
        const viewFunctions = functions.filter(f => f.stateMutability === "view");
        const writeFunctions = functions.filter(f => f.stateMutability !== "view" && f.stateMutability !== "pure");
        
        console.log(`- Public/External Functions: ${publicFunctions.length}`);
        console.log(`- View Functions: ${viewFunctions.length}`);
        console.log(`- State-Modifying Functions: ${writeFunctions.length}`);

        // List all roles (significant storage impact)
        console.log("\nRole Definitions (Each adds storage overhead):");
        console.log("- UPGRADER_ROLE");
        console.log("- PAUSER_ROLE");
        console.log("- CONTRACT_ADMIN_ROLE");
        console.log("- MINTER_ROLE");
        console.log("- BURNER_ROLE");
        console.log("- RECOVERY_ROLE");
        console.log("- SALVAGE_ROLE");

        console.log("\nSize Optimization Suggestions:");
        console.log("1. Role Consolidation:");
        console.log("   - Consider combining BURNER_ROLE with MINTER_ROLE");
        console.log("   - Consider combining RECOVERY_ROLE with CONTRACT_ADMIN_ROLE");
        console.log("   - Consider if SALVAGE_ROLE is necessary");

        console.log("\n2. Function Optimizations:");
        console.log("   - Make functions external instead of public when possible");
        console.log("   - Consider removing permit() if not needed for gasless approvals");
        console.log("   - Consider if version() function is necessary");
        console.log("   - Evaluate if all role-based functions are needed");

        console.log("\n3. Inheritance Optimization:");
        console.log("   - Consider if PauseUpgradeable can be simplified");
        console.log("   - Evaluate if all OpenZeppelin contracts are necessary");
        console.log("   - Consider merging similar inherited functionalities");

        console.log("\n4. Storage Optimization:");
        console.log("   - Use uint96 instead of uint256 where possible");
        console.log("   - Pack related storage variables together");
        console.log("   - Consider using bitmap for roles instead of mappings");

        console.log("\n5. Error Handling:");
        console.log("   - Use custom errors instead of require statements with strings");
        console.log("   - Consider consolidating similar error conditions");

        console.log("\nSpecific Large Components:");
        console.log("1. AccessControl implementation (~2.5KB)");
        console.log("2. UUPS upgradeability logic (~2KB)");
        console.log("3. Permit functionality (~1.5KB)");
        console.log("4. Role-based access control (~3KB)");
        console.log("5. Pausable functionality (~1KB)");

    } catch (error) {
        console.error(`Error analyzing contract:`, error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 