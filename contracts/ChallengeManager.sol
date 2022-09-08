// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract ChallengeManager {
    //All possible game types. These games are not yet implemented
    enum GameType {
        TicTacToe,
        Checkers,
        Chess
    }

    //All data necessary for an existing challenge
    struct Challenge {
        address from;
        address to;
        GameType gameType;
        uint256 wager;
    }

    //CHALLENGE DATA STRUCTURES

    uint256 nextChallengeId = 1;
    //Mapping of challengeId => challenge
    mapping(uint256 => Challenge) public challenges;
    //Mapping of users to a mapping of each game type to challengeId
    mapping(address => mapping(GameType => uint256)) public outgoingChallenges;
    //Mapping of users to a list of incoming challenges. List is a mapping of in-order index to challengeId
    mapping(address => mapping(uint256 => uint256)) public incomingChallenges;
    //Mapping of challengeId to the index of that challenge in the receiver's list. Necessary for swap-pop deletion
    mapping(uint256 => uint256) public incomingChallengesIndex;
    //Mapping of users to the total number of incoming challenges for that user
    mapping(address => uint256) public incomingChallengeBalances;

    constructor() {}

    function CreateChallenge(address to, GameType gameType) external payable {
        //Verify challenger does not have an outstanding challenge for this game
        require(
            outgoingChallenges[msg.sender][gameType] == 0,
            "GameManager: only one outstanding challenge per game is allowed at one time"
        );
        //Create the new challenge
        challenges[nextChallengeId] = Challenge(msg.sender, to, gameType, msg.value);
        //Update challenger outgoing challenge data
        outgoingChallenges[msg.sender][gameType] = nextChallengeId;
        //Update challenged party's list of incoming Challenges
        incomingChallenges[to][incomingChallengeBalances[to]] = nextChallengeId;
        //Update list of challenge indexes in owners list
        incomingChallengesIndex[nextChallengeId] = incomingChallengeBalances[to];
        //Increase challenged party's balance of incoming challenges
        incomingChallengeBalances[to]++;
        //Increment the id for next created challenge
        nextChallengeId++;
    }

    function DeclineChallenge(uint256 challengeId) external {
        require(
            msg.sender == challenges[challengeId].from || msg.sender == challenges[challengeId].to,
            "Only an involved party can decline a challenge"
        );
        uint256 wager = challenges[challengeId].wager;
        address from = challenges[challengeId].from;
        DeleteChallenge(challengeId);
        (bool sent, bytes memory data) = from.call{value: wager}("");
        require(sent, "Failed to send Ether");
    }

    function DeleteChallenge(uint256 challengeId) private {
        //Delete from the challenger's outgoing challenges
        delete(outgoingChallenges[challenges[challengeId].from][challenges[challengeId].gameType]);

        //Use swap and pop to remove from challenged partys list of incoming challenges
        address to = challenges[challengeId].to;
        uint256 index = incomingChallengesIndex[challengeId];
        uint lastIndex = incomingChallengeBalances[to] - 1;
        //Swap
        incomingChallenges[to][index] = incomingChallenges[to][lastIndex];
        //Pop
        delete incomingChallenges[to][incomingChallengeBalances[to] - 1];
        //Decrement incoming challenge balance of challenged party
        incomingChallengeBalances[challenges[challengeId].to]--;
        
        //Delete from mapping of challenges to index in owner's list of incoming challenges
        delete(incomingChallengesIndex[challengeId]);
        //Delete the challenge
        delete(challenges[challengeId]);
    }
}