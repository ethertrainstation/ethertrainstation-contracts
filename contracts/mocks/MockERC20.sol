// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

contract MockERC20 is ERC20PresetMinterPauser {

    constructor(string memory name_, string memory symbol_, uint8 decimals_)
    ERC20PresetMinterPauser(name_, symbol_) {
        _setupDecimals(decimals_);
    }

}
