import React from 'react';
import { Main, Box, Typography } from '@strapi/design-system';

const HomePage: React.FC = () => {
  return (
    <Main>
      <Box padding={8}>
        <Typography variant="alpha" as="h1">
          Content Manager
        </Typography>
        <Typography variant="omega" textColor="neutral600" as="p">
          Select content from Spotify, YouTube, and Instagram to display on your website
        </Typography>
      </Box>
    </Main>
  );
};

export default HomePage;

