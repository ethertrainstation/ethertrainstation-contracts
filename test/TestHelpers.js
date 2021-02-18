let _ = require('underscore');
let jsonfile = require("jsonfile");
let Promise = require('bluebird');

let assert = require('assert');
const {BigNumber} = ethers;
const {keccak256, toUtf8Bytes} = ethers.utils;

let state = {};

class TestHelpers {

    static setState(_state) {
        state = _state;
    }

    static getState() {
        return state;
    }

    static async mineBlocks(count) {
        await Promise.each(_.range(count), function (idx) {
            return hre.network.provider.request({
                    method: "evm_mine",
                    params: []
                }
            )
        });
        return ethers.provider.getBlockNumber();
    }

    static async deployContract(contractName, args, opts = {}) {
        let {signer, libs} = opts;

        args = args || [];
        libs = libs || [];
        if (!signer) [signer] = await ethers.getSigners();

        let deployedLibraries = {};
        await Promise.each(libs, async function (name) {
            let factory = await ethers.getContractFactory(name, signer);
            let {address} = await factory.deploy();
            deployedLibraries[name] = address;
        });

        let factory;
        if (contractName.includes(".sol")) {
            // TODO: libraries?
            let solcOutput = jsonfile.readFileSync("./artifacts/contracts/" + contractName);
            factory = new ethers.ContractFactory(solcOutput.abi, solcOutput.bytecode, signer);
        } else {
            factory = await ethers.getContractFactory(contractName, {
                deployedLibraries,
                signer
            });
        }
        return factory.deploy(...args);
    }

    static async fundAccount(account, amount, tokenName) {
        let contract = await this.tokenContractFor(tokenName);
        let source = await this.tokenSourceFor(tokenName);
        let sourceBalance = await contract.balanceOf(await source.getAddress());
        assert(sourceBalance.gte(amount), "Token source " + source + " has not enough funds");
        contract = await contract.connect(source);
        await contract.transfer(account, amount);
    }

    static tokenSources = {
        "DAI": {
            address: '0x681Bd23F6128dB3F9b8914595d1a63830a6212fA',
            signer: null
        },
        "WETH": {
            address: "0x0F4ee9631f4be0a63756515141281A3E2B293Bbe",
            signer: null
        },
        "SUSHI": {
            address: "0xAC844B604D6C600Fbe55C4383A6d87920b46A160",
            signer: null
        },
        "USDC": {
            address: "0x7abE0cE388281d2aCF297Cb089caef3819b13448",
            signer: null
        },
        "COMP": {
            address: "0x912722a37E5FDFE480b4F52b949797b80594FE8B",
            signer: null
        }
    };

    static async tokenSourceFor(tokenName) {
        assert(this.tokenSources[tokenName], "No source account for token " + tokenName);
        let source = this.tokenSources[tokenName];
        if (!source.signer) {
            await hre.network.provider.request({
                    method: "hardhat_impersonateAccount",
                    params: [source.address]
                }
            );
            source.signer = await ethers.provider.getSigner(source.address);
        }
        return source.signer;
    }

    static contractAdresses = {
        DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        SUSHI: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
        USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        COMP: "0xc00e94cb662c3520282e6f5717214004a7f26888"
    };

    static async tokenContractFor(tokenName) {
        let contractAddress;
        if (tokenName.startsWith("0x")) {
            contractAddress = tokenName;
        } else {
            assert(this.contractAdresses[tokenName], "Address for token " + tokenName + " is unknown");
            contractAddress = this.contractAdresses[tokenName];
        }
        const abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)",
            "function approve(address to, uint amount)",
            "function transfer(address to, uint amount) returns (boolean)",
            "event Transfer(address indexed from, address indexed to, uint amount)"
        ];
        let contract = await ethers.getContractAt(abi, contractAddress);
        return contract;
    }

    static wei(amount) {
        return BigNumber.from(amount);
    }

    static parseEtherDecimal(etherDecimal) {
        let [left, right] = ("" + etherDecimal).split(".");
        if (right.length > 18) right = right.substr(0, 18);
        if (right.length < 18) right = right.padEnd(18, "0");
        let wei = left + right;
        wei = wei.replace(/^0+/, "");
        return Utils.wei(wei);
    }

    static numberToBigNumber = function(number, decimals) {
        let [left, right] = ("" + number).split(".");
        right = right || "0";
        left = left || "0";
        if (right.length > decimals) right = right.substr(0, decimals);
        if (right.length < decimals) right = right.padEnd(decimals, "0");
        let bnString = left + right;
        bnString = bnString.replace(/^0+/, "") || "0";
        return ethers.BigNumber.from(bnString);
    }

    static maxUint256 = function() {
        return ethers.BigNumber.from("0x" + "ff".repeat(32))
    }

    static keccak256(input) {
        if (_.isString(input)) input = toUtf8Bytes(input);
        return keccak256(input);
    }

    static zeroAddress() {
        return "0x0000000000000000000000000000000000000000";
    }
}


module.exports = TestHelpers;