const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const VRC25 = await ethers.getContractFactory("VRC25");
    const vrc25 = await VRC25.deploy();
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