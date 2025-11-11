import React, { useState } from 'react';
import { Main, Box, Typography, Tabs, Flex } from '@strapi/design-system';
import { Play, PlaySquare, Picture } from '@strapi/icons';
import TrackSelector from '../TrackSelector';

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'music' | 'videos' | 'instagram'>('music');

  return (
    <Main>
      <Box padding={8}>
        <Box paddingBottom={6}>
          <Typography variant="alpha" as="h1">
            Content Manager
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            Select content from Spotify, YouTube, and Instagram to display on your website
          </Typography>
        </Box>

        <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <Tabs.List aria-label="Content selection tabs">
            <Tabs.Trigger value="music">
              <Flex gap={2} alignItems="center">
                <Play />
                <span>Music (Spotify/SoundCloud)</span>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="videos">
              <Flex gap={2} alignItems="center">
                <PlaySquare />
                <span>Videos (YouTube)</span>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="instagram">
              <Flex gap={2} alignItems="center">
                <Picture />
                <span>Collaborations (Instagram)</span>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box paddingTop={6}>
            <Tabs.Content value="music">
              <TrackSelector />
            </Tabs.Content>
            <Tabs.Content value="videos">
              <Box padding={4}>
                <Typography variant="beta">Videos (YouTube)</Typography>
                <Typography variant="omega" textColor="neutral600">
                  Coming soon...
                </Typography>
              </Box>
            </Tabs.Content>
            <Tabs.Content value="instagram">
              <Box padding={4}>
                <Typography variant="beta">Collaborations (Instagram)</Typography>
                <Typography variant="omega" textColor="neutral600">
                  Coming soon...
                </Typography>
              </Box>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Main>
  );
};

export default HomePage;

