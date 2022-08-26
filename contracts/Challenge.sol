// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Game.sol";

contract Challenge is ERC721 {

    uint256 public nextTokenId;

    Game private gameContract;

    constructor(address _gameContract) ERC721("Challenge", "CHAL") {
        gameContract = Game(_gameContract);
    }

    function CreateChallenge(address to) external {
        //Mint a new token for the challenger
        _mint(msg.sender, nextTokenId);
        //Add challenged user as an approver (to allow accept or decline later)
        _approve(to, nextTokenId);
        //Increment next token id
        nextTokenId++;
    }

    function DeclineChallenge(uint256 tokenId) external {
        require(msg.sender == ownerOf(tokenId) || msg.sender == getApproved(tokenId), "Challenge: must be owner or operator to decline challenge");
        _burn(tokenId);
    }

    function AcceptChallenge(uint256 tokenId) external {
        require(msg.sender == getApproved(tokenId), "Challenge: must be operator to accept challenge");
        gameContract.CreateGame(msg.sender, ownerOf(tokenId));
        _burn(tokenId);
    }
}