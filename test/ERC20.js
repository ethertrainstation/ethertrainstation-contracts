let TestHelpers = require("./TestHelpers");

let Burning = require("./erc20_tests/003_burning");
let Minting = require("./erc20_tests/001_minting");
let Properties = require("./erc20_tests/000_properties");
let Transferring = require("./erc20_tests/002_transferring");

describe("MockERC20", function () {

    let config = {
    };

    before("Setup MockERC20 contract", async function () {
        let users = await ethers.getSigners();
        config.name = "Useless mock ERC20 token";
        config.symbol = "MOCK";
        config.decimals = 18;
        config.owner = users[0];
        config.burner = config.minter = users[0];
        config.not_burner = config.not_minter = users[1];
        config.user1 = users[1];
        config.user2 = users[2];
        config.user3 = users[3];
        config.contract = await TestHelpers.deployContract("MockERC20", [config.name, config.symbol, config.decimals],{signer: config.owner});
        await config.contract.mint(config.user1.address, TestHelpers.numberToBigNumber("10000", 18));
        await TestHelpers.mineBlocks(1);
    });

    describe("Properties", Properties(config).bind(this));
    describe("Minting", Minting(config).bind(this));
    describe("Transferring", Transferring(config).bind(this));
    describe("Burning", Burning(config).bind(this));

});

