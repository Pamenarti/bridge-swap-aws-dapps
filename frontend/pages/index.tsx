import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [stakingPeriod, setStakingPeriod] = useState<number>(30);
  
  async function connectWallet() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    setAccount(address);
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Staking Platformu</h1>
        
        {!account ? (
          <button
            onClick={connectWallet}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Cüzdanı Bağla
          </button>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl mb-4">Stake İşlemi</h2>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="border p-2 rounded w-full mb-4"
              placeholder="Stake miktarı"
            />
            <select
              value={stakingPeriod}
              onChange={(e) => setStakingPeriod(Number(e.target.value))}
              className="border p-2 rounded w-full mb-4"
            >
              <option value={30}>30 Gün</option>
              <option value={90}>90 Gün</option>
              <option value={180}>180 Gün</option>
              <option value={365}>365 Gün</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 