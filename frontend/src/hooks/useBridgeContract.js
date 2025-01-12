import BridgeABI from '../contracts/Bridge.json';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useWeb3React } from '@web3-react/core';

export const useBridgeContract = () => {
  const [loading, setLoading] = useState(false);
  const { library, account } = useWeb3React();

  const getContract = () => {
    if (!library) throw new Error('No provider');
    const signer = library.getSigner(account);
    return new ethers.Contract(process.env.REACT_APP_BRIDGE_CONTRACT_ADDRESS, BridgeABI, signer);
  };

  const bridgeTokens = async (token, amount, destinationChainId) => {
    try {
      setLoading(true);
      const contract = getContract();
      const nonce = Date.now(); // Simple nonce generation
      const tx = await contract.lockTokens(token, amount, destinationChainId, nonce);
      await tx.wait();
      return tx;
    } finally {
      setLoading(false);
    }
  };

  const unlockTokens = async (token, to, amount, sourceChainId, nonce, signature) => {
    try {
      setLoading(true);
      const contract = getContract();
      const tx = await contract.unlockTokens(token, to, amount, sourceChainId, nonce, signature);
      await tx.wait();
      return tx;
    } finally {
      setLoading(false);
    }
  };

  return {
    bridgeTokens,
    unlockTokens,
    loading
  };
}; 