import React, { useState, useEffect } from 'react';
import { MultiSelect, MultiSelectOption } from '@strapi/design-system';
import { useQuery } from 'react-query';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string | null;
}

interface SelectTracksFieldProps {
  name: string;
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  provider: 'spotify' | 'soundcloud';
}

const fetchTracks = async (provider: string): Promise<Track[]> => {
  const token = localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
  const response = await fetch(
    `${window.strapi.backendURL}/api/music-page/available-tracks?provider=${provider}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch tracks');
  }

  const data = await response.json();
  return data.data || [];
};

export const SelectTracksField: React.FC<SelectTracksFieldProps> = ({
  name,
  value,
  onChange,
  provider,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(value || []);

  const { data: tracks = [], isLoading, error } = useQuery(
    [`tracks-${provider}`, provider],
    () => fetchTracks(provider),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const options: MultiSelectOption[] = tracks.map((track) => ({
    value: track.id,
    label: `${track.title} - ${track.artist}${track.album ? ` (${track.album})` : ''}`,
  }));

  const handleChange = (newValue: string[]) => {
    setSelectedIds(newValue);
    onChange(newValue);
  };

  if (isLoading) {
    return <div>Loading tracks...</div>;
  }

  if (error) {
    return <div>Error loading tracks. Please check your API credentials.</div>;
  }

  return (
    <MultiSelect
      name={name}
      label={`Select ${provider === 'spotify' ? 'Spotify' : 'SoundCloud'} Tracks`}
      placeholder={`Choose tracks to display...`}
      value={selectedIds}
      onChange={handleChange}
      options={options}
      withTags
    />
  );
};

