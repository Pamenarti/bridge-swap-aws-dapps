const AWS = require('aws-sdk');
const Web3 = require('web3');

exports.handler = async (event) => {
    const { userAddress } = JSON.parse(event.body);
    const web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    try {
        const stakingContract = new web3.eth.Contract(
            CONTRACT_ABI,
            process.env.CONTRACT_ADDRESS
        );
        
        const userStake = await stakingContract.methods.stakes(userAddress).call();
        const reward = await stakingContract.methods.calculateReward(userAddress).call();
        
        // DynamoDB'ye kullanıcı verilerini kaydet
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        await dynamodb.put({
            TableName: 'UserStakingStats',
            Item: {
                userAddress,
                stakedAmount: web3.utils.fromWei(userStake.amount, 'ether'),
                stakingDate: new Date(userStake.timestamp * 1000).toISOString(),
                calculatedReward: web3.utils.fromWei(reward, 'ether')
            }
        }).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                stake: {
                    amount: web3.utils.fromWei(userStake.amount, 'ether'),
                    timestamp: userStake.timestamp,
                    lockPeriod: userStake.lockPeriod,
                    reward: web3.utils.fromWei(reward, 'ether')
                }
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 