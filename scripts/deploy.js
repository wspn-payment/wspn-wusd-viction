const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const gasLimit = 20000000;
    console.log("Deploying contracts with the account:", deployer.address);
    const vrc25 = await ethers.deployContract("VRC26",{ gasLimit });
    // const vrc25 = await VRC25.deploy();
    await vrc25.waitForDeployment();

    console.log("Contract deployed to:", vrc25.target);
}

// 调用 main 函数并处理可能的错误
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });