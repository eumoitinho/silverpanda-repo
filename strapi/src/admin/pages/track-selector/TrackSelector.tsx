import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Grid,
  Card,
  TextInput,
  Flex,
  Alert,
  Loader,
} from '@strapi/design-system';
import { useQuery } from 'react-query';
import { Check, Search } from '@strapi/icons';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string | null;
  externalUrl?: string | null;
}

const getBackendURL = () => {
  if (typeof window !== 'undefined') {
    if ((window as any).strapi?.backendURL) {
      return (window as any).strapi.backendURL;
    }
    return window.location.origin;
  }
  return '';
};

const TrackSelector: React.FC = () => {
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const fetchTracks = async (): Promise<Track[]> => {
    try {
      const backendURL = getBackendURL();
      const url = `${backendURL}/api/music-page/available-tracks?provider=spotify`;
      console.log('[TrackSelector] Fetching tracks from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TrackSelector] Failed to fetch tracks:', response.status, errorText);
        throw new Error(`Failed to fetch tracks: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[TrackSelector] Received tracks data:', data);
      return data.data || [];
    } catch (error) {
      console.error('[TrackSelector] Error in fetchTracks:', error);
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const { data: tracks = [], isLoading, error } = useQuery(
    ['tracks', 'spotify'],
    fetchTracks,
    { 
      retry: 1,
      onError: (error) => {
        console.error('[TrackSelector] Tracks error:', error);
        showNotification('error', `Failed to load tracks: ${error?.message || 'Unknown error'}`);
      },
      onSuccess: (data) => {
        console.log('[TrackSelector] Tracks loaded successfully:', data?.length || 0, 'tracks');
        if (data && data.length === 0) {
          showNotification('warning', 'No tracks found. Check Spotify API credentials.');
        }
      },
    }
  );

  const filteredTracks = tracks.filter((track) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      track.title.toLowerCase().includes(search) ||
      track.artist.toLowerCase().includes(search) ||
      (track.album && track.album.toLowerCase().includes(search))
    );
  });

  const handleToggleTrack = (trackId: string) => {
    setSelectedTracks((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      }
      return [...prev, trackId];
    });
  };

  const handleSelectAll = () => {
    setSelectedTracks(filteredTracks.map((track) => track.id));
  };

  const handleDeselectAll = () => {
    setSelectedTracks([]);
  };

  useEffect(() => {
    console.log('[TrackSelector] Component state:', {
      isLoading,
      tracksCount: tracks.length,
      filteredCount: filteredTracks.length,
      error: error?.message,
      searchTerm,
    });
  }, [isLoading, tracks.length, filteredTracks.length, error, searchTerm]);

  return (
    <Box>
      <Box paddingBottom={4}>
        <Typography variant="beta" as="h2">
          Spotify Tracks
        </Typography>
        <Typography variant="omega" textColor="neutral600" as="p">
          Select tracks to display on the Music page
        </Typography>
      </Box>
      {notification && (
        <Box padding={2} marginBottom={4}>
          <Alert
            closeLabel="Close"
            title={notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Warning'}
            variant={notification.type === 'success' ? 'success' : notification.type === 'error' ? 'danger' : 'warning'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Alert>
        </Box>
      )}
      <Box padding={4}>
        <Flex direction="column" gap={6}>
          {/* Search and Actions */}
          <Box>
            <Flex gap={3} alignItems="flex-end">
              <Box flex="1">
                <TextInput
                  placeholder="Search by track name, artist, or album..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  startAction={<Search />}
                  size="M"
                />
              </Box>
              <Button 
                variant="secondary" 
                onClick={handleSelectAll}
                disabled={filteredTracks.length === 0 || selectedTracks.length === filteredTracks.length}
              >
                Select All ({filteredTracks.length})
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleDeselectAll}
                disabled={selectedTracks.length === 0}
              >
                Clear Selection
              </Button>
            </Flex>
          </Box>

          {isLoading ? (
            <Box padding={8} textAlign="center">
              <Loader>Loading tracks...</Loader>
            </Box>
          ) : error ? (
            <Alert closeLabel="Close" title="Error loading tracks" variant="danger">
              {error?.message || 'Failed to load tracks. Check console and server logs for details.'}
              <Box paddingTop={2}>
                <Typography variant="pi" textColor="neutral600">
                  Make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are configured in strapi/.env
                </Typography>
              </Box>
            </Alert>
          ) : filteredTracks.length === 0 ? (
            <Alert closeLabel="Close" title="No tracks found">
              {searchTerm 
                ? 'No tracks match your search.' 
                : tracks.length === 0 
                  ? 'No tracks available. Check Spotify API credentials in strapi/.env'
                  : 'No tracks match your search.'}
            </Alert>
          ) : (
            <>
              {/* Summary */}
              <Box 
                padding={3} 
                background="neutral100" 
                borderRadius="4px"
                style={{ border: '1px solid #e0e0e0' }}
              >
                <Flex justifyContent="space-between" alignItems="center">
                  <Typography variant="omega" fontWeight="semiBold">
                    {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''} available
                  </Typography>
                  {selectedTracks.length > 0 && (
                    <Typography variant="omega" textColor="primary600" fontWeight="semiBold">
                      {selectedTracks.length} selected
                    </Typography>
                  )}
                </Flex>
              </Box>

              {/* Tracks Grid */}
              <Grid.Root gap={4} colCount={4}>
                {filteredTracks.map((track) => {
                  const isSelected = selectedTracks.includes(track.id);
                  return (
                    <Grid.Item key={track.id} col={1} xs={12} s={6} m={4} xl={3}>
                      <Card
                        padding={0}
                        style={{
                          cursor: 'pointer',
                          border: isSelected ? '2px solid #4945ff' : '1px solid #e0e0e0',
                          backgroundColor: isSelected ? '#f0f0ff' : 'white',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(73, 69, 255, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                        onClick={() => handleToggleTrack(track.id)}
                        onMouseEnter={(e: any) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#4945ff';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(73, 69, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={(e: any) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                      >
                        <Flex direction="column" gap={0}>
                          {/* Artwork */}
                          <Box
                            style={{
                              width: '100%',
                              aspectRatio: '1',
                              backgroundImage: track.artwork 
                                ? `url(${track.artwork})` 
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              position: 'relative',
                            }}
                          >
                            {isSelected && (
                              <Box
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: '#4945ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 8px rgba(73, 69, 255, 0.4)',
                                }}
                              >
                                <Check style={{ color: 'white', width: '16px', height: '16px' }} />
                              </Box>
                            )}
                          </Box>
                          
                          {/* Track Info */}
                          <Box padding={3}>
                            <Flex direction="column" gap={1}>
                              <Typography 
                                fontWeight="bold" 
                                variant="omega"
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={track.title}
                              >
                                {track.title}
                              </Typography>
                              <Typography 
                                variant="pi" 
                                textColor="neutral600"
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={track.artist}
                              >
                                {track.artist}
                              </Typography>
                              {track.album && (
                                <Typography 
                                  variant="pi" 
                                  textColor="neutral500"
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: '11px',
                                  }}
                                  title={track.album}
                                >
                                  {track.album}
                                </Typography>
                              )}
                            </Flex>
                          </Box>
                        </Flex>
                      </Card>
                    </Grid.Item>
                  );
                })}
              </Grid.Root>

              {/* Selection Summary */}
              {selectedTracks.length > 0 && (
                <Box 
                  padding={4}
                  background="primary100"
                  borderRadius="4px"
                  style={{ border: '1px solid #4945ff' }}
                >
                  <Flex direction="column" gap={2}>
                    <Typography variant="omega" fontWeight="semiBold" textColor="primary700">
                      {selectedTracks.length} track{selectedTracks.length !== 1 ? 's' : ''} selected
                    </Typography>
                    <Typography variant="pi" textColor="neutral600">
                      Selected tracks will be saved to JSON. Strapi integration will be added later.
                    </Typography>
                  </Flex>
                </Box>
              )}
            </>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default TrackSelector;

