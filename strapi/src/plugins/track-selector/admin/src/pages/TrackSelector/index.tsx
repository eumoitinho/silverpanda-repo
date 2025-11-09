import React, { useState, useEffect } from 'react';
import {
  Main,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  Checkbox,
  TextInput,
  Flex,
  Alert,
  Loader,
} from '@strapi/design-system';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, Search } from '@strapi/icons';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string | null;
  externalUrl?: string | null;
}

// These functions will be defined inside the component to use useFetchClient

const getAuthToken = () => {
  // Try to get token from localStorage or sessionStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken') || '';
  }
  return '';
};

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
  const [provider, setProvider] = useState<'spotify' | 'soundcloud'>('spotify');
  const [selectedSpotify, setSelectedSpotify] = useState<string[]>([]);
  const [selectedSoundcloud, setSelectedSoundcloud] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const fetchTracks = async (provider: string): Promise<Track[]> => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const url = `${backendURL}/api/music-page/available-tracks?provider=${provider}`;
      console.log('[TrackSelector] Fetching tracks from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
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

  const fetchMusicPage = async () => {
    const token = getAuthToken();
    const backendURL = getBackendURL();
    const response = await fetch(`${backendURL}/api/music-page`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch music page');
    const data = await response.json();
    return data.data || {};
  };

  const updateMusicPage = async (selectedSpotifyIds: string[], selectedSoundcloudIds: string[]) => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const musicPage = await fetchMusicPage();
      
      // Clean up the data - remove system fields and existing components
      const { 
        id, 
        documentId, 
        createdAt, 
        updatedAt, 
        publishedAt, 
        createdBy, 
        updatedBy,
        spotifyTracks, // Remove existing components - will be created by lifecycle
        soundcloudTracks, // Remove existing components - will be created by lifecycle
        ...cleanData 
      } = musicPage;
      
      // Build payload without undefined fields
      const payloadData: any = {
        ...cleanData,
        selectedSpotifyTrackIds: selectedSpotifyIds,
        selectedSoundcloudTrackIds: selectedSoundcloudIds,
      };
      
      // Remove undefined fields
      Object.keys(payloadData).forEach((key) => {
        if (payloadData[key] === undefined) {
          delete payloadData[key];
        }
      });
      
      const payload = {
        data: payloadData,
      };
      
      console.log('[TrackSelector] Updating music page with:', {
        selectedSpotifyIds: selectedSpotifyIds.length,
        selectedSoundcloudIds: selectedSoundcloudIds.length,
      });
      
      const response = await fetch(`${backendURL}/api/music-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[TrackSelector] Update failed:', response.status, errorText);
        let errorMessage = 'Failed to update music page';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorText;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('[TrackSelector] Update successful:', result);
      return result;
    } catch (error) {
      console.error('[TrackSelector] Error in updateMusicPage:', error);
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const { data: musicPage, isLoading: loadingPage } = useQuery('music-page', fetchMusicPage);
  const { data: spotifyTracks = [], isLoading: loadingSpotify, error: spotifyError } = useQuery(
    ['tracks', 'spotify'],
    () => fetchTracks('spotify'),
    { 
      enabled: provider === 'spotify',
      retry: 1,
      onError: (error) => {
        console.error('[TrackSelector] Spotify tracks error:', error);
      },
    }
  );
  const { data: soundcloudTracks = [], isLoading: loadingSoundcloud, error: soundcloudError } = useQuery(
    ['tracks', 'soundcloud'],
    () => fetchTracks('soundcloud'),
    { 
      enabled: provider === 'soundcloud',
      retry: 1,
      onError: (error) => {
        console.error('[TrackSelector] SoundCloud tracks error:', error);
      },
    }
  );

  useEffect(() => {
    console.log('[TrackSelector] State:', {
      provider,
      spotifyTracks: spotifyTracks.length,
      soundcloudTracks: soundcloudTracks.length,
      loadingSpotify,
      loadingSoundcloud,
      spotifyError,
      soundcloudError,
    });
  }, [provider, spotifyTracks, soundcloudTracks, loadingSpotify, loadingSoundcloud, spotifyError, soundcloudError]);

  const updateMutation = useMutation(
    () => updateMusicPage(selectedSpotify, selectedSoundcloud),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('music-page');
        showNotification('success', 'Tracks saved successfully!');
      },
      onError: (error: any) => {
        showNotification('error', error?.message || 'Failed to save tracks');
      },
    }
  );

  useEffect(() => {
    if (musicPage) {
      setSelectedSpotify(musicPage.selectedSpotifyTrackIds || []);
      setSelectedSoundcloud(musicPage.selectedSoundcloudTrackIds || []);
    }
  }, [musicPage]);

  const currentTracks = provider === 'spotify' ? spotifyTracks : soundcloudTracks;
  const isLoading = loadingSpotify || loadingSoundcloud || loadingPage;
  const selectedTracks = provider === 'spotify' ? selectedSpotify : selectedSoundcloud;
  const setSelectedTracks = provider === 'spotify' ? setSelectedSpotify : setSelectedSoundcloud;

  const filteredTracks = currentTracks.filter((track) => {
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

  return (
    <Main>
      <Box padding={8}>
        <Box paddingBottom={6}>
          <Typography variant="alpha" as="h1">
            Track Selector
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
            {/* Provider Selection */}
            <Box>
              <Typography variant="sigma" textColor="neutral600" marginBottom={3}>
                Select Provider
              </Typography>
              <Flex gap={2}>
                <Button
                  variant={provider === 'spotify' ? 'default' : 'tertiary'}
                  onClick={() => setProvider('spotify')}
                  size="L"
                  startIcon={provider === 'spotify' ? <Check /> : null}
                >
                  Spotify
                </Button>
                <Button
                  variant={provider === 'soundcloud' ? 'default' : 'tertiary'}
                  onClick={() => setProvider('soundcloud')}
                  size="L"
                  startIcon={provider === 'soundcloud' ? <Check /> : null}
                >
                  SoundCloud
                </Button>
              </Flex>
            </Box>

            {/* Search and Actions */}
            <Box>
              <Flex gap={3} alignItems="flex-end">
                <Box flex="1">
                  <TextInput
                    placeholder="Search by title, artist, or album..."
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

            {(spotifyError || soundcloudError) && (
              <Box padding={2} marginBottom={4}>
                <Alert closeLabel="Close" title="Error loading tracks" variant="danger">
                  {spotifyError?.message || soundcloudError?.message || 'Failed to load tracks. Check console for details.'}
                </Alert>
              </Box>
            )}
            {isLoading ? (
              <Box padding={8} textAlign="center">
                <Loader>Loading tracks...</Loader>
              </Box>
            ) : filteredTracks.length === 0 ? (
              <Alert closeLabel="Close" title="No tracks found">
                {searchTerm 
                  ? 'No tracks match your search.' 
                  : `No tracks available. Provider: ${provider}, Total tracks: ${currentTracks.length}, Loading: ${isLoading ? 'yes' : 'no'}`}
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

                {/* Save Button */}
                <Box 
                  paddingTop={6}
                  paddingBottom={4}
                  style={{
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: 'white',
                    borderTop: '1px solid #e0e0e0',
                    marginTop: '24px',
                  }}
                >
                  <Flex gap={3} justifyContent="space-between" alignItems="center">
                    <Typography variant="omega" textColor="neutral600">
                      {selectedTracks.length > 0 
                        ? `${selectedTracks.length} track${selectedTracks.length !== 1 ? 's' : ''} will be saved`
                        : 'No tracks selected'}
                    </Typography>
                    <Button
                      variant="primary"
                      size="L"
                      startIcon={<Check />}
                      onClick={() => updateMutation.mutate()}
                      loading={updateMutation.isLoading}
                      disabled={selectedTracks.length === 0}
                    >
                      Save Selection{selectedTracks.length > 0 && ` (${selectedTracks.length})`}
                    </Button>
                  </Flex>
                </Box>
              </>
            )}
          </Flex>
        </Box>
      </Box>
    </Main>
  );
};

export default TrackSelector;

