const { ethers, upgrades } = require("hardhat");

async function main() {
    // const proxyAddress = "0x9AD16B6D3E401b8dF25C985f9bEbb490dB8aFE78";
    const proxyAddress = "0x654672b55560968C87c232679a09f4E435c98bF2";
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