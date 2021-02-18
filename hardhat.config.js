require('dotenv').config({path: 'test.env'});
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

module.exports = {
    solidity: {
        compilers: [
            {
                version: "0.7.6"
            }
        ]
    },
    networks: {
        hardhat: {
            forking: {
                url: process.env.MAINNET_URL,
                blockNumber: 11880158
            }
        }
    },
    mocha: {
        "slow": 10000,
        "timeout": 20000
    },
    gasReporter: {
        enabled: false
    }
};
