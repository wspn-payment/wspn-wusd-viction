const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65"; // 替换为你的代理合约地址
    const VRC25 = await ethers.getContractFactory("VRC25");

    console.log("Registering proxy contract...");
    await upgrades.forceImport(proxyAddress, VRC25);
    console.log("Proxy contract registered successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });