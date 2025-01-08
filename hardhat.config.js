require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.0" }, // 支持 0.8.0
      { version: "0.8.1" }, // 支持 0.8.1
      { version: "0.8.2" }, // 支持 0.8.2
      { version: "0.8.8" }, // 支持 0.8.8
      { version: "0.8.20" }, // 支持 0.8.20
      { version: "0.8.22" } // 支持 0.8.21
    ]
  },
  settings: {
    optimizer: {
      enabled: true,  // 启用优化器
      runs: 200        // 设置优化器运行次数，这会影响字节码的大小
    }
  },
  networks:{
    hardhat:{
      allowUnlimitedContractSize: true,
    },
    'tomo-testnet': {
      url: 'https://rpc-testnet.viction.xyz',
      accounts: [''],
      gas: 6000000, // 设置更高的 Gas 限制
      gasPrice: 250000000, // 设置 Gas 价格（可选）
    }
  }

};
