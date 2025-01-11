# 🏦 Advanced Staking Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-%5E0.8.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

## 📝 Description

A comprehensive staking platform supporting multiple tokens, flexible reward mechanisms, and advanced features like auto-compounding and lock periods.

### 🚀 Features

- 🔄 Multi-token support
- 💰 Flexible reward rates
- 🔒 Customizable lock periods
- 📈 Auto-compounding
- ⚡ APR calculations
- 🛡️ Early withdrawal fees
- 📊 Real-time analytics

## 🛠 Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/staking-platform

# Navigate to project directory
cd staking-platform

# Install dependencies
npm install

# Create environment file
cp .env.example .env
\`\`\`

## ⚙️ Configuration

Configure your \`.env\` file:

\`\`\`env
RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
STAKING_PLATFORM_ADDRESS=deployed_contract_address
\`\`\`

## 📖 Usage Examples

### Create Staking Pool

\`\`\`javascript
const StakingService = require('./index.js');
const staking = new StakingService();

// Create new staking pool
await staking.createPool(
    stakingTokenAddress,
    rewardTokenAddress,
    ethers.utils.parseEther("0.1"), // 0.1 tokens per second
    7 * 24 * 60 * 60 // 1 week lock
);
\`\`\`

### Stake Tokens

\`\`\`javascript
// Stake tokens in pool
await staking.stake(
    poolId,
    ethers.utils.parseEther("1000")
);
\`\`\`

### Enable Auto-compounding

\`\`\`javascript
// Enable auto-compounding for pool
await staking.toggleCompounding(poolId);
\`\`\`

## 📊 Pool Templates

| Type | Lock Period | Early Withdraw Fee | Compounding |
|------|-------------|-------------------|-------------|
| Flexible | None | 5% | Optional |
| Locked | 30 days | 10% | Optional |
| High Yield | 90 days | 15% | Mandatory |

## 🔒 Security Features

### Withdrawal Checks
\`\`\`solidity
require(user.stakedAmount >= amount, "Insufficient balance");
require(block.timestamp >= user.lockEndTime, "Lock period active");
\`\`\`

### Fee Calculation
\`\`\`javascript
const feeAmount = amount.mul(earlyWithdrawFee).div(10000);
\`\`\`

## 📈 Analytics & Monitoring

\`\`\`javascript
// Get pool analytics
const analytics = await staking.getPoolAnalytics(poolId);
console.log(`
    APR: ${analytics.apr}
    Total Staked: ${analytics.totalStaked}
    Utilization: ${analytics.utilizationRate}
`);
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/StakingPlatform.test.js

# Get coverage report
npx hardhat coverage
\`\`\`

## 📈 Contract Functions

| Function | Description | Access |
|----------|-------------|--------|
| \`createPool\` | Create new staking pool | Owner |
| \`stake\` | Stake tokens in pool | Public |
| \`withdraw\` | Withdraw staked tokens | Public |
| \`claimRewards\` | Claim accumulated rewards | Public |
| \`toggleCompounding\` | Enable/disable auto-compound | Public |

## 🛡️ Security Measures

- ✅ Reentrancy protection
- ✅ SafeMath operations
- ✅ Access controls
- ✅ Emergency pause
- ✅ Fee limits
- ✅ Lock period validation

## 🔍 Implementation Details

\`\`\`solidity
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
\`\`\`

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See \`LICENSE\` for more information.

## 📞 Contact

Your Name - [@yourusername](https://twitter.com/yourusername)

Project Link: [https://github.com/yourusername/staking-platform](https://github.com/yourusername/staking-platform)

## 🙏 Acknowledgments

- OpenZeppelin Contracts
- Hardhat
- Ethers.js
- Web3.js 