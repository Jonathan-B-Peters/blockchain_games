// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Game.sol";

contract Challenge is ERC721 {

    uint256 public nextTokenId;
    //Reference to ERC721 based Game contract
    Game private gameContract;
    //Timestamps of creation for every token
    mapping(uint256 => uint) private timestamps;

    constructor(address _gameContract) ERC721("Challenge", "CHAL") {
        gameContract = Game(_gameContract);
    }

    //TODO: What if someone challenges the same user twice?
    // What if someone challenges many many people?
    // Should this contract only allow one challenge per user per game type?
    // Either make the contract enumerable (will have to eventually anyway) and loop over and check user's outstanding challenges
    // Or... Create a new mapping of address => challengeData, where challengeData is mapping of gameType to bool.
    function CreateChallenge(address to, uint256 wager) external {
        require(msg.sender.balance > wager, "Challenge: insufficient balance");
        //Mark creation timestamp for this token
        timestamps[nextTokenId] = block.timestamp;
        //Mint a new token for the challenger
        _mint(msg.sender, nextTokenId);
        //Add challenged user as an approver (to allow accept or decline later)
        _approve(to, nextTokenId);
        //Increment next token id
        nextTokenId++;
    }

    function DeclineChallenge(uint256 tokenId) external {
        //Either involved party can decline the challenge
        require(msg.sender == ownerOf(tokenId) || msg.sender == getApproved(tokenId), "Challenge: must be owner or operator to decline challenge");
        _burn(tokenId);
    }

    //Only the challenged party (operator) can approve the challenge
    function AcceptChallenge(uint256 tokenId) external {
        require(msg.sender == getApproved(tokenId), "Challenge: must be operator to accept challenge");
        require(block.timestamp - timestamps[tokenId] < 1 days, "Challenge: challenge has expired");
        gameContract.CreateGame(msg.sender, ownerOf(tokenId));
        _burn(tokenId);
    }

    function GetTimestamp(uint256 tokenId) external view returns(uint) {
        return timestamps[tokenId];
    }
}