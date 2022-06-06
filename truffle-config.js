const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = "job adapt nice angry tongue suit volcano salmon puppy track track glove";

module.exports = {
  networks: {
    development: {      
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 5000000
    },
    rinkeby:{
      provider: () => new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/46e7990c2ef845189d4a8477aa8da876"),
      network_id: 4
    }
  }
}