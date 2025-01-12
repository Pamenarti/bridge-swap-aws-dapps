import SwapABI from '../contracts/Swap.json';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';

export const useSwapContract = () => {
  const [loading, setLoading] = useState(false);
  const { library, account } = useWeb3React();

  const getContract = () => {
    if (!library) throw new Error('No provider');
    const signer = library.getSigner(account);
    return new ethers.Contract(process.env.REACT_APP_SWAP_CONTRACT_ADDRESS, SwapABI, signer);
  };

  const swapTokens = async (tokenIn, tokenOut, amountIn) => {
    try {
      setLoading(true);
      const contract = getContract();
      const tx = await contract.swap(tokenIn, tokenOut, amountIn);
      await tx.wait();
      return tx;
    } finally {
      setLoading(false);
    }
  };

  const estimateSwap = async (tokenIn, tokenOut, amountIn) => {
    const contract = getContract();
    return await contract.estimateSwap(tokenIn, tokenOut, amountIn);
  };

  return {
    swapTokens,
    estimateSwap,
    loading
  };
}; 