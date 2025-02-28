const { ethers, upgrades } = require ("hardhat");

async function main() {
    // 获取合约工厂
    // const VRC25Proxy = await ethers.getContractFactory("VRC25Proxy");
    const VRC25 = await ethers.getContractFactory("VRC25");
    //
    // // 假设你已经部署了 MyContractV1 并有一个代理地址
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65";
    //
    // // 获取现有的代理合约
    // const proxy = await ethers.getContractAt("VRC25Proxy", proxyAddress);
    //
    // // 部署新的实现合约
    // const vrc25 = await upgrades.deployProxy(VRC25, ["Worldwide USD","WUSD","0x702b4B92b74ac470d1eeb91106A2e7Be73F8b92b","0x8679490A21E67C51b2ba03E49225DbB43d8E671f","0x59f9981c36540f5b983335F3374b51B43F8614C8",18], { initializer: 'initialize' });
    //
    // console.log("vrc25 deployed to:", vrc25.target);

    const gasLimit = 5000000;
    // 升级代理到新的实现
    await upgrades.upgradeProxy(proxyAddress, VRC25, { initializer: 'initialize',gasLimit: gasLimit });

    console.log("MyContractV1 proxy upgraded to VRC25");

    // 验证升级后的功能
    // const upgradedProxy = await ethers.getContractAt("MyContractV2", proxyAddress);
    // const value = await upgradedProxy.value();
    // console.log("Current value:", value.toString());

    // const setValueResult = await upgradedProxy.setValue(100);
    // await setValueResult.wait();
    //
    // const newValue = await upgradedProxy.value();
    // console.log("Updated value:", newValue.toString());
    //
    // const getValuePlusTen = await upgradedProxy.getValuePlusTen();
    // console.log("Value plus ten:", getValuePlusTen.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });