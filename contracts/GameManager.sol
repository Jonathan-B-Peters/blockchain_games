// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract GameManager {

    mapping(address => bool) admins;

    uint256 nextGameId = 1;
    mapping(uint256 => Game) public games;

    struct Game {
        address player1;
        address player2;
        address gameContract;
        uint256 wager;
    }

    constructor(address _admin) {
        admins[_admin] = true;
    }

    function SetAdmin(address admin, bool val) external {
        require(admins[msg.sender], "GameManager: Only admins can set admins.");
        admins[admin] = val;
    }

    function CreateGame(address player1, address player2, address gameContract, uint256 wager) external {
        require(admins[msg.sender], "GameManager: Only admins can create games.");
        games[nextGameId] = Game(player1, player2, gameContract, wager);
    }
}
