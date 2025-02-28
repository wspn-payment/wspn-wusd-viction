const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Init the contract using the account",deployer.address);

    // 合约 ABI（仅包含构造函数）
    const abi = [
        "constructor()" // 空的构造函数
    ];

// 编码构造函数参数
    const coder = ethers.AbiCoder.defaultAbiCoder();
    const encodedArgs = coder.encode([],[])

    // const encodedArgs = ethers.AbiCoder.defaultAbiCoder(
    //     [], // 参数类型为空
    //     []  // 参数值为空
    // );
    console.log("Contract deployed to:", encodedArgs);
}

// 调用 main 函数并处理可能的错误
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });