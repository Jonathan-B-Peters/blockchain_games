// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "./mocks/mock_Game.sol";

contract GameManager {

    //All data necessary for an existing game
    struct Game {
        address player1;
        address player2;
        address gameContract;
        bytes state;
        uint256 wager;
    }

    //Portions of this contract are restricted to only admins
    mapping(address => bool) public admins;

    uint256 nextGameId;
    mapping(uint256 => Game) public games;

    //Sets an intial admin
    constructor(address _admin) {
        admins[_admin] = true;
    }

    //Adds or removes an admin
    function SetAdmin(address admin, bool val) external {
        require(admins[msg.sender], "GameManager: Only admins can set admins");
        admins[admin] = val;
    }

    //Creates a new game. This function is intended to only be called the ChallengeManager contract
    function CreateGame(address player1, address player2, address gameContract) external payable {
        require(admins[msg.sender], "GameManager: Only admins can create games");
        games[nextGameId] = Game(player1, player2, gameContract, "0", msg.value);
    }

    function TakeTurn(uint256 gameId) external returns (bytes memory){
        validatePlayer(msg.sender, gameId);
        return mock_Game(games[gameId].gameContract).TakeTurn("0");
    }

    function validatePlayer(address player, uint256 gameId) private view {
        require(
            player == games[gameId].player1 ||
            player == games[gameId].player2,
            "GameContract: Invalid player address"
        );
    }
}