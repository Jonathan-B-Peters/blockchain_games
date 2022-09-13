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

    //This value starts at 1, because 0 indicates that the challenge does not exist in other data structures
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

    //Currently no initial parameters for the contract
    constructor() {}

    function CreateChallenge(address to, GameType gameType) external payable {
        //Verify challenger does not have an outstanding challenge for this game
        require(
            outgoingChallenges[msg.sender][gameType] == 0,
            "ChallengeManager: only one outstanding challenge per game is allowed at one time"
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
        //Only the challenger or challenged can decline the challenge
        validateUser(msg.sender, challengeId);
        //Get the wager and 'from' address from the challenge to be deleted
        uint256 wager = challenges[challengeId].wager;
        address from = challenges[challengeId].from;
        //Private function, removes and updated data structures
        deleteChallenge(challengeId);
        //Replay the initial wager to the challenger
        (bool sent, bytes memory data) = from.call{value: wager}("");
        //If failed to repay, revert the transaction
        require(sent, "ChallengeManager: Failed to send Ether");
    }

    function AcceptChallenge(uint256 challengeId) external {
        validateUser(msg.sender, challengeId);
    }

    function deleteChallenge(uint256 challengeId) private {
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

    function validateUser(address user, uint256 challengeId) private view {
        require(
            msg.sender == challenges[challengeId].from || msg.sender == challenges[challengeId].to,
            "ChallengeManager: Invalid user address"
        );
    }
}