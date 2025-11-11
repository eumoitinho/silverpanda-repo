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
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Check, Search, Play } from '@strapi/icons';

interface Video {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  viewCount: number | null;
}

const getAuthToken = () => {
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

const VideoSelector: React.FC = () => {
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const [channelId, setChannelId] = useState('');
  const queryClient = useQueryClient();

  const fetchVideos = async (channelId: string): Promise<Video[]> => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const url = `${backendURL}/api/videos-page/available-videos?channelId=${channelId}`;
      console.log('[VideoSelector] Fetching videos from:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VideoSelector] Failed to fetch videos:', response.status, errorText);
        throw new Error(`Failed to fetch videos: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[VideoSelector] Received videos data:', data);
      return data.data || [];
    } catch (error) {
      console.error('[VideoSelector] Error in fetchVideos:', error);
      throw error;
    }
  };

  const fetchVideosPage = async () => {
    const token = getAuthToken();
    const backendURL = getBackendURL();
    const response = await fetch(`${backendURL}/api/videos-page`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch videos page');
    const data = await response.json();
    return data.data || {};
  };

  const updateVideosPage = async (selectedVideoIds: string[]) => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const videosPage = await fetchVideosPage();

      const {
        id,
        documentId,
        createdAt,
        updatedAt,
        publishedAt,
        createdBy,
        updatedBy,
        youtubeVideos,
        ...cleanData
      } = videosPage;

      const payloadData: any = {
        ...cleanData,
        selectedYouTubeVideoIds: selectedVideoIds,
      };

      Object.keys(payloadData).forEach((key) => {
        if (payloadData[key] === undefined) {
          delete payloadData[key];
        }
      });

      const payload = {
        data: payloadData,
      };

      console.log('[VideoSelector] Updating videos page with:', {
        selectedVideoIds: selectedVideoIds.length,
      });

      const response = await fetch(`${backendURL}/api/videos-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VideoSelector] Update failed:', response.status, errorText);
        throw new Error(errorText || 'Failed to update videos page');
      }

      const result = await response.json();
      console.log('[VideoSelector] Update successful:', result);
      return result;
    } catch (error) {
      console.error('[VideoSelector] Error in updateVideosPage:', error);
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const { data: videosPage, isLoading: loadingPage } = useQuery('videos-page', fetchVideosPage);
  const { data: videos = [], isLoading: loadingVideos, error: videosError, refetch } = useQuery(
    ['videos', channelId],
    () => fetchVideos(channelId),
    {
      enabled: false,
      retry: 1,
      onError: (error: any) => {
        console.error('[VideoSelector] Videos error:', error);
        showNotification('error', error?.message || 'Failed to load videos');
      },
    }
  );

  const updateMutation = useMutation(
    () => updateVideosPage(selectedVideos),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('videos-page');
        showNotification('success', 'Videos saved successfully!');
      },
      onError: (error: any) => {
        showNotification('error', error?.message || 'Failed to save videos');
      },
    }
  );

  useEffect(() => {
    if (videosPage) {
      setSelectedVideos(videosPage.selectedYouTubeVideoIds || []);
    }
  }, [videosPage]);

  const filteredVideos = videos.filter((video) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      video.title.toLowerCase().includes(search) ||
      video.description.toLowerCase().includes(search) ||
      video.channelTitle.toLowerCase().includes(search)
    );
  });

  const handleToggleVideo = (videoId: string) => {
    setSelectedVideos((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      }
      return [...prev, videoId];
    });
  };

  const handleSelectAll = () => {
    setSelectedVideos(filteredVideos.map((video) => video.id));
  };

  const handleDeselectAll = () => {
    setSelectedVideos([]);
  };

  const handleLoadVideos = () => {
    if (channelId.trim()) {
      refetch();
    } else {
      showNotification('warning', 'Please enter a YouTube channel ID');
    }
  };

  return (
      <Box>
        <Box paddingBottom={4}>
          <Typography variant="beta" as="h2">
            Video Selector
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            Select YouTube videos to display on the Videos page
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
            {/* Channel ID Input */}
            <Box>
              <Typography variant="sigma" textColor="neutral600" marginBottom={3}>
                YouTube Channel ID
              </Typography>
              <Flex gap={3} alignItems="flex-end">
                <Box flex="1">
                  <TextInput
                    placeholder="Enter YouTube channel ID (e.g., UCxxxxxx)"
                    value={channelId}
                    onChange={(e: any) => setChannelId(e.target.value)}
                    size="M"
                  />
                </Box>
                <Button
                  variant="default"
                  onClick={handleLoadVideos}
                  disabled={loadingVideos || !channelId.trim()}
                >
                  Load Videos
                </Button>
              </Flex>
            </Box>

            {/* Search and Actions */}
            {videos.length > 0 && (
              <Box>
                <Flex gap={3} alignItems="flex-end">
                  <Box flex="1">
                    <TextInput
                      placeholder="Search by title, description, or channel..."
                      value={searchTerm}
                      onChange={(e: any) => setSearchTerm(e.target.value)}
                      startAction={<Search />}
                      size="M"
                    />
                  </Box>
                  <Button
                    variant="secondary"
                    onClick={handleSelectAll}
                    disabled={filteredVideos.length === 0 || selectedVideos.length === filteredVideos.length}
                  >
                    Select All ({filteredVideos.length})
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDeselectAll}
                    disabled={selectedVideos.length === 0}
                  >
                    Clear Selection
                  </Button>
                </Flex>
              </Box>
            )}

            {videosError && (
              <Box padding={2} marginBottom={4}>
                <Alert closeLabel="Close" title="Error loading videos" variant="danger">
                  {(videosError as any)?.message || 'Failed to load videos. Check console for details.'}
                </Alert>
              </Box>
            )}
            {loadingVideos ? (
              <Box padding={8} textAlign="center">
                <Loader>Loading videos...</Loader>
              </Box>
            ) : filteredVideos.length === 0 && videos.length === 0 ? (
              <Alert closeLabel="Close" title="No videos loaded">
                Enter a YouTube channel ID and click "Load Videos" to get started.
              </Alert>
            ) : filteredVideos.length === 0 ? (
              <Alert closeLabel="Close" title="No videos found">
                No videos match your search.
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
                      {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''} available
                    </Typography>
                    {selectedVideos.length > 0 && (
                      <Typography variant="omega" textColor="primary600" fontWeight="semiBold">
                        {selectedVideos.length} selected
                      </Typography>
                    )}
                  </Flex>
                </Box>

                {/* Videos Grid */}
                <Grid.Root gap={4} colCount={4}>
                  {filteredVideos.map((video) => {
                    const isSelected = selectedVideos.includes(video.id);
                    return (
                      <Grid.Item key={video.id} col={1} xs={12} s={6} m={4} xl={3}>
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
                          onClick={() => handleToggleVideo(video.id)}
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
                            {/* Thumbnail */}
                            <Box
                              style={{
                                width: '100%',
                                aspectRatio: '16/9',
                                backgroundImage: video.thumbnailUrl
                                  ? `url(${video.thumbnailUrl})`
                                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                              }}
                            >
                              <Box
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '50%',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Play style={{ color: 'white', width: '24px', height: '24px', marginLeft: '4px' }} />
                              </Box>
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

                            {/* Video Info */}
                            <Box padding={3}>
                              <Flex direction="column" gap={1}>
                                <Typography
                                  fontWeight="bold"
                                  variant="omega"
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4',
                                    minHeight: '2.8em',
                                  }}
                                  title={video.title}
                                >
                                  {video.title}
                                </Typography>
                                <Typography
                                  variant="pi"
                                  textColor="neutral600"
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={video.channelTitle}
                                >
                                  {video.channelTitle}
                                </Typography>
                                {video.viewCount && (
                                  <Typography
                                    variant="pi"
                                    textColor="neutral500"
                                    style={{
                                      fontSize: '11px',
                                    }}
                                  >
                                    {video.viewCount.toLocaleString()} views
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
                      {selectedVideos.length > 0
                        ? `${selectedVideos.length} video${selectedVideos.length !== 1 ? 's' : ''} will be saved`
                        : 'No videos selected'}
                    </Typography>
                    <Button
                      variant="primary"
                      size="L"
                      startIcon={<Check />}
                      onClick={() => updateMutation.mutate()}
                      loading={updateMutation.isLoading}
                      disabled={selectedVideos.length === 0}
                    >
                      Save Selection{selectedVideos.length > 0 && ` (${selectedVideos.length})`}
                    </Button>
                  </Flex>
                </Box>
              </>
            )}
          </Flex>
        </Box>
      </Box>
  );
};

export default VideoSelector;
