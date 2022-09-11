const { expect } = require("chai");
const Utils = require("./utils.js");

describe("Test Create Game", () => {
    //Signers and contract
    let owner, addr1, ChallengeManager, GameManager;
    //Get signers and contract factory prior to running tests
    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();
        ChallengeManager = await Utils.DeployContract("ChallengeManager");
        GameManager = await Utils.DeployContract("GameManager", [owner.address]);
    });
    it("CreateGame should update game data structure", async () => {
        //Game with id 0 should not exist, so expect wager to be 0
        expect((await GameManager.games(0)).wager).to.equal(0);
        //Create the game
        await GameManager.CreateGame(owner.address, addr1.address, ChallengeManager.address, { value: 100 });
        //Wager should be equal to value sent during game creation
        expect((await GameManager.games(0)).wager).to.equal(100);
    });
});