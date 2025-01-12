import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Progress,
  Select,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import React, { useState } from 'react';

import { ethers } from 'ethers';
import { useBridgeContract } from '../hooks/useBridgeContract';

export const BridgePanel = () => {
  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [destinationChain, setDestinationChain] = useState('');
  const [bridgeStatus, setBridgeStatus] = useState('idle');
  const toast = useToast();
  const { bridgeTokens, loading } = useBridgeContract();

  const handleBridge = async () => {
    try {
      setBridgeStatus('pending');
      await bridgeTokens(token, ethers.utils.parseEther(amount), destinationChain);
      setBridgeStatus('success');
      toast({
        title: 'Bridge Transaction Initiated',
        description: 'Your tokens are being bridged. Please wait for confirmation.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setBridgeStatus('error');
      toast({
        title: 'Bridge Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg">
      <VStack spacing={4}>
        <FormControl>
          <FormLabel>Token to Bridge</FormLabel>
          <Select
            placeholder="Select token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          >
            <option value="token1">Token 1</option>
            <option value="token2">Token 2</option>
            <option value="token3">Token 3</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Amount</FormLabel>
          <Input
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Destination Chain</FormLabel>
          <Select
            placeholder="Select destination chain"
            value={destinationChain}
            onChange={(e) => setDestinationChain(e.target.value)}
          >
            <option value="1">Ethereum Mainnet</option>
            <option value="56">BSC</option>
            <option value="137">Polygon</option>
            <option value="43114">Avalanche</option>
          </Select>
        </FormControl>

        {bridgeStatus === 'pending' && (
          <Box width="100%">
            <Text mb={2}>Bridging in progress...</Text>
            <Progress size="xs" isIndeterminate />
          </Box>
        )}

        {bridgeStatus === 'success' && (
          <Alert status="success">
            <AlertIcon />
            Bridge transaction submitted successfully!
          </Alert>
        )}

        {bridgeStatus === 'error' && (
          <Alert status="error">
            <AlertIcon />
            Bridge transaction failed. Please try again.
          </Alert>
        )}

        <Button
          colorScheme="blue"
          width="100%"
          onClick={handleBridge}
          isLoading={loading}
          loadingText="Processing..."
          isDisabled={!amount || !token || !destinationChain}
        >
          Bridge Tokens
        </Button>
      </VStack>
    </Box>
  );
}; 