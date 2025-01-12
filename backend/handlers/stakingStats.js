const AWS = require('aws-sdk');
const Web3 = require('web3');

exports.handler = async (event) => {
    const web3 = new Web3(process.env.ETHEREUM_RPC_URL);
    
    try {
        const stakingContract = new web3.eth.Contract(
            CONTRACT_ABI,
            process.env.CONTRACT_ADDRESS
        );
        
        const totalStaked = await stakingContract.methods.getTotalStaked().call();
        const totalStakers = await stakingContract.methods.getTotalStakers().call();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                totalStaked: web3.utils.fromWei(totalStaked, 'ether'),
                totalStakers: totalStakers
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 