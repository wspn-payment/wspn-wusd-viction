const { ethers, upgrades } = require ("hardhat");

async function main() {
    // 获取合约工厂
    const VRC25 = await ethers.getContractFactory("VRC25");
    //
    // // 假设你已经部署了 MyContractV1 并有一个代理地址
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65";

    // // 获取现有的代理合约
    console.log("starting deployProxy....")
    await upgrades.forceImport(proxyAddress, VRC25);
    console.log("Proxy contract registered successfully!")
    const vrc25 = await upgrades.deployProxy(VRC25, ["Worldwide USD","WUSD","0x702b4B92b74ac470d1eeb91106A2e7Be73F8b92b","0x8679490A21E67C51b2ba03E49225DbB43d8E671f","0x59f9981c36540f5b983335F3374b51B43F8614C8",18], { initializer: 'initialize' });
    //
    console.log("vrc25 deployed to:", vrc25.target);

    const gasLimit = 5000000;
    // 升级代理到新的实现
    await upgrades.upgradeProxy(proxyAddress, VRC25, {gasLimit: gasLimit });

    console.log("MyContractV1 proxy upgraded to VRC25");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });