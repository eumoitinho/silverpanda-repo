import type { Schema, Struct } from '@strapi/strapi';

export interface ContactLinkSchema extends Struct.ComponentSchema {
  collectionName: 'components_contact_link_contact_links';
  info: {
    description: '';
    displayName: 'Contact Link';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    link: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface HeroSchema extends Struct.ComponentSchema {
  collectionName: 'components_hero_heroes';
  info: {
    description: '';
    displayName: 'Hero';
  };
  attributes: {
    metaTitle: Schema.Attribute.String;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface IntegrationsInstagramPost extends Struct.ComponentSchema {
  collectionName: 'components_integrations_instagram_posts';
  info: {
    description: 'Sele\u00E7\u00E3o de post do Instagram com m\u00EDdia e metadados';
    displayName: 'Instagram Post';
  };
  attributes: {
    caption: Schema.Attribute.Text;
    comments: Schema.Attribute.Integer;
    likes: Schema.Attribute.Integer;
    media: Schema.Attribute.Media<'images' | 'videos'>;
    mediaType: Schema.Attribute.Enumeration<['image', 'video', 'carousel']> &
      Schema.Attribute.DefaultTo<'image'>;
    mediaUrl: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    permalink: Schema.Attribute.String;
    timestamp: Schema.Attribute.DateTime;
  };
}

export interface IntegrationsSoundcloudTrack extends Struct.ComponentSchema {
  collectionName: 'components_integrations_soundcloud_tracks';
  info: {
    description: 'Sele\u00E7\u00E3o de faixa do SoundCloud via ID ou permalink';
    displayName: 'SoundCloud Track';
  };
  attributes: {
    manualArtist: Schema.Attribute.String;
    manualArtwork: Schema.Attribute.Media<'images'>;
    manualArtworkUrl: Schema.Attribute.String;
    manualDuration: Schema.Attribute.Integer;
    manualExternalUrl: Schema.Attribute.String;
    manualLabel: Schema.Attribute.String;
    manualReleaseDate: Schema.Attribute.Date;
    manualTitle: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    permalinkUrl: Schema.Attribute.String;
    trackId: Schema.Attribute.String;
  };
}

export interface IntegrationsSpotifyTrack extends Struct.ComponentSchema {
  collectionName: 'components_integrations_spotify_tracks';
  info: {
    description: 'Seleciona uma faixa do Spotify pelo ID e define fallback manual';
    displayName: 'Spotify Track';
  };
  attributes: {
    manualAlbum: Schema.Attribute.String;
    manualArtist: Schema.Attribute.String;
    manualArtwork: Schema.Attribute.Media<'images'>;
    manualArtworkUrl: Schema.Attribute.String;
    manualDuration: Schema.Attribute.Integer;
    manualExternalUrl: Schema.Attribute.String;
    manualPreviewUrl: Schema.Attribute.String;
    manualReleaseDate: Schema.Attribute.Date;
    manualTitle: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    trackId: Schema.Attribute.String;
  };
}

export interface IntegrationsYoutubeVideo extends Struct.ComponentSchema {
  collectionName: 'components_integrations_youtube_videos';
  info: {
    description: 'Seleciona um v\u00EDdeo do YouTube pelo ID ou URL e define fallback manual';
    displayName: 'YouTube Video';
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['Music Videos', 'PGTV', 'Sets', 'Other']
    > &
      Schema.Attribute.DefaultTo<'Music Videos'>;
    manualChannelTitle: Schema.Attribute.String;
    manualDescription: Schema.Attribute.Text;
    manualDuration: Schema.Attribute.String;
    manualLikeCount: Schema.Attribute.BigInteger;
    manualPublishedAt: Schema.Attribute.DateTime;
    manualTags: Schema.Attribute.JSON;
    manualThumbnailUrl: Schema.Attribute.String;
    manualTitle: Schema.Attribute.String;
    manualViewCount: Schema.Attribute.BigInteger;
    notes: Schema.Attribute.Text;
    thumbnail: Schema.Attribute.Media<'images'>;
    videoId: Schema.Attribute.String;
    youtubeUrl: Schema.Attribute.String;
  };
}

export interface ParagraphSchema extends Struct.ComponentSchema {
  collectionName: 'components_paragraph_paragraphs';
  info: {
    description: '';
    displayName: 'Paragraph';
  };
  attributes: {
    text: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'contact-link.schema': ContactLinkSchema;
      'hero.schema': HeroSchema;
      'integrations.instagram-post': IntegrationsInstagramPost;
      'integrations.soundcloud-track': IntegrationsSoundcloudTrack;
      'integrations.spotify-track': IntegrationsSpotifyTrack;
      'integrations.youtube-video': IntegrationsYoutubeVideo;
      'paragraph.schema': ParagraphSchema;
    }
  }
}
