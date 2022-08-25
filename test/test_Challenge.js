const { id } = require("@ethersproject/hash");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Test Challenge token contract", () => {

    //Signers and contract factory
    let owner, addr1, addr2, Challenge;

    //Get signers and contract factory prior to running tests
    before(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        Challenge = await ethers.getContractFactory("Challenge");
    })

    //Deployed contract
    let hardhatChallenge;

    //Deploy contract and verify nextTokenId initialization
    it("Deployment should initialize name and symbol", async () => {
        hardhatChallenge = await Challenge.deploy();
        expect(await hardhatChallenge.nextTokenId()).to.equal(0);
    });

    //Create a challenge and verify that owner and operator are both updated
    it("CreateChallenge should mint a new token", async () => {
        //Get the token id of the challenge we're about to create
        const nextTokenId = await hardhatChallenge.nextTokenId();
        //Get owner balance before creating challenge
        const ownerBalance = await hardhatChallenge.balanceOf(owner.address);

        //Contract call to create the challenge
        await hardhatChallenge.CreateChallenge(addr1.address);
        
        //Owner balance should have increased by 1
        expect(await hardhatChallenge.balanceOf(owner.address)).to.equal(ownerBalance + 1);
        //'to' address should have been made an approver
        expect(await hardhatChallenge.getApproved(nextTokenId)).to.equal(addr1.address);
        //Next token id should have increase by 1
        expect(await hardhatChallenge.nextTokenId()).to.equal(nextTokenId + 1);
    });

    it("DeclineChallenge should burn the token", async () => {

        //Get owner balance before declining challenge
        const ownerBalance = await hardhatChallenge.balanceOf(owner.address);

        //This test depends on the owner having a token to burn
        expect(ownerBalance).to.be.greaterThan(0);

        //Contract call to decline the challenge
        await hardhatChallenge.connect(addr1).DeclineChallenge(0);

        
        //Owner balance should have increased by 1
        expect(await hardhatChallenge.balanceOf(owner.address)).to.equal(ownerBalance - 1);
    });
});