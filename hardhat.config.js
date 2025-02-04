require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    mordor: {
      url: process.env.MORDOR_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};