// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";

contract Game is ERC721 {

    uint256 public nextTokenId;

    constructor() ERC721("Game", "GAME") {}

    function CreateGame(address p1, address p2) external {
        //Mint a new token for the challenger
        _mint(p1, nextTokenId);
        //Add challenged user as an approver (to allow accept or decline later)
        _approve(p2, nextTokenId);
        //Increment next token id
        nextTokenId++;
    }
}