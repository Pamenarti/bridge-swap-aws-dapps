// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPlatform is ReentrancyGuard, Ownable {
    IERC20 public stakingToken;
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod;
        uint256 reward;
    }
    
    mapping(address => Stake) public stakes;
    
    uint256 public rewardRate = 10; // %10 yıllık ödül oranı
    
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Withdrawn(address indexed user, uint256 amount, uint256 reward);
    
    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }
    
    function stake(uint256 _amount, uint256 _lockPeriod) external nonReentrant {
        require(_amount > 0, "Sifir miktarda stake yapilamaz");
        require(_lockPeriod >= 30 days, "Minimum stake suresi 30 gun");
        
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        
        stakes[msg.sender] = Stake({
            amount: _amount,
            timestamp: block.timestamp,
            lockPeriod: _lockPeriod,
            reward: 0
        });
        
        emit Staked(msg.sender, _amount, _lockPeriod);
    }
    
    function withdraw() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "Stake bulunamadi");
        require(block.timestamp >= userStake.timestamp + userStake.lockPeriod, 
                "Stake suresi dolmadi");
        
        uint256 reward = calculateReward(msg.sender);
        uint256 totalAmount = userStake.amount + reward;
        
        delete stakes[msg.sender];
        
        stakingToken.transfer(msg.sender, totalAmount);
        
        emit Withdrawn(msg.sender, userStake.amount, reward);
    }
    
    function calculateReward(address _user) public view returns (uint256) {
        Stake memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;
        
        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        return (userStake.amount * rewardRate * stakingDuration) / (365 days * 100);
    }
} 