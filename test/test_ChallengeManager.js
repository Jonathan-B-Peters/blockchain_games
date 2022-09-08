const { expect } = require("chai");
const { ethers } = require("hardhat");
const Utils = require("./utils.js");
const { parseEther, formatEther } = require("ethers/lib/utils");

describe("Test Create Challenge", () => {
    //Signers and contract
    let owner, addr1, ChallengeManager;
    //Get signers and contract factory prior to running tests
    beforeEach(async () => {
        [owner, addr1] = await ethers.getSigners();
        ChallengeManager = await Utils.DeployContract("ChallengeManager");
    });
    it("CreateChallenge should update outgoing challenge data for sender", async () => {
        //Verify initial values for all data structures
        expect((await ChallengeManager.challenges(1)).wager).to.equal(0);
        expect(await ChallengeManager.outgoingChallenges(owner.address, 1)).to.equal(0);
        expect(await ChallengeManager.incomingChallenges(addr1.address, 0)).to.equal(0);
        expect(await ChallengeManager.incomingChallengesIndex(1)).to.equal(0);
        expect(await ChallengeManager.incomingChallengeBalances(addr1.address)).to.equal(0);
        //Create a new challenge and verify that all data structures have been updated
        await ChallengeManager.CreateChallenge(addr1.address, 1, { value: 10 });
        expect((await ChallengeManager.challenges(1)).wager).to.equal(10);
        expect(await ChallengeManager.outgoingChallenges(owner.address, 1)).to.equal(1);
        expect(await ChallengeManager.incomingChallenges(addr1.address, 0)).to.equal(1);
        expect(await ChallengeManager.incomingChallengesIndex(1)).to.equal(0);
        expect(await ChallengeManager.incomingChallengeBalances(addr1.address)).to.equal(1);
        //One more time for good measure
        await ChallengeManager.CreateChallenge(addr1.address, 2, { value: 999 });
        expect((await ChallengeManager.challenges(2)).wager).to.equal(999);
        expect(await ChallengeManager.outgoingChallenges(owner.address, 2)).to.equal(2);
        expect(await ChallengeManager.incomingChallenges(addr1.address, 1)).to.equal(2);
        expect(await ChallengeManager.incomingChallengesIndex(2)).to.equal(1);
        expect(await ChallengeManager.incomingChallengeBalances(addr1.address)).to.equal(2);
    });
    it("CreateChallenge should fail for invalid game types", async () => {
        await expect(ChallengeManager.CreateChallenge(addr1.address, 3, { value: 10 })).to.be.rejectedWith(Error);
    });
    it("CreateChallenge should fail if challenge of same type already exists", async () => {
        await ChallengeManager.CreateChallenge(addr1.address, 1, { value: 10 });
        await expect(ChallengeManager.CreateChallenge(addr1.address, 1, { value: 10 })).to.be.rejectedWith(Error);
    });
    it("CreateChallenge should increase contract balance with each call", async () => {
        for(let i = 0; i < 3; i++) {
            await ChallengeManager.CreateChallenge(addr1.address, i, { value: parseEther('10') });
            expect(await ethers.provider.getBalance(ChallengeManager.address)).to.equal(parseEther('10').mul(i + 1));
        }
    });
});

describe("Test DeclineChallenge", () => {
    //Signers and contract
    let owner, addr1, addr2, ChallengeManager;
    //Get signers and contract factory prior to running tests
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        ChallengeManager = await Utils.DeployContract("ChallengeManager");
        //Create one challenge from owner to addr1 for each game type
        for(let i = 0; i < 3; i++) {
            await ChallengeManager.CreateChallenge(addr1.address, i, { value: parseEther('10') });
        }
    });
    it("DeclineChallenge should update data structures correctly", async () => {
        await ChallengeManager.DeclineChallenge(1);
        //Owner's outgoing challenge for this game type should not exist
        expect(await ChallengeManager.outgoingChallenges(owner.address, 0)).to.equal(0);
        //Challenge 3 should have been swapped from the third position to the first position in the list
        expect(await ChallengeManager.incomingChallenges(addr1.address, 0)).to.equal(3);
        //Challenge 2 should still be in the second position
        expect(await ChallengeManager.incomingChallenges(addr1.address, 1)).to.equal(2);
        //The third place in the list should not exist
        expect(await ChallengeManager.incomingChallenges(addr1.address, 2)).to.equal(0);
        //Addr1 should have a balance of 0 incoming challenges
        expect(await ChallengeManager.incomingChallengeBalances(addr1.address)).to.equal(2);
    });
    it("DeclineChallenge should repay the wager back to the challenge creator", async () => {
        //Get balance prior to declining challenge
        const initBalance = await ethers.provider.getBalance(owner.address);
        //Decline the challenge as addr1, so gas fees do not affect owner's balance
        await ChallengeManager.connect(addr1).DeclineChallenge(1);
        //Owner's balance should have increased by wager amount
        expect(await ethers.provider.getBalance(owner.address)).to.equal(initBalance.add(parseEther('10')));
        //Decline the challenge as addr1, so gas fees do not affect owner's balance
        await ChallengeManager.connect(addr1).DeclineChallenge(2);
        //Owner's balance should have increased by wager amount
        expect(await ethers.provider.getBalance(owner.address)).to.equal(initBalance.add(parseEther('20')));
        //Decline the challenge as addr1, so gas fees do not affect owner's balance
        await ChallengeManager.connect(addr1).DeclineChallenge(3);
        //Owner's balance should have increased by wager amount
        expect(await ethers.provider.getBalance(owner.address)).to.equal(initBalance.add(parseEther('30')));
    });
    it("DeclineChallenge should fail for uninvolved party", async () => {
        //addr2 should not be able to decline any challenge
        await expect(ChallengeManager.connect(addr2).DeclineChallenge(1)).to.be.rejectedWith(Error);
        await expect(ChallengeManager.connect(addr2).DeclineChallenge(2)).to.be.rejectedWith(Error);
        await expect(ChallengeManager.connect(addr2).DeclineChallenge(3)).to.be.rejectedWith(Error);
    });
    it("DeclineChallenge should fail if challenge does not exist", async () => {
        //Should pass the first time
        await ChallengeManager.DeclineChallenge(1);
        //Should fail if declined again
        await expect(ChallengeManager.DeclineChallenge(1)).to.be.rejectedWith(Error);
    });
});