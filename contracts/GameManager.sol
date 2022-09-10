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

    function CreateGame() public {
        require(admins[msg.sender], "Only approved addresses can create games.");
    }
}
