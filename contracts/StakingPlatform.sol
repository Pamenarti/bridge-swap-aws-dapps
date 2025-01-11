// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakingPlatform is ReentrancyGuard, Ownable, Pausable {
    using SafeMath for uint256;

    struct Pool {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 rewardRate;
        uint256 lockDuration;
        uint256 totalStaked;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        bool isActive;
    }

    struct UserInfo {
        uint256 stakedAmount;
        uint256 rewards;
        uint256 rewardPerTokenPaid;
        uint256 lockEndTime;
        bool isCompounding;
    }

    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(address => uint256[]) public userPools;

    uint256 public poolCount;
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public minStakeAmount;
    uint256 public earlyWithdrawFee; // In basis points (1% = 100)

    event PoolCreated(uint256 indexed poolId, address stakingToken, address rewardToken);
    event Staked(uint256 indexed poolId, address indexed user, uint256 amount);
    event Withdrawn(uint256 indexed poolId, address indexed user, uint256 amount);
    event RewardPaid(uint256 indexed poolId, address indexed user, uint256 reward);
    event CompoundingEnabled(uint256 indexed poolId, address indexed user);
    event CompoundingDisabled(uint256 indexed poolId, address indexed user);

    constructor(uint256 _minStakeAmount, uint256 _earlyWithdrawFee) {
        require(_earlyWithdrawFee <= 1000, "Fee too high"); // Max 10%
        minStakeAmount = _minStakeAmount;
        earlyWithdrawFee = _earlyWithdrawFee;
    }

    function createPool(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _lockDuration
    ) external onlyOwner {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        
        pools[poolCount] = Pool({
            stakingToken: IERC20(_stakingToken),
            rewardToken: IERC20(_rewardToken),
            rewardRate: _rewardRate,
            lockDuration: _lockDuration,
            totalStaked: 0,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            isActive: true
        });

        emit PoolCreated(poolCount, _stakingToken, _rewardToken);
        poolCount++;
    }

    function stake(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        require(pools[poolId].isActive, "Pool not active");
        require(amount >= minStakeAmount, "Amount too low");

        updatePool(poolId);
        Pool storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];

        if (user.stakedAmount > 0) {
            uint256 pending = pendingRewards(poolId, msg.sender);
            if (pending > 0) {
                user.rewards = user.rewards.add(pending);
            }
        }

        pool.stakingToken.transferFrom(msg.sender, address(this), amount);
        user.stakedAmount = user.stakedAmount.add(amount);
        user.lockEndTime = block.timestamp.add(pool.lockDuration);
        pool.totalStaked = pool.totalStaked.add(amount);
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;

        if (!isUserInPool(msg.sender, poolId)) {
            userPools[msg.sender].push(poolId);
        }

        emit Staked(poolId, msg.sender, amount);
    }

    function withdraw(uint256 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];
        UserInfo storage user = userInfo[poolId][msg.sender];
        require(user.stakedAmount >= amount, "Insufficient balance");

        updatePool(poolId);
        uint256 pending = pendingRewards(poolId, msg.sender);
        if (pending > 0) {
            user.rewards = user.rewards.add(pending);
        }

        uint256 feeAmount = 0;
        if (block.timestamp < user.lockEndTime) {
            feeAmount = amount.mul(earlyWithdrawFee).div(10000);
        }

        user.stakedAmount = user.stakedAmount.sub(amount);
        pool.totalStaked = pool.totalStaked.sub(amount);
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;

        pool.stakingToken.transfer(msg.sender, amount.sub(feeAmount));
        if (feeAmount > 0) {
            pool.stakingToken.transfer(owner(), feeAmount);
        }

        emit Withdrawn(poolId, msg.sender, amount);
    }

    function claimRewards(uint256 poolId) external nonReentrant {
        updatePool(poolId);
        UserInfo storage user = userInfo[poolId][msg.sender];
        Pool storage pool = pools[poolId];

        uint256 pending = pendingRewards(poolId, msg.sender).add(user.rewards);
        require(pending > 0, "No rewards to claim");

        if (user.isCompounding && pool.stakingToken == pool.rewardToken) {
            user.stakedAmount = user.stakedAmount.add(pending);
            pool.totalStaked = pool.totalStaked.add(pending);
        } else {
            pool.rewardToken.transfer(msg.sender, pending);
        }

        user.rewards = 0;
        user.rewardPerTokenPaid = pool.rewardPerTokenStored;

        emit RewardPaid(poolId, msg.sender, pending);
    }

    function toggleCompounding(uint256 poolId) external {
        UserInfo storage user = userInfo[poolId][msg.sender];
        Pool storage pool = pools[poolId];
        require(pool.stakingToken == pool.rewardToken, "Invalid pool for compounding");

        user.isCompounding = !user.isCompounding;

        if (user.isCompounding) {
            emit CompoundingEnabled(poolId, msg.sender);
        } else {
            emit CompoundingDisabled(poolId, msg.sender);
        }
    }

    // Internal functions
    function updatePool(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        if (block.timestamp <= pool.lastUpdateTime) return;

        if (pool.totalStaked == 0) {
            pool.lastUpdateTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp.sub(pool.lastUpdateTime);
        uint256 reward = timeElapsed.mul(pool.rewardRate);
        pool.rewardPerTokenStored = pool.rewardPerTokenStored.add(
            reward.mul(REWARD_PRECISION).div(pool.totalStaked)
        );
        pool.lastUpdateTime = block.timestamp;
    }

    function pendingRewards(uint256 poolId, address user) public view returns (uint256) {
        Pool storage pool = pools[poolId];
        UserInfo storage userInfo = userInfo[poolId][user];

        uint256 rewardPerToken = pool.rewardPerTokenStored;
        if (block.timestamp > pool.lastUpdateTime && pool.totalStaked != 0) {
            uint256 timeElapsed = block.timestamp.sub(pool.lastUpdateTime);
            uint256 reward = timeElapsed.mul(pool.rewardRate);
            rewardPerToken = rewardPerToken.add(
                reward.mul(REWARD_PRECISION).div(pool.totalStaked)
            );
        }

        return userInfo.stakedAmount
            .mul(rewardPerToken.sub(userInfo.rewardPerTokenPaid))
            .div(REWARD_PRECISION);
    }

    function isUserInPool(address user, uint256 poolId) internal view returns (bool) {
        uint256[] storage userPoolIds = userPools[user];
        for (uint256 i = 0; i < userPoolIds.length; i++) {
            if (userPoolIds[i] == poolId) return true;
        }
        return false;
    }

    // Admin functions
    function updatePoolRewardRate(uint256 poolId, uint256 newRate) external onlyOwner {
        updatePool(poolId);
        pools[poolId].rewardRate = newRate;
    }

    function setMinStakeAmount(uint256 _minStakeAmount) external onlyOwner {
        minStakeAmount = _minStakeAmount;
    }

    function setEarlyWithdrawFee(uint256 _earlyWithdrawFee) external onlyOwner {
        require(_earlyWithdrawFee <= 1000, "Fee too high");
        earlyWithdrawFee = _earlyWithdrawFee;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // View functions
    function getUserPools(address user) external view returns (uint256[] memory) {
        return userPools[user];
    }

    function getPoolInfo(uint256 poolId) external view returns (
        address stakingToken,
        address rewardToken,
        uint256 rewardRate,
        uint256 lockDuration,
        uint256 totalStaked,
        bool isActive
    ) {
        Pool storage pool = pools[poolId];
        return (
            address(pool.stakingToken),
            address(pool.rewardToken),
            pool.rewardRate,
            pool.lockDuration,
            pool.totalStaked,
            pool.isActive
        );
    }
} 