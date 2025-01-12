import { useCallback, useState } from 'react';

import StakingPlatform from '../contracts/StakingPlatform.json';
import { ethers } from 'ethers';

export const useStakingContract = () => {
    const [loading, setLoading] = useState(false);
    
    const getContract = useCallback(async () => {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask yüklü değil');
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(
            process.env.NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS!,
            StakingPlatform.abi,
            signer
        );
    }, []);
    
    const stake = async (amount: ethers.BigNumber, duration: number) => {
        setLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.stake(amount, duration);
            await tx.wait();
        } finally {
            setLoading(false);
        }
    };
    
    const withdraw = async () => {
        setLoading(true);
        try {
            const contract = await getContract();
            const tx = await contract.withdraw();
            await tx.wait();
        } finally {
            setLoading(false);
        }
    };
    
    return { stake, withdraw, loading };
}; 