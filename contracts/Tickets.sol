// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Capped.sol";

contract Tickets is ERC20PresetMinterPauser, ERC20Capped {

    constructor() ERC20PresetMinterPauser("Ether Train Tickets", "TICKETS") ERC20Capped(10000 * 1e18){
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20PresetMinterPauser, ERC20Capped) {
        ERC20Capped._beforeTokenTransfer(from, to, amount);
    }

}
