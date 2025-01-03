require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
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
    },
  }

};
