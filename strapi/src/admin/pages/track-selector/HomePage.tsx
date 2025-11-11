import React from 'react';
import { Main, Box, Typography } from '@strapi/design-system';
import TrackSelector from './TrackSelector';

const HomePage: React.FC = () => {
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
        <TrackSelector />
      </Box>
    </Main>
  );
};

export default HomePage;
