const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Staking Platform", function () {
    let StakingPlatform, stakingPlatform;
    let TestToken, stakingToken, rewardToken;
    let owner, user1, user2;
    
    const INITIAL_SUPPLY = ethers.utils.parseEther("1000000");
    const REWARD_RATE = ethers.utils.parseEther("0.1"); // 0.1 token per second
    const MIN_STAKE = ethers.utils.parseEther("100");
    const EARLY_WITHDRAW_FEE = 500; // 5%
    const LOCK_DURATION = 7 * 24 * 60 * 60; // 1 week
    
    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();
        
        // Deploy test tokens
        TestToken = await ethers.getContractFactory("TestToken");
        stakingToken = await TestToken.deploy("Staking Token", "STK");
        rewardToken = await TestToken.deploy("Reward Token", "RWD");
        await stakingToken.deployed();
        await rewardToken.deployed();
        
        // Mint initial supplies
        await stakingToken.mint(user1.address, INITIAL_SUPPLY);
        await rewardToken.mint(owner.address, INITIAL_SUPPLY);
        
        // Deploy staking platform
        StakingPlatform = await ethers.getContractFactory("StakingPlatform");
        stakingPlatform = await StakingPlatform.deploy(MIN_STAKE, EARLY_WITHDRAW_FEE);
        await stakingPlatform.deployed();
        
        // Create staking pool
        await stakingPlatform.createPool(
            stakingToken.address,
            rewardToken.address,
            REWARD_RATE,
            LOCK_DURATION
        );
        
        // Fund reward pool
        await rewardToken.approve(stakingPlatform.address, INITIAL_SUPPLY);
        await stakingPlatform.fundRewardPool(0, INITIAL_SUPPLY.div(2));
    });
    
    describe("Pool Creation", function () {
        it("Should create pool with correct parameters", async function () {
            const poolInfo = await stakingPlatform.getPoolInfo(0);
            
            expect(poolInfo.stakingToken).to.equal(stakingToken.address);
            expect(poolInfo.rewardToken).to.equal(rewardToken.address);
            expect(poolInfo.rewardRate).to.equal(REWARD_RATE);
            expect(poolInfo.lockDuration).to.equal(LOCK_DURATION);
            expect(poolInfo.isActive).to.be.true;
        });
    });
    
    describe("Staking", function () {
        const stakeAmount = ethers.utils.parseEther("1000");
        
        beforeEach(async function () {
            await stakingToken.connect(user1).approve(
                stakingPlatform.address,
                stakeAmount
            );
        });
        
        it("Should stake tokens correctly", async function () {
            await expect(
                stakingPlatform.connect(user1).stake(0, stakeAmount)
            ).to.emit(stakingPlatform, "Staked")
             .withArgs(0, user1.address, stakeAmount);
            
            const userInfo = await stakingPlatform.userInfo(0, user1.address);
            expect(userInfo.stakedAmount).to.equal(stakeAmount);
        });
        
        it("Should fail if amount below minimum", async function () {
            await expect(
                stakingPlatform.connect(user1).stake(0, MIN_STAKE.sub(1))
            ).to.be.revertedWith("Amount too low");
        });
    });
    
    describe("Rewards", function () {
        const stakeAmount = ethers.utils.parseEther("1000");
        
        beforeEach(async function () {
            await stakingToken.connect(user1).approve(
                stakingPlatform.address,
                stakeAmount
            );
            await stakingPlatform.connect(user1).stake(0, stakeAmount);
        });
        
        it("Should accumulate rewards correctly", async function () {
            // Advance time by 1 day
            await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
            await network.provider.send("evm_mine");
            
            const pendingRewards = await stakingPlatform.pendingRewards(0, user1.address);
            expect(pendingRewards).to.be.gt(0);
        });
        
        it("Should claim rewards successfully", async function () {
            await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
            await network.provider.send("evm_mine");
            
            const pendingBefore = await stakingPlatform.pendingRewards(0, user1.address);
            await stakingPlatform.connect(user1).claimRewards(0);
            
            const rewardBalance = await rewardToken.balanceOf(user1.address);
            expect(rewardBalance).to.equal(pendingBefore);
        });
    });
    
    describe("Withdrawal", function () {
        const stakeAmount = ethers.utils.parseEther("1000");
        
        beforeEach(async function () {
            await stakingToken.connect(user1).approve(
                stakingPlatform.address,
                stakeAmount
            );
            await stakingPlatform.connect(user1).stake(0, stakeAmount);
        });
        
        it("Should apply early withdrawal fee", async function () {
            const withdrawAmount = ethers.utils.parseEther("500");
            const expectedFee = withdrawAmount.mul(EARLY_WITHDRAW_FEE).div(10000);
            
            await stakingPlatform.connect(user1).withdraw(0, withdrawAmount);
            
            const balanceAfter = await stakingToken.balanceOf(user1.address);
            expect(balanceAfter).to.equal(
                INITIAL_SUPPLY.sub(stakeAmount).add(withdrawAmount).sub(expectedFee)
            );
        });
        
        it("Should withdraw without fee after lock period", async function () {
            await network.provider.send("evm_increaseTime", [LOCK_DURATION + 1]);
            await network.provider.send("evm_mine");
            
            await stakingPlatform.connect(user1).withdraw(0, stakeAmount);
            
            const balanceAfter = await stakingToken.balanceOf(user1.address);
            expect(balanceAfter).to.equal(INITIAL_SUPPLY);
        });
    });
    
    describe("Compounding", function () {
        it("Should enable compounding for same token pools", async function () {
            // Create pool with same staking and reward token
            await stakingPlatform.createPool(
                stakingToken.address,
                stakingToken.address,
                REWARD_RATE,
                LOCK_DURATION
            );
            
            await expect(
                stakingPlatform.connect(user1).toggleCompounding(1)
            ).to.emit(stakingPlatform, "CompoundingEnabled")
             .withArgs(1, user1.address);
        });
        
        it("Should compound rewards automatically", async function () {
            // Setup same token pool
            await stakingPlatform.createPool(
                stakingToken.address,
                stakingToken.address,
                REWARD_RATE,
                LOCK_DURATION
            );
            
            const stakeAmount = ethers.utils.parseEther("1000");
            await stakingToken.connect(user1).approve(
                stakingPlatform.address,
                stakeAmount
            );
            await stakingPlatform.connect(user1).stake(1, stakeAmount);
            await stakingPlatform.connect(user1).toggleCompounding(1);
            
            // Advance time
            await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
            await network.provider.send("evm_mine");
            
            // Claim rewards (should auto-compound)
            await stakingPlatform.connect(user1).claimRewards(1);
            
            const userInfo = await stakingPlatform.userInfo(1, user1.address);
            expect(userInfo.stakedAmount).to.be.gt(stakeAmount);
        });
    });
}); 