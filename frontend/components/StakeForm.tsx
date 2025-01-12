import { ethers } from 'ethers';
import { useStakingContract } from '../hooks/useStakingContract';
import { useState } from 'react';

export const StakeForm = () => {
    const [amount, setAmount] = useState<string>('');
    const [duration, setDuration] = useState<number>(30);
    const { stake, loading } = useStakingContract();
    
    const handleStake = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await stake(ethers.utils.parseEther(amount), duration * 24 * 60 * 60);
        } catch (error) {
            console.error('Stake hatası:', error);
        }
    };
    
    return (
        <form onSubmit={handleStake} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Stake Miktarı
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="0.0"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Stake Süresi
                </label>
                <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                    <option value={30}>30 Gün</option>
                    <option value={90}>90 Gün</option>
                    <option value={180}>180 Gün</option>
                    <option value={365}>1 Yıl</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
                {loading ? 'İşlem Yapılıyor...' : 'Stake Et'}
            </button>
        </form>
    );
}; 