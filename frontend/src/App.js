import {
  Box,
  ChakraProvider,
  Grid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  theme
} from '@chakra-ui/react';

import { BridgePanel } from './components/BridgePanel';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import React from 'react';
import { StakingPanel } from './components/StakingPanel';
import { SwapPanel } from './components/SwapPanel';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          <VStack spacing={8}>
            <Tabs isFitted variant="enclosed" width="100%" maxW="1200px">
              <TabList mb="1em">
                <Tab>Staking</Tab>
                <Tab>Swap</Tab>
                <Tab>Bridge</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <StakingPanel />
                </TabPanel>
                <TabPanel>
                  <SwapPanel />
                </TabPanel>
                <TabPanel>
                  <BridgePanel />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App; 