const ethers = require('ethers');
const Web3 = require('web3');
const dotenv = require('dotenv');
const stakingABI = require('./artifacts/contracts/StakingPlatform.sol/StakingPlatform.json').abi;

class StakingService {
    constructor() {
        dotenv.config();
        this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.contractAddress = process.env.STAKING_PLATFORM_ADDRESS;
    }

    async initializeContract() {
        this.contract = new ethers.Contract(
            this.contractAddress,
            stakingABI,
            this.provider
        );
        this.contractWithSigner = this.contract.connect(this.wallet);
    }

    // Pool Management
    async createPool(stakingToken, rewardToken, rewardRate, lockDuration) {
        const tx = await this.contractWithSigner.createPool(
            stakingToken,
            rewardToken,
            rewardRate,
            lockDuration
        );
        return await tx.wait();
    }

    async getPoolInfo(poolId) {
        const poolInfo = await this.contract.getPoolInfo(poolId);
        return {
            stakingToken: poolInfo.stakingToken,
            rewardToken: poolInfo.rewardToken,
            rewardRate: poolInfo.rewardRate.toString(),
            lockDuration: poolInfo.lockDuration.toString(),
            totalStaked: ethers.utils.formatEther(poolInfo.totalStaked),
            isActive: poolInfo.isActive
        };
    }

    // Staking Operations
    async stake(poolId, amount) {
        const pool = await this.getPoolInfo(poolId);
        const stakingToken = new ethers.Contract(
            pool.stakingToken,
            ['function approve(address spender, uint256 amount) external returns (bool)'],
            this.wallet
        );

        // Approve tokens
        await stakingToken.approve(
            this.contractAddress,
            ethers.utils.parseEther(amount.toString())
        );

        // Stake tokens
        const tx = await this.contractWithSigner.stake(
            poolId,
            ethers.utils.parseEther(amount.toString())
        );
        return await tx.wait();
    }

    async withdraw(poolId, amount) {
        const tx = await this.contractWithSigner.withdraw(
            poolId,
            ethers.utils.parseEther(amount.toString())
        );
        return await tx.wait();
    }

    async claimRewards(poolId) {
        const tx = await this.contractWithSigner.claimRewards(poolId);
        return await tx.wait();
    }

    async toggleCompounding(poolId) {
        const tx = await this.contractWithSigner.toggleCompounding(poolId);
        return await tx.wait();
    }

    // View Functions
    async getUserPools(address) {
        return await this.contract.getUserPools(address);
    }

    async getUserInfo(poolId, address) {
        const userInfo = await this.contract.userInfo(poolId, address);
        return {
            stakedAmount: ethers.utils.formatEther(userInfo.stakedAmount),
            rewards: ethers.utils.formatEther(userInfo.rewards),
            lockEndTime: new Date(userInfo.lockEndTime.toNumber() * 1000),
            isCompounding: userInfo.isCompounding
        };
    }

    async getPendingRewards(poolId, address) {
        const rewards = await this.contract.pendingRewards(poolId, address);
        return ethers.utils.formatEther(rewards);
    }

    // Analytics
    async getPoolAnalytics(poolId) {
        const [poolInfo, totalStaked, rewardRate] = await Promise.all([
            this.getPoolInfo(poolId),
            this.contract.pools(poolId).totalStaked,
            this.contract.pools(poolId).rewardRate
        ]);

        const annualRewards = rewardRate.mul(365 * 24 * 60 * 60); // Yearly rewards
        const apr = totalStaked.gt(0) 
            ? annualRewards.mul(100).div(totalStaked)
            : ethers.BigNumber.from(0);

        return {
            ...poolInfo,
            apr: apr.toString() + '%',
            utilizationRate: totalStaked.gt(0) 
                ? (totalStaked.mul(100).div(poolInfo.totalStaked)).toString() + '%'
                : '0%'
        };
    }

    // Event Listeners
    async listenToEvents() {
        this.contract.on("PoolCreated", (poolId, stakingToken, rewardToken, event) => {
            console.log(`
                New Pool Created:
                Pool ID: ${poolId}
                Staking Token: ${stakingToken}
                Reward Token: ${rewardToken}
            `);
        });

        this.contract.on("Staked", (poolId, user, amount, event) => {
            console.log(`
                Tokens Staked:
                Pool ID: ${poolId}
                User: ${user}
                Amount: ${ethers.utils.formatEther(amount)}
            `);
        });

        this.contract.on("RewardPaid", (poolId, user, reward, event) => {
            console.log(`
                Rewards Claimed:
                Pool ID: ${poolId}
                User: ${user}
                Reward: ${ethers.utils.formatEther(reward)}
            `);
        });

        this.contract.on("CompoundingEnabled", (poolId, user, event) => {
            console.log(`
                Compounding Enabled:
                Pool ID: ${poolId}
                User: ${user}
            `);
        });
    }

    // Helper Functions
    calculateAPR(rewardRate, totalStaked, rewardTokenPrice, stakingTokenPrice) {
        if (totalStaked.eq(0)) return 0;
        
        const yearlyRewards = rewardRate.mul(365 * 24 * 60 * 60);
        const rewardValue = yearlyRewards.mul(rewardTokenPrice);
        const stakedValue = totalStaked.mul(stakingTokenPrice);
        
        return rewardValue.mul(100).div(stakedValue).toNumber();
    }

    estimateRewards(poolId, amount, duration) {
        const rewardRate = this.contract.pools(poolId).rewardRate;
        return rewardRate.mul(duration).mul(amount).div(ethers.constants.WeiPerEther);
    }
}

module.exports = StakingService; 