const { expect } = require("chai");
const { ethers } = require("hardhat");
const Utils = require("./utils.js");

describe("Test Challenge Contract Deployment", () => {
    //Deploy contract and verify nextTokenId initialization
    it("Deployment should initialize nextTokenId, name, and symbol", async () => {
        //Challenge constructor depends on an existing Game contract
        const Game = await Utils.DeployContract("Game");
        const Challenge = await Utils.DeployContract("Challenge", [Game.address]);
        //Verify initialization of contract parameters
        expect(await Challenge.name()).to.equal("Challenge");
        expect(await Challenge.symbol()).to.equal("CHAL");
        expect(await Challenge.nextTokenId()).to.equal(0);
    });
});

describe("Test Challenge Creation", () => {
    //Signers and contract
    let owner, addr1, Challenge;
    //Get signers and contract factory prior to running tests
    before(async () => {
        [owner, addr1] = await ethers.getSigners();
        //Challenge constructor depends on an existing Game contract
        const Game = await Utils.DeployContract("Game");
        Challenge = await Utils.DeployContract("Challenge", [Game.address]);
    });
    //Create a challenge and verify that owner and operator are both updated
    it("CreateChallenge should mint a new token", async () => {
        //Get the token id of the challenge we're about to create
        const nextTokenId = await Challenge.nextTokenId();
        //Get owner balance before creating challenge
        const ownerBalance = await Challenge.balanceOf(owner.address);
        //Contract call to create the challenge
        await Challenge.CreateChallenge(addr1.address, 0);
        //Owner balance should have increased by 1
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerBalance + 1);
        //'to' address should have been made an approver
        expect(await Challenge.getApproved(nextTokenId)).to.equal(addr1.address);
        //token timestamp should match current block timestamp
        expect(await Challenge.GetTimestamp(nextTokenId)).to.equal((await ethers.provider.getBlock("latest")).timestamp);
        //Next token id should have increase by 1
        expect(await Challenge.nextTokenId()).to.equal(nextTokenId + 1);
    });
});

describe("Test Decline Challenge", () => {
    //Signers and contract
    let owner, addr1, addr2, Challenge;
    //Get signers and contract and create challenge prior to running each tests
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        //Challenge constructor depends on an existing Game contract
        const Game = await Utils.DeployContract("Game");
        Challenge = await Utils.DeployContract("Challenge", [Game.address]);
        await Challenge.CreateChallenge(addr1.address, 0);
    });
    it("DeclineChallenge should burn the token if challenger declines", async () => {
        //Get owner balance before declining challenge
        const ownerBalance = await Challenge.balanceOf(owner.address);
        //This test depends on the owner having a token to burn
        expect(ownerBalance).to.be.greaterThan(0);
        //Contract call to decline the challenge
        await Challenge.DeclineChallenge(0);
        //Owner balance should have decreased by 1
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerBalance - 1);
    });
    it("DeclineChallenge should burn the token if challenged declines", async () => {
        //Get owner balance before declining challenge
        const ownerBalance = await Challenge.balanceOf(owner.address);
        //This test depends on the owner having a token to burn
        expect(ownerBalance).to.be.greaterThan(0);
        //Contract call to decline the challenge
        await Challenge.connect(addr1).DeclineChallenge(0);
        //Owner balance should have decreased by 1
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerBalance - 1);
    });
    it("DeclineChallenge should block uninvolved users", async () => {
        //Get owner balance before declining challenge
        const ownerBalance = await Challenge.balanceOf(owner.address);
        //This test depends on the owner having a token to burn
        expect(ownerBalance).to.be.greaterThan(0);
        //Expect contract call to fail when uninvolved user addr2 attempts to decline
        await expect(Challenge.connect(addr2).DeclineChallenge(0)).to.be.rejectedWith(Error);
        //Owner balance should be the same
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerBalance);
    });
});

describe("Test Accept Challenge", () => {
    //Signers and contract
    let owner, addr1, addr2, Game, Challenge;
    //Get signers and contract and create challenge prior to running each tests
    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        //Challenge constructor depends on an existing Game contract
        Game = await Utils.DeployContract("Game");
        Challenge = await Utils.DeployContract("Challenge", [Game.address]);
        //Create a challenge prior to each test
        await Challenge.CreateChallenge(addr1.address, 0);
    });
    it("AcceptChallenge should mint a Game token and burn a Challenge token", async () => {
        //Get initial add1 game balance and owner challenge balance
        const addr1GameBalance = await Game.balanceOf(addr1.address);
        const ownerChallengeBalance = await Challenge.balanceOf(owner.address);
        //Addr1 approves the challenge
        await Challenge.connect(addr1).AcceptChallenge(0);
        //Verify that the addr1 game balance has increased and the owner challenge balance has decreased
        expect(await Game.balanceOf(addr1.address)).to.equal(addr1GameBalance + 1);
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerChallengeBalance - 1);
    });
    it("AcceptChallenge should fail if the challenger attempts to approve", async () => {
        //Accept challenge is expected to fail because only the challenged party can accept
        await expect(Challenge.AcceptChallenge(0)).to.be.rejectedWith(Error);
    });
    it("AcceptChallenge should fail if an uninvolved user attempts to approve", async () => {
        //Accept challenge is expected to fail because only the challenged party can accept
        await expect(Challenge.connect(addr2).AcceptChallenge(0)).to.be.rejectedWith(Error);
    })
    it("AcceptChallenge should fail if challenge has expired", async () => {
        //Fast-forward network time by 24 hours
        await ethers.provider.send("evm_increaseTime", [60*60*24]);
        //Accept challenge is expected to fail because 24 hours has passed
        await expect(Challenge.connect(addr1).AcceptChallenge(0)).to.be.rejectedWith(Error);
    });
});