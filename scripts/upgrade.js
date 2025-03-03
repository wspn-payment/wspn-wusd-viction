const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65";
    // const proxyAddress = "0x654672b55560968C87c232679a09f4E435c98bF2";
    // 获取新的合约工厂
    const NewContract = await ethers.getContractFactory("VRC26");
    NewContract.attach(proxyAddress)
    console.log("Upgrading contract...");

    // const gasLimit = 50000000;
    // const vrc25 = await ethers.deployContract("VRC25",{ gasLimit });
    // await vrc25.waitForDeployment();
    // console.log("logic address",vrc25.target)


    // await upgrades.forceImport(proxyAddress, NewContract);
    // 升级合约
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NewContract, {
        kind: 'uups',
        gasLimit: 15000000, // Increased gas limit
        gasPrice: 250000000
    });
    await upgraded.waitForDeployment();

    console.log("Contract upgraded to:", upgraded.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });