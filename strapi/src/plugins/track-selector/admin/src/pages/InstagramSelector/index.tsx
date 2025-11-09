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
import { Check, Search, Picture } from '@strapi/icons';

interface InstagramPost {
  id: string;
  permalink: string;
  caption: string | null;
  mediaType: string;
  mediaUrl: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentsCount: number | null;
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

const InstagramSelector: React.FC = () => {
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const fetchPosts = async (): Promise<InstagramPost[]> => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const url = `${backendURL}/api/collaborations-page/available-posts`;
      console.log('[InstagramSelector] Fetching posts from:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[InstagramSelector] Failed to fetch posts:', response.status, errorText);
        throw new Error(`Failed to fetch posts: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[InstagramSelector] Received posts data:', data);
      return data.data || [];
    } catch (error) {
      console.error('[InstagramSelector] Error in fetchPosts:', error);
      throw error;
    }
  };

  const fetchCollaborationsPage = async () => {
    const token = getAuthToken();
    const backendURL = getBackendURL();
    const response = await fetch(`${backendURL}/api/collaborations-page`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch collaborations page');
    const data = await response.json();
    return data.data || {};
  };

  const updateCollaborationsPage = async (selectedPostIds: string[]) => {
    try {
      const token = getAuthToken();
      const backendURL = getBackendURL();
      const collaborationsPage = await fetchCollaborationsPage();

      const {
        id,
        documentId,
        createdAt,
        updatedAt,
        publishedAt,
        createdBy,
        updatedBy,
        instagramPosts,
        ...cleanData
      } = collaborationsPage;

      const payloadData: any = {
        ...cleanData,
        selectedInstagramPostIds: selectedPostIds,
      };

      Object.keys(payloadData).forEach((key) => {
        if (payloadData[key] === undefined) {
          delete payloadData[key];
        }
      });

      const payload = {
        data: payloadData,
      };

      console.log('[InstagramSelector] Updating collaborations page with:', {
        selectedPostIds: selectedPostIds.length,
      });

      const response = await fetch(`${backendURL}/api/collaborations-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[InstagramSelector] Update failed:', response.status, errorText);
        throw new Error(errorText || 'Failed to update collaborations page');
      }

      const result = await response.json();
      console.log('[InstagramSelector] Update successful:', result);
      return result;
    } catch (error) {
      console.error('[InstagramSelector] Error in updateCollaborationsPage:', error);
      throw error;
    }
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const { data: collaborationsPage, isLoading: loadingPage } = useQuery('collaborations-page', fetchCollaborationsPage);
  const { data: posts = [], isLoading: loadingPosts, error: postsError } = useQuery(
    ['instagram-posts'],
    fetchPosts,
    {
      retry: 1,
      onError: (error: any) => {
        console.error('[InstagramSelector] Posts error:', error);
        showNotification('error', error?.message || 'Failed to load posts');
      },
    }
  );

  const updateMutation = useMutation(
    () => updateCollaborationsPage(selectedPosts),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('collaborations-page');
        showNotification('success', 'Posts saved successfully!');
      },
      onError: (error: any) => {
        showNotification('error', error?.message || 'Failed to save posts');
      },
    }
  );

  useEffect(() => {
    if (collaborationsPage) {
      setSelectedPosts(collaborationsPage.selectedInstagramPostIds || []);
    }
  }, [collaborationsPage]);

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (post.caption && post.caption.toLowerCase().includes(search)) ||
      post.permalink.toLowerCase().includes(search)
    );
  });

  const handleTogglePost = (permalink: string) => {
    setSelectedPosts((prev) => {
      if (prev.includes(permalink)) {
        return prev.filter((url) => url !== permalink);
      }
      return [...prev, permalink];
    });
  };

  const handleSelectAll = () => {
    setSelectedPosts(filteredPosts.map((post) => post.permalink));
  };

  const handleDeselectAll = () => {
    setSelectedPosts([]);
  };

  return (
      <Box>
        <Box paddingBottom={4}>
          <Typography variant="beta" as="h2">
            Instagram Selector
          </Typography>
          <Typography variant="omega" textColor="neutral600" as="p">
            Select Instagram posts to display on the Collaborations page
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
            {posts.length > 0 && (
              <Box>
                <Flex gap={3} alignItems="flex-end">
                  <Box flex="1">
                    <TextInput
                      placeholder="Search by caption or permalink..."
                      value={searchTerm}
                      onChange={(e: any) => setSearchTerm(e.target.value)}
                      startAction={<Search />}
                      size="M"
                    />
                  </Box>
                  <Button
                    variant="secondary"
                    onClick={handleSelectAll}
                    disabled={filteredPosts.length === 0 || selectedPosts.length === filteredPosts.length}
                  >
                    Select All ({filteredPosts.length})
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleDeselectAll}
                    disabled={selectedPosts.length === 0}
                  >
                    Clear Selection
                  </Button>
                </Flex>
              </Box>
            )}

            {postsError && (
              <Box padding={2} marginBottom={4}>
                <Alert closeLabel="Close" title="Error loading posts" variant="danger">
                  {(postsError as any)?.message || 'Failed to load posts. Make sure Instagram API is configured.'}
                </Alert>
              </Box>
            )}
            {loadingPosts ? (
              <Box padding={8} textAlign="center">
                <Loader>Loading Instagram posts...</Loader>
              </Box>
            ) : filteredPosts.length === 0 && posts.length === 0 ? (
              <Alert closeLabel="Close" title="No posts available">
                Make sure Instagram API credentials are configured in Strapi environment variables.
              </Alert>
            ) : filteredPosts.length === 0 ? (
              <Alert closeLabel="Close" title="No posts found">
                No posts match your search.
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
                      {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} available
                    </Typography>
                    {selectedPosts.length > 0 && (
                      <Typography variant="omega" textColor="primary600" fontWeight="semiBold">
                        {selectedPosts.length} selected
                      </Typography>
                    )}
                  </Flex>
                </Box>

                {/* Posts Grid */}
                <Grid.Root gap={4} colCount={4}>
                  {filteredPosts.map((post) => {
                    const isSelected = selectedPosts.includes(post.permalink);
                    return (
                      <Grid.Item key={post.id} col={1} xs={12} s={6} m={4} xl={3}>
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
                          onClick={() => handleTogglePost(post.permalink)}
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
                            {/* Media */}
                            <Box
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                backgroundImage: post.mediaUrl
                                  ? `url(${post.mediaUrl})`
                                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                              }}
                            >
                              {post.mediaType === 'VIDEO' && (
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    fontSize: '11px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  VIDEO
                                </Box>
                              )}
                              {post.mediaType === 'CAROUSEL_ALBUM' && (
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                    fontSize: '11px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  CAROUSEL
                                </Box>
                              )}
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

                            {/* Post Info */}
                            <Box padding={3}>
                              <Flex direction="column" gap={1}>
                                {post.caption && (
                                  <Typography
                                    variant="omega"
                                    style={{
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: '1.4',
                                      minHeight: '4.2em',
                                    }}
                                    title={post.caption}
                                  >
                                    {post.caption}
                                  </Typography>
                                )}
                                {post.likeCount !== null && post.commentsCount !== null && (
                                  <Flex gap={3} marginTop={1}>
                                    <Typography
                                      variant="pi"
                                      textColor="neutral600"
                                      style={{
                                        fontSize: '11px',
                                      }}
                                    >
                                      ❤️ {post.likeCount.toLocaleString()}
                                    </Typography>
                                    <Typography
                                      variant="pi"
                                      textColor="neutral600"
                                      style={{
                                        fontSize: '11px',
                                      }}
                                    >
                                      💬 {post.commentsCount.toLocaleString()}
                                    </Typography>
                                  </Flex>
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
                      {selectedPosts.length > 0
                        ? `${selectedPosts.length} post${selectedPosts.length !== 1 ? 's' : ''} will be saved`
                        : 'No posts selected'}
                    </Typography>
                    <Button
                      variant="primary"
                      size="L"
                      startIcon={<Check />}
                      onClick={() => updateMutation.mutate()}
                      loading={updateMutation.isLoading}
                      disabled={selectedPosts.length === 0}
                    >
                      Save Selection{selectedPosts.length > 0 && ` (${selectedPosts.length})`}
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

export default InstagramSelector;
