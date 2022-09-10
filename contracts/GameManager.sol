// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract GameManager {

    mapping(address => bool) admins;

    struct Game {
        address player1;
        address player2;
        address gameContract;
        uint256 wager;
    }

    constructor(address _admin) {
        admins[_admin] = true;
    }

    function SetAdmin(address admin, bool val) public {
        require(admins[msg.sender], "Only admins can set admins.");
        admins[admin] = val;
    }

    function CreateGame() public {
        require(admins[msg.sender], "Only admins can create games.");
    }
}
