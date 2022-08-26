const { expect } = require("chai");
const { ethers } = require("hardhat");

//Utility function to deploy a contract
async function deployContract(name, args = []) {
    const factory = await ethers.getContractFactory(name);
    const contract = await factory.deploy(...args);
    return contract;
};

describe("Test Challenge Contract Deployment", () => {
    //Deploy contract and verify nextTokenId initialization
    it("Deployment should initialize nextTokenId, name, and symbol", async () => {
        //Challenge constructor depends on an existing Game contract
        const Game = await deployContract("Game");
        const Challenge = await deployContract("Challenge", [Game.address]);
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
        const Game = await deployContract("Game");
        Challenge = await deployContract("Challenge", [Game.address]);
    });
    //Create a challenge and verify that owner and operator are both updated
    it("CreateChallenge should mint a new token", async () => {
        //Get the token id of the challenge we're about to create
        const nextTokenId = await Challenge.nextTokenId();
        //Get owner balance before creating challenge
        const ownerBalance = await Challenge.balanceOf(owner.address);
        //Contract call to create the challenge
        await Challenge.CreateChallenge(addr1.address);
        //Owner balance should have increased by 1
        expect(await Challenge.balanceOf(owner.address)).to.equal(ownerBalance + 1);
        //'to' address should have been made an approver
        expect(await Challenge.getApproved(nextTokenId)).to.equal(addr1.address);
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
        Challenge = await deployContract("Challenge", ['0x0000000000000000000000000000000000000000']);
        await Challenge.CreateChallenge(addr1.address);
    });
    it("DeclineChallenge should burn the token", async () => {
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