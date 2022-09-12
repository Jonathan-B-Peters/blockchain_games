// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract mock_Game {

    constructor() {}

    function TakeTurn(bytes memory state) public returns (bytes memory) {
        return state;
    }
}