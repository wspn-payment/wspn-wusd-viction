require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require('dotenv').config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.0" }, // 支持 0.8.0
      { version: "0.8.1" }, // 支持 0.8.1
      { version: "0.8.2" }, // 支持 0.8.2
      { version: "0.8.8" }, // 支持 0.8.8
      { version: "0.8.20" }, // 支持 0.8.20
      { version: "0.8.22" } // 支持 0.8.22
    ],
    settings: {
      optimizer: {
        enabled: true,  // 启用优化器
        runs: 200        // 设置优化器运行次数，这会影响字节码的大小
      }
    },
  },
  tsconfig: "./tsconfig.json",
  networks:{
    hardhat:{
      allowUnlimitedContractSize: true,
    },
    'tomo-testnet': {
      url: 'https://rpc.viction.xyz',
      accounts: [process.env.PRIVATE_KEY],
      gas: 6000000, // 设置更高的 Gas 限制
      gasPrice: 250000000, // 设置 Gas 价格（可选）
    },
  },
  deployments: {
    "0x2cB48366f21c05f228710F4e1BDB62E8d1087325": { contract: "VRC25" }
  }

};
