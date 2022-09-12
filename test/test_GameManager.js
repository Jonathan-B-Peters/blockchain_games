const { expect } = require("chai");
const Utils = require("./utils.js");

describe("Test Create Game", () => {
    //Signers and contract
    let owner, addr1, ChallengeManager, mock_Game, GameManager;
    //Get signers and contract factory prior to running tests
    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();
        ChallengeManager = await Utils.DeployContract("ChallengeManager");
        mock_Game = await Utils.DeployContract("mock_Game");
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
    it("CreateGame should fail for non admin", async () => {
        //Game with id 0 should not exist, so expect wager to be 0
        expect((await GameManager.games(0)).wager).to.equal(0);
        //Create the game
        await expect(GameManager.connect(addr1).CreateGame(owner.address, addr1.address, ChallengeManager.address, { value: 100 })).to.be.rejectedWith(Error);
    });
    it("TakeTurn should return '0'", async () => {
        //Create a game for the test to use
        await GameManager.CreateGame(owner.address, addr1.address, mock_Game.address, { value: 100 });
        //Returned game state should be '0' since using mock
        expect((await GameManager.TakeTurn(0)).value).to.equal("0");
    });
    it("SetAdmin should update admin privelages", async () => {
        //addr1 should not have privelages initially
        expect(await GameManager.admins(addr1.address)).to.equal(false);
        //Grant privelages to addr1
        await GameManager.SetAdmin(addr1.address, true);
        //addr1 should now have privelages
        expect(await GameManager.admins(addr1.address)).to.equal(true);
        //Revoke privelages from addr1
        await GameManager.SetAdmin(addr1.address, false);
        //addr1 should no longer have privelages
        expect(await GameManager.admins(addr1.address)).to.equal(false);
    });
});;