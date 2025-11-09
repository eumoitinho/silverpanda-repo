import React, { useState } from 'react';
import { Main, Box, Typography, Tabs } from '@strapi/design-system';
import { Music, PlaySquare, Picture } from '@strapi/icons';
import TrackSelector from '../TrackSelector';
import VideoSelector from '../VideoSelector';
import InstagramSelector from '../InstagramSelector';

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
              <Music />
              Music (Spotify/SoundCloud)
            </Tabs.Trigger>
            <Tabs.Trigger value="videos">
              <PlaySquare />
              Videos (YouTube)
            </Tabs.Trigger>
            <Tabs.Trigger value="instagram">
              <Picture />
              Collaborations (Instagram)
            </Tabs.Trigger>
          </Tabs.List>

          <Box paddingTop={6}>
            <Tabs.Content value="music">
              <TrackSelector />
            </Tabs.Content>
            <Tabs.Content value="videos">
              <VideoSelector />
            </Tabs.Content>
            <Tabs.Content value="instagram">
              <InstagramSelector />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Main>
  );
};

export default HomePage;

