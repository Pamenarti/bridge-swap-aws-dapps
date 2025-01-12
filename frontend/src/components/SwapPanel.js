import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import React, { useState } from 'react';

import { FaExchangeAlt } from 'react-icons/fa';
import { ethers } from 'ethers';
import { useSwapContract } from '../hooks/useSwapContract';

export const SwapPanel = () => {
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [estimatedOut, setEstimatedOut] = useState('0');
  const toast = useToast();
  const { swapTokens, estimateSwap, loading } = useSwapContract();

  const handleSwap = async () => {
    try {
      await swapTokens(tokenIn, tokenOut, ethers.utils.parseEther(amountIn));
      toast({
        title: 'Swap Successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Swap Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEstimate = async () => {
    if (amountIn && tokenIn && tokenOut) {
      const estimate = await estimateSwap(tokenIn, tokenOut, ethers.utils.parseEther(amountIn));
      setEstimatedOut(ethers.utils.formatEther(estimate));
    }
  };

  const switchTokens = () => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn('');
    setEstimatedOut('0');
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>From</FormLabel>
          <Select
            placeholder="Select token"
            value={tokenIn}
            onChange={(e) => setTokenIn(e.target.value)}
          >
            <option value="token1">Token 1</option>
            <option value="token2">Token 2</option>
            <option value="token3">Token 3</option>
          </Select>
        </FormControl>

        <HStack width="100%" justify="center">
          <Input
            placeholder="Amount"
            value={amountIn}
            onChange={(e) => {
              setAmountIn(e.target.value);
              handleEstimate();
            }}
            type="number"
          />
        </HStack>

        <IconButton
          aria-label="Switch tokens"
          icon={<Icon as={FaExchangeAlt} />}
          onClick={switchTokens}
          variant="ghost"
        />

        <FormControl>
          <FormLabel>To</FormLabel>
          <Select
            placeholder="Select token"
            value={tokenOut}
            onChange={(e) => setTokenOut(e.target.value)}
          >
            <option value="token1">Token 1</option>
            <option value="token2">Token 2</option>
            <option value="token3">Token 3</option>
          </Select>
        </FormControl>

        <Text>Estimated Output: {estimatedOut}</Text>

        <Button
          colorScheme="blue"
          width="100%"
          onClick={handleSwap}
          isLoading={loading}
          loadingText="Swapping..."
          isDisabled={!amountIn || !tokenIn || !tokenOut}
        >
          Swap
        </Button>
      </VStack>
    </Box>
  );
}; 