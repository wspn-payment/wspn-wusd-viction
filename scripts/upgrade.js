const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65";
    // const proxyAddress = "0x654672b55560968C87c232679a09f4E435c98bF2";
    // 获取新的合约工厂
    const NewContract = await ethers.getContractFactory("VRC26");
    console.log("Upgrading contract...");

    const gasLimit = 50000000;

    // 升级合约
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NewContract, {gasLimit});

    console.log("Contract upgraded to:", upgraded.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });