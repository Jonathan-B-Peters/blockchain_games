// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract GameManager {

    struct Game {
        address player1;
        address player2;
        address gameContract;
        uint256 wager;
    }

    constructor() {}
}