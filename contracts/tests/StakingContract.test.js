const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingPlatform", function () {
    let stakingPlatform;
    let stakingToken;
    let owner;
    let addr1;
    
    beforeEach(async function () {
        // Test token'ı deploy et
        const TestToken = await ethers.getContractFactory("TestToken");
        stakingToken = await TestToken.deploy();
        await stakingToken.deployed();
        
        // Staking kontratını deploy et
        const StakingPlatform = await ethers.getContractFactory("StakingPlatform");
        stakingPlatform = await StakingPlatform.deploy(stakingToken.address);
        await stakingPlatform.deployed();
        
        [owner, addr1] = await ethers.getSigners();
    });
    
    it("Stake işlemi başarılı olmalı", async function () {
        const stakeAmount = ethers.utils.parseEther("100");
        await stakingToken.approve(stakingPlatform.address, stakeAmount);
        
        await expect(stakingPlatform.stake(stakeAmount, 30 * 24 * 60 * 60))
            .to.emit(stakingPlatform, "Staked")
            .withArgs(owner.address, stakeAmount, 30 * 24 * 60 * 60);
    });
}); 