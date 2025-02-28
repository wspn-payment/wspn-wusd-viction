const {ethers} = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("apply the contract using the account", deployer.address);

    const tokenAddress = "0x9AD16B6D3E401b8dF25C985f9bEbb490dB8aFE78";

    const contractAddress = '0x8c0faeb5C6bEd2129b8674F262Fd45c4e9468bee';

    const abi = [{"constant":true,"inputs":[],"name":"minCap","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"token","type":"address"}],"name":"getTokenCapacity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"tokens","outputs":[{"name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"}],"name":"apply","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"token","type":"address"}],"name":"charge","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"inputs":[{"name":"value","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"issuer","type":"address"},{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Apply","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"supporter","type":"address"},{"indexed":true,"name":"token","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Charge","type":"event"}]

    const contract = new ethers.Contract(contractAddress, abi, deployer);

    // 设置要发送的 ETH 金额（如果需要支付 Gas 费用）
    const value = ethers.parseEther("10"); // 替换为需要的金额
    console.log("value:",value)

    const gasLimit = 25000000;
    // 调用 apply 函数
    const tx = await contract.apply(tokenAddress, { value: value,gasLimit: gasLimit });

    console.log("Transaction hash:", tx.hash);
    // 等待交易确认
    await tx.wait();
    console.log("Transaction confirmed!");
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });