const { ethers, upgrades } = require("hardhat");

async function main() {
    // 替换为你的代理合约地址
    // const proxyAddress = "0x9AD16B6D3E401b8dF25C985f9bEbb490dB8aFE78";
    const proxyAddress = "0x36AA91C120fC3E354EF1c9452cA7584eC7884D65";
    // 获取新的合约工厂
    const NewContract = await ethers.getContractFactory("VRC25");

    console.log("Upgrading contract...");

    const gas = 50000000;
    // 升级合约
    const upgraded = await upgrades.upgradeProxy(proxyAddress, NewContract, {gasLimit:gas});

    console.log("Contract upgraded to:", upgraded.address);

    // const provider = ethers.provider;
    // const txParams = {
    //     from: "0x702b4b92b74ac470d1eeb91106a2e7be73f8b92b", // 发送者地址
    //     to: "0x36aa91c120fc3e354ef1c9452ca7584ec7884d65",   // 代理合约地址
    //     // data: "0x",            // 完整的数据字段（请确保完整）
    //     value: ethers.parseEther("1")
    // };
    //
    // const gasEstimate = await provider.estimateGas(txParams);
    // console.log(`Estimated Gas: ${gasEstimate.toString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });