import './styles/main.css';
import './preview.js';

import { SpotifyAPI, SoundCloudAPI } from './api.js';
import { StrapiCMS } from './cms.js';

class App {
  constructor() {
    this.currentPage = 'home';
    this.musicProviders = { spotify: [], soundcloud: [] };
    this.musicTracks = [];
    this.videoData = [];
    this.currentVideoCategory = null;
    this.spotifySelections = [];
    this.soundcloudSelections = [];
    this.instagramPostsData = [];
    this.cmsContentPromise = null;
    this.musicDataInitialised = false;
    this.init();
  }

  init() {
    this.cmsContentPromise = this.loadCMSContent();
    this.setupNavigation();
    this.setupVideoModal();
    this.setupImageHandling();
    this.setupVideoTabs();
    this.handleInitialRoute();
    this.loadMusicData();
  }

  async loadCMSContent() {
    try {
      const [
        hero,
        musicPage,
        collaborationsPage,
        tours,
        videos,
        press,
        info,
      ] = await Promise.all([
        StrapiCMS.getHomepageHero(),
        StrapiCMS.getMusicPage(),
        StrapiCMS.getCollaborationsPage(),
        StrapiCMS.getTours(),
        StrapiCMS.getVideos(),
        StrapiCMS.getPress(),
        StrapiCMS.getInfo(),
      ]);

      this.spotifySelections = musicPage.spotifyTracks;
      this.soundcloudSelections = musicPage.soundcloudTracks;
      this.instagramPostsData = collaborationsPage.instagramPosts;

      this.renderHero(hero);
      this.renderTours(tours);
      this.renderVideos(videos);
      this.renderPress(press);
      this.renderInfo(info);
      this.renderInstagram(collaborationsPage.instagramPosts);
    } catch (error) {
      console.error('Error loading Strapi content:', error);
      this.spotifySelections = StrapiCMS.getDefaultSpotifyTracks();
      this.soundcloudSelections = StrapiCMS.getDefaultSoundcloudTracks();
      this.instagramPostsData = StrapiCMS.getDefaultInstagramPosts();

      this.renderHero(StrapiCMS.getDefaultHero());
      this.renderTours(StrapiCMS.getDefaultTours());
      this.renderVideos(StrapiCMS.getDefaultVideos());
      this.renderPress(StrapiCMS.getDefaultPress());
      this.renderInfo(StrapiCMS.getDefaultInfo());
      this.renderInstagram(this.instagramPostsData);
    }
  }

  renderHero(hero = {}) {
    const heroTitleEl = document.getElementById('heroTitle');
    const heroSubtitleEl = document.getElementById('heroSubtitle');
    const heroLogoEl = document.getElementById('heroLogo');
    const heroBackgroundEl = document.getElementById('heroBackground');
    const heroTitleContainer = document.querySelector('.home__hero__title');
    const heroCircleEl = document.querySelector('.home__hero__circle');

    const defaultHero = StrapiCMS.getDefaultHero();
    const isFallbackHero = hero.isFallback === true;
    const logoUrl = hero.heroLogo || hero.logo || '';
    const hasLogo = Boolean(logoUrl);
    const hasTitle = typeof hero.title === 'string' && hero.title.trim().length > 0;
    const hasSubtitle = typeof hero.subtitle === 'string' && hero.subtitle.trim().length > 0;

    if (heroLogoEl) {
      if (logoUrl) {
        heroLogoEl.src = logoUrl;
        heroLogoEl.alt = hero.title ? `${hero.title} logo` : 'Logo';
        heroLogoEl.style.display = 'block';
        heroLogoEl.removeAttribute('aria-hidden');
        if (heroTitleContainer) {
          heroTitleContainer.classList.add('has-logo');
        }
      } else {
        heroLogoEl.style.display = 'none';
        heroLogoEl.removeAttribute('src');
        heroLogoEl.setAttribute('aria-hidden', 'true');
        if (heroTitleContainer) {
          heroTitleContainer.classList.remove('has-logo');
        }
      }
    }

    if (heroTitleEl) {
      if (hasTitle) {
        heroTitleEl.textContent = hero.title;
        heroTitleEl.style.display = 'block';
        heroTitleEl.removeAttribute('aria-hidden');
      } else if (isFallbackHero && defaultHero.title) {
        heroTitleEl.textContent = defaultHero.title;
        heroTitleEl.style.display = 'block';
        heroTitleEl.removeAttribute('aria-hidden');
      } else {
        heroTitleEl.textContent = '';
        heroTitleEl.style.display = 'none';
        heroTitleEl.setAttribute('aria-hidden', 'true');
      }
    }

    const backgroundUrl = hero.heroBackground || hero.background || '';
    if (heroBackgroundEl) {
      if (backgroundUrl) {
        heroBackgroundEl.style.backgroundImage = `url('${backgroundUrl}')`;
        heroBackgroundEl.classList.add('loaded');
      } else {
        heroBackgroundEl.style.backgroundImage = '';
        heroBackgroundEl.classList.remove('loaded');
      }
    }

    const metaTitle = hero.metaTitle || (hasTitle ? hero.title : null) || defaultHero.metaTitle || defaultHero.title;
    if (metaTitle) {
      document.title = metaTitle;
    }

    if (heroSubtitleEl) {
      if (hasSubtitle) {
        heroSubtitleEl.textContent = hero.subtitle;
        heroSubtitleEl.style.display = 'block';
      } else {
        heroSubtitleEl.textContent = '';
        heroSubtitleEl.style.display = 'none';
      }
    }

    if (heroCircleEl) {
      heroCircleEl.style.display = backgroundUrl ? 'none' : 'block';
    }
  }

  renderTours(tourData = {}) {
    const table = document.getElementById('tourTable');
    const sourceEl = document.getElementById('tourSource');

    if (!table) return;

    if (sourceEl) {
      sourceEl.textContent = tourData.source || 'Resident Advisor';
    }

    const items = tourData.items || [];

    if (!items.length) {
      table.innerHTML = '<div class="section__error">Tour dates coming soon.</div>';
      return;
    }

    table.innerHTML = items
      .map((tour) => {
        const { year, month, day } = this.formatTourDate(tour.date);
        const location = [tour.city, tour.country].filter(Boolean).join(', ');
        const linkMarkup = tour.link
          ? `<a href="${tour.link}" target="_blank" rel="noopener noreferrer">${tour.venue || 'More info'} →</a>`
          : tour.venue || 'TBA';

        return `
          <div class="tour__table__row">
            <div class="tour__table__cell">${year || '—'}</div>
            <div class="tour__table__cell">${month && day ? `${month} ${day}` : 'TBA'}</div>
            <div class="tour__table__cell">${location || 'TBA'}</div>
            <div class="tour__table__cell">${linkMarkup}</div>
          </div>
        `;
      })
      .join('');
  }

  renderVideos(videos = []) {
    const grid = document.getElementById('videosGrid');
    if (!grid) return;

    if (!videos.length) {
      grid.innerHTML = '<div class="section__error">Videos coming soon.</div>';
      this.videoData = [];
      return;
    }

    this.videoData = videos
      .map((video) => {
        const youtubeId = this.extractYouTubeId(video.youtubeId || video.youtubeUrl);
        return {
          ...video,
          youtubeId,
          title: video.title || 'Untitled Video',
          thumbnail: video.thumbnail || this.createPlaceholderImage(1920, 1080, 'Video'),
          credits: Array.isArray(video.credits)
            ? video.credits
            : video.credits
              ? [video.credits]
              : [],
          year: video.year || (video.releaseDate ? new Date(video.releaseDate).getFullYear().toString() : ''),
          category: video.category || 'Music Videos',
        };
      })
      .filter((video) => video.youtubeId);

    if (!this.videoData.length) {
      grid.innerHTML = '<div class="section__error">No embeddable videos available yet.</div>';
      return;
    }

    grid.innerHTML = this.videoData
      .map(
        (video, index) => `
        <div class="videos__item" data-index="${index}" data-category="${video.category}">
          <div class="videos__item__media">
            <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" loading="lazy">
          </div>
          <div class="videos__item__info">
            <div class="videos__item__title">${video.title}</div>
            ${video.year ? `<div class="videos__item__year">${video.year}</div>` : ''}
            ${this.formatVideoCredits(video.credits)}
          </div>
        </div>
      `,
      )
      .join('');

    this.registerImageErrorHandlers(grid.querySelectorAll('img'));

    if (!this.currentVideoCategory) {
      const activeTab = document.querySelector('.videos__tab.active');
      this.currentVideoCategory = activeTab ? activeTab.textContent.trim() : 'Music Videos';
    }

    this.filterVideosByCategory(this.currentVideoCategory);
  }

  renderPress(pressFeatures = []) {
    const grid = document.getElementById('pressGrid');
    if (!grid) return;

    if (!pressFeatures.length) {
      grid.innerHTML = '<div class="section__error">Press highlights coming soon.</div>';
      return;
    }

    grid.innerHTML = pressFeatures
      .map((feature) => {
        const publication = feature.publication || feature.title || 'Press';
        const dateLabel = feature.date ? this.formatPressDate(feature.date) : feature.displayDate || '';
        const linkMarkup = feature.link
          ? `<a href="${feature.link}" class="press__covers__item__link" target="_blank" rel="noopener noreferrer">View →</a>`
          : '';

        return `
          <div class="press__covers__item">
            <div class="press__covers__item__media">
              <img class="press__covers__item__media__image" src="${feature.image || this.createPlaceholderImage(800, 1067, publication)}" alt="${this.escapeHtml(publication)}">
            </div>
            <div class="press__covers__item__info">
              <div class="press__covers__item__magazine">${publication}</div>
              ${dateLabel ? `<div class="press__covers__item__date">${dateLabel}</div>` : ''}
              ${linkMarkup}
            </div>
          </div>
        `;
      })
      .join('');

    this.registerImageErrorHandlers(grid.querySelectorAll('img'));
  }

  renderInstagram(posts = []) {
    const grid = document.getElementById('instagramGrid');
    if (!grid) return;

    if (!posts.length) {
      grid.innerHTML = '<div class="section__error">Social content coming soon.</div>';
      return;
    }

    grid.innerHTML = posts
      .map((post) => {
        const dateLabel = this.formatInstagramDate(post.timestamp);
        const likesLabel = typeof post.likes === 'number' ? this.formatCount(post.likes) : '';
        const commentsLabel = typeof post.comments === 'number' ? this.formatCount(post.comments) : '';
        const stats = [
          likesLabel ? `<span class="instagram__item__stat">❤️ ${likesLabel}</span>` : '',
          commentsLabel ? `<span class="instagram__item__stat">💬 ${commentsLabel}</span>` : '',
        ].filter(Boolean);
        const statsHtml = stats.length ? `<div class="instagram__item__stats">${stats.join('')}</div>` : '';

        const caption =
          post.caption && post.caption.length > 0
            ? `<p class="instagram__item__caption">${this.escapeHtml(post.caption)}</p>`
            : '';

        const mediaAlt = post.altText || post.caption || 'Instagram post';
        const permalink = post.permalink || '#';
        const mediaSrc = post.mediaUrl || this.createPlaceholderImage(800, 800, 'Instagram');

        return `
        <article class="instagram__item">
          <a href="${permalink}" target="_blank" rel="noopener noreferrer" class="instagram__item__media">
            <img src="${mediaSrc}" alt="${this.escapeHtml(mediaAlt)}" loading="lazy">
          </a>
          <div class="instagram__item__body">
            ${dateLabel ? `<time class="instagram__item__time">${dateLabel}</time>` : ''}
            ${caption}
            ${statsHtml}
          </div>
        </article>
      `;
      })
      .join('');

    this.registerImageErrorHandlers(grid.querySelectorAll('img'));
  }

  renderInfo(info = {}) {
    const imageEl = document.getElementById('infoImage');
    const textEl = document.getElementById('infoText');
    const footerEl = document.querySelector('.info__footer__credit');

    if (imageEl) {
      imageEl.src = info.image || this.createPlaceholderImage(800, 1067, 'Silver Panda');
    }

    if (textEl) {
      const paragraphs = Array.isArray(info.paragraphs)
        ? info.paragraphs
        : info.description
          ? [info.description]
          : [];

      if (paragraphs.length) {
        textEl.innerHTML = paragraphs
          .filter((paragraph) => typeof paragraph === 'string' && paragraph.trim().length > 0)
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join('');
      }
    }

    if (footerEl) {
      footerEl.classList.remove('info__footer__credit--horizontal');

      if (info.contact && info.contact.length) {
        footerEl.innerHTML = info.contact
          .map((entry) => {
            if (entry.link) {
              return `<a href="${entry.link}" target="_blank" rel="noopener noreferrer">${entry.label || entry.value || entry.link}</a>`;
            }
            if (entry.value && entry.label) {
              return `<span>${entry.label}: ${entry.value}</span>`;
            }
            return `<span>${entry.label || entry.value || ''}</span>`;
          })
          .join(' • ');
        footerEl.classList.add('info__footer__credit--horizontal');
      } else if (info.credit) {
        footerEl.textContent = info.credit;
      }
    }

    this.registerImageErrorHandlers([imageEl]);
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.navigation__list__link');
    const navToggle = document.querySelector('.navigation__toggle');

    navLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const page = link.getAttribute('data-page') || link.textContent.trim().toLowerCase();
        this.navigateToPage(page);
      });
    });

    window.addEventListener('popstate', () => {
      const page = window.location.hash.slice(1) || 'home';
      this.showPage(page);
    });

    if (navToggle) {
      navToggle.setAttribute('role', 'button');
      navToggle.setAttribute('aria-label', 'Go to home');
      navToggle.addEventListener('click', () => {
        document.querySelector('.navigation__list').classList.remove('active');
        this.navigateToPage('home');
      });
    }
  }

  navigateToPage(page) {
    const pageMap = {
      music: 'music',
      tour: 'tour',
      videos: 'videos',
      press: 'press',
      collaborations: 'collaborations',
      info: 'info',
      home: 'home',
    };

    const targetPage = pageMap[page.toLowerCase()] || page;
    this.currentPage = targetPage;

    if (targetPage === 'home') {
      window.history.pushState({ page: targetPage }, '', window.location.pathname);
    } else {
      window.history.pushState({ page: targetPage }, '', `#${targetPage}`);
    }

    this.showPage(targetPage);
  }

  showPage(page) {
    const allPages = document.querySelectorAll('.content[data-template]');
    allPages.forEach((p) => {
      p.style.display = 'none';
    });

    const targetPage = document.getElementById(page);
    if (targetPage) {
      targetPage.style.display = 'flex';
      this.currentPage = page;
      window.scrollTo(0, 0);
      this.updateActiveNav(page);

      if (page === 'home') {
        document.body.classList.add('home-active');
      } else {
        document.body.classList.remove('home-active');
      }

      if (page === 'music' && !this.musicDataInitialised) {
        this.musicDataInitialised = true;
        this.loadMusicProviders();
      }
    }
  }

  updateActiveNav(page) {
    const navLinks = document.querySelectorAll('.navigation__list__link');
    navLinks.forEach((link) => {
      link.classList.remove('active');
      const linkPage = link.getAttribute('data-page') || link.textContent.trim().toLowerCase();
      if (linkPage === page) {
        link.classList.add('active');
      }
    });
  }

  handleInitialRoute() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.showPage(hash);
    } else {
      this.showPage('home');
    }
  }

  setupVideoModal() {
    this.videoModal = document.getElementById('videoModal');
    if (!this.videoModal) return;

    this.videoModalBack = this.videoModal.querySelector('.video__modal__back');
    this.videoPlayer = document.getElementById('videoPlayer');
    this.modalTitle = document.getElementById('modalTitle');
    this.modalYear = document.getElementById('modalYear');
    this.modalCredits = document.getElementById('modalCredits');

    const videosGrid = document.getElementById('videosGrid');
    if (videosGrid) {
      videosGrid.addEventListener('click', (event) => {
        const item = event.target.closest('.videos__item');
        if (!item) return;
        const index = Number(item.getAttribute('data-index'));
        const video = this.videoData[index];
        if (video) {
          this.openVideoModal(video);
        }
      });
    }

    if (this.videoModalBack) {
      this.videoModalBack.addEventListener('click', () => this.closeVideoModal());
    }

    this.videoModal.addEventListener('click', (event) => {
      if (event.target === this.videoModal) {
        this.closeVideoModal();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.videoModal.style.display === 'block') {
        this.closeVideoModal();
      }
    });
  }

  openVideoModal(video) {
    if (!this.videoModal || !video.youtubeId) return;

    if (this.modalTitle) {
      this.modalTitle.textContent = video.title || '';
    }

    if (this.modalYear) {
      this.modalYear.textContent = video.year || '';
      this.modalYear.style.display = video.year ? 'block' : 'none';
    }

    if (this.modalCredits) {
      this.modalCredits.innerHTML = this.formatVideoCredits(video.credits, true);
    }

    if (this.videoPlayer) {
      this.videoPlayer.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${video.youtubeId}?autoplay=1"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      `;
    }

    this.videoModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  closeVideoModal() {
    if (!this.videoModal) return;
    this.videoModal.style.display = 'none';
    document.body.style.overflow = '';

    if (this.videoPlayer) {
      this.videoPlayer.innerHTML = '';
    }
  }

  setupVideoTabs() {
    const videoTabs = document.querySelectorAll('.videos__tab');
    if (!videoTabs.length) return;

    videoTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        videoTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const category = tab.textContent.trim();
        this.filterVideosByCategory(category);
      });
    });

    const activeTab = document.querySelector('.videos__tab.active');
    if (activeTab) {
      this.currentVideoCategory = activeTab.textContent.trim();
    }
  }

  filterVideosByCategory(category) {
    this.currentVideoCategory = category;
    const grid = document.getElementById('videosGrid');
    if (!grid) return;

    const items = grid.querySelectorAll('.videos__item');
    let visibleCount = 0;

    items.forEach((item) => {
      const itemCategory = item.getAttribute('data-category') || 'Music Videos';
      const matches = !category || category === 'All' || itemCategory === category;
      item.style.display = matches ? 'block' : 'none';
      if (matches) {
        visibleCount += 1;
      }
    });

    const emptyState = grid.querySelector('.section__empty');
    if (!visibleCount) {
      if (!emptyState) {
        const message = document.createElement('div');
        message.className = 'section__error section__empty';
        message.textContent = 'No videos available for this category.';
        grid.appendChild(message);
      }
    } else if (emptyState) {
      emptyState.remove();
    }
  }

  setupImageHandling() {
    const images = document.querySelectorAll('img');
    this.registerImageErrorHandlers(images);
  }

  registerImageErrorHandlers(images) {
    if (!images) return;
    images.forEach((img) => this.attachImageErrorHandler(img));
  }

  attachImageErrorHandler(img) {
    if (!img || img.dataset.errorHandlerAttached === 'true') return;

    if (img.id === 'heroLogo') {
      img.dataset.errorHandlerAttached = 'true';
      img.addEventListener(
        'error',
        () => {
          img.style.display = 'none';
          img.removeAttribute('src');
        },
        { once: true },
      );
      return;
    }

    img.dataset.errorHandlerAttached = 'true';

    const { width, height } = this.getFallbackDimensions(img);

    img.addEventListener(
      'error',
      () => {
        if (!img.src.includes('data:image/svg+xml')) {
          const placeholder = this.createPlaceholderImage(width, height, img.alt || 'Image');
          img.src = placeholder;
          img.style.background = '#1a1a1a';
        }
      },
      { once: true },
    );
  }

  getFallbackDimensions(img) {
    if (!img) {
      return { width: 1000, height: 1000 };
    }

    if (img.closest('.videos__item__media')) {
      return { width: 1920, height: 1080 };
    }

    if (img.closest('.press__covers__item__media') || img.closest('.info__image')) {
      return { width: 800, height: 1067 };
    }

    return { width: 1000, height: 1000 };
  }

  async loadMusicData() {
    try {
      const musicPage = document.getElementById('music');
      if (!musicPage || this.musicDataInitialised) return;

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.musicDataInitialised) {
              this.musicDataInitialised = true;
              this.loadMusicProviders();
              obs.disconnect();
            }
          });
        },
        { threshold: 0.1 },
      );

      observer.observe(musicPage);
    } catch (error) {
      console.error('Error setting up music data loader:', error);
    }
  }

  async loadMusicProviders() {
    const musicGrid = document.getElementById('musicGrid');
    if (!musicGrid) return;

    try {
      musicGrid.innerHTML = '<div class="music__loading">Loading music...</div>';

      if (this.cmsContentPromise) {
        await this.cmsContentPromise.catch(() => {});
      }

      const [spotifyTracks, soundcloudTracks] = await Promise.all([
        this.fetchSpotifySelection(),
        this.fetchSoundcloudSelection(),
      ]);

      this.musicProviders.spotify = spotifyTracks;
      this.musicProviders.soundcloud = soundcloudTracks;
      this.musicTracks = [...spotifyTracks, ...soundcloudTracks];

      this.renderMusicGrid(this.musicTracks);
    } catch (error) {
      console.error('Error loading music providers:', error);
      const combined = [...this.musicProviders.spotify, ...this.musicProviders.soundcloud];
      if (combined.length) {
        this.renderMusicGrid(combined);
        return;
      }
      musicGrid.innerHTML = '<div class="music__error">Failed to load music. Please try again later.</div>';
    }
  }

  async fetchSpotifySelection() {
    if (this.cmsContentPromise) {
      await this.cmsContentPromise.catch(() => {});
    }

    const selections = Array.isArray(this.spotifySelections) ? this.spotifySelections : [];

    if (!selections.length) {
      try {
        const tracks = await SpotifyAPI.getTopTracks('US');
        return tracks.map((track, index) => ({
          ...track,
          provider: 'spotify',
          order: index,
        }));
      } catch (error) {
        console.error('Error fetching default Spotify tracks:', error);
        return [];
      }
    }

    const trackIds = selections
      .map((selection) => (selection.trackId ? selection.trackId.trim() : ''))
      .filter(Boolean);

    let apiTracks = [];
    if (trackIds.length) {
      try {
        apiTracks = await SpotifyAPI.getTracksByIds(trackIds);
      } catch (error) {
        console.error('Error fetching Spotify tracks by IDs:', error);
      }
    }

    const apiTrackMap = new Map(apiTracks.map((track) => [track.id, track]));

    const formatted = selections
      .map((selection, index) => {
        const apiTrack = selection.trackId ? apiTrackMap.get(selection.trackId) : null;
        const manual = selection.manual || {};

        if (apiTrack) {
          return {
            ...apiTrack,
            provider: 'spotify',
            order: index,
          };
        }

        const title = manual.title || '';
        const artist = manual.artist || '';
        const hasFallbackContent = title || artist || manual.externalUrl;

        if (!hasFallbackContent) {
          return null;
        }

        const artwork =
          manual.artwork ||
          this.createPlaceholderImage(640, 640, title || artist || 'Spotify');

        return {
          id: selection.trackId || `spotify-manual-${index}`,
          title: title || 'Untitled',
          artist: artist || 'Unknown Artist',
          artwork,
          duration: manual.duration || null,
          externalUrl: manual.externalUrl || (selection.trackId ? `https://open.spotify.com/track/${selection.trackId}` : ''),
          album: manual.album || '',
          releaseDate: manual.releaseDate || '',
          popularity: null,
          previewUrl: manual.previewUrl || null,
          provider: 'spotify',
          order: index,
        };
      })
      .filter(Boolean)
      .map((track) => ({ ...track, artwork: track.artwork || this.createPlaceholderImage(640, 640, track.title || 'Spotify') }));

    formatted.sort((a, b) => a.order - b.order);

    formatted.forEach((track) => {
      delete track.order;
    });

    return formatted;
  }

  async fetchSoundcloudSelection() {
    if (this.cmsContentPromise) {
      await this.cmsContentPromise.catch(() => {});
    }

    const selections = Array.isArray(this.soundcloudSelections) ? this.soundcloudSelections : [];

    if (!selections.length) {
      return [];
    }

    const ids = [];
    const urls = [];

    selections.forEach((selection) => {
      if (selection.trackId) {
        ids.push(selection.trackId);
      } else if (selection.permalinkUrl) {
        urls.push(selection.permalinkUrl);
      }
    });

    let apiTracks = [];
    if (ids.length || urls.length) {
      try {
        apiTracks = await SoundCloudAPI.getTracksByIdentifiers({ ids, urls });
      } catch (error) {
        console.error('Error fetching SoundCloud tracks:', error);
      }
    }

    const trackById = new Map();
    const trackByUrl = new Map();

    apiTracks.forEach((track) => {
      if (!track) return;
      if (track.id) trackById.set(String(track.id), track);
      if (track.permalink_url) trackByUrl.set(track.permalink_url, track);
    });

    const formatted = selections
      .map((selection, index) => {
        const apiTrack =
          (selection.trackId && trackById.get(selection.trackId)) ||
          (selection.permalinkUrl && trackByUrl.get(selection.permalinkUrl));

        const manual = selection.manual || {};
        const manualArtwork =
          manual.artwork || this.createPlaceholderImage(640, 640, manual.title || 'SoundCloud');

        if (apiTrack) {
          const artwork = apiTrack.artwork_url
            ? apiTrack.artwork_url.replace('-large', '-t500x500')
            : manualArtwork;

          return {
            id: String(apiTrack.id),
            title: apiTrack.title || manual.title || 'Untitled',
            artist: (apiTrack.user && apiTrack.user.username) || manual.artist || 'Unknown Artist',
            artwork,
            duration: apiTrack.duration || manual.duration || null,
            externalUrl: apiTrack.permalink_url || manual.externalUrl || selection.permalinkUrl || '',
            album: manual.label || apiTrack.publisher_metadata?.release_title || '',
            releaseDate: manual.releaseDate || apiTrack.release?.created_at || apiTrack.created_at || '',
            popularity: apiTrack.playback_count || null,
            previewUrl: null,
            provider: 'soundcloud',
            order: index,
          };
        }

        const hasFallbackContent = manual.title || manual.artist || manual.externalUrl;
        if (!hasFallbackContent) {
          return null;
        }

        return {
          id: selection.trackId || `soundcloud-manual-${index}`,
          title: manual.title || 'Untitled',
          artist: manual.artist || 'Unknown Artist',
          artwork: manualArtwork,
          duration: manual.duration || null,
          externalUrl: manual.externalUrl || selection.permalinkUrl || '',
          album: manual.label || '',
          releaseDate: manual.releaseDate || '',
          popularity: null,
          previewUrl: null,
          provider: 'soundcloud',
          order: index,
        };
      })
      .filter(Boolean);

    formatted.sort((a, b) => a.order - b.order);
    formatted.forEach((track) => {
      delete track.order;
    });

    return formatted;
  }

  renderMusicGrid(tracks = []) {
    const musicGrid = document.getElementById('musicGrid');
    if (!musicGrid) return;

    if (!tracks.length) {
      musicGrid.innerHTML = '<div class="music__error">No tracks available</div>';
      return;
    }

    musicGrid.innerHTML = tracks
      .map(
        (track) => {
          const provider = (track.provider || 'spotify').toLowerCase();
          const providerLabel = provider === 'soundcloud' ? 'SoundCloud' : 'Spotify';
          const releaseYear = this.extractYear(track.releaseDate);
          const durationLabel = this.formatDurationMs(track.duration);

          const metaParts = [];
          if (track.album) {
            metaParts.push(`<span class="music__section__item__album">${this.escapeHtml(track.album)}</span>`);
          }
          if (releaseYear) {
            metaParts.push(`<span class="music__section__item__date">${releaseYear}</span>`);
          }
          if (durationLabel) {
            metaParts.push(`<span class="music__section__item__duration">${durationLabel}</span>`);
          }

          const metaHtml = metaParts.length
            ? `<div class="music__section__item__meta">${metaParts.join('')}</div>`
            : '';

          const listenCta = track.externalUrl
            ? `<a href="${track.externalUrl}" target="_blank" rel="noopener noreferrer" class="music__section__item__link">
            Listen on ${providerLabel} →
          </a>`
            : '';

          const previewButton = track.previewUrl
            ? `
              <div class="music__section__item__play" data-preview="${track.previewUrl}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            `
            : '';

          const badge = `<span class="music__section__item__badge music__section__item__badge--${provider}">${providerLabel}</span>`;

          return `
        <div class="music__section__item" data-track-id="${track.id}" data-provider="${provider}">
          <div class="music__section__item__media">
            ${badge}
            <img class="music__section__item__media__image"
                 src="${track.artwork || this.createPlaceholderImage(640, 640, track.title)}"
                 alt="${this.escapeHtml(`${track.artist} — ${track.title}`)}"
                 loading="lazy">
            ${previewButton}
          </div>
          <div class="music__section__item__title">${this.escapeHtml(track.artist || 'Unknown Artist')} — ${this.escapeHtml(track.title || 'Untitled')}</div>
          ${metaHtml}
          ${listenCta}
        </div>
      `;
        },
      )
      .join('');

    const playButtons = musicGrid.querySelectorAll('.music__section__item__play');
    playButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const previewUrl = button.getAttribute('data-preview');
        if (previewUrl) {
          this.playPreview(previewUrl, button);
        }
      });
    });

    const trackItems = musicGrid.querySelectorAll('.music__section__item');
    trackItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        if (event.target.closest('.music__section__item__play') || event.target.closest('a')) {
          return;
        }
        const trackId = item.getAttribute('data-track-id');
        const track = tracks.find((entry) => entry.id === trackId);
        if (track && track.externalUrl) {
          window.open(track.externalUrl, '_blank', 'noopener,noreferrer');
        }
      });
    });

    this.registerImageErrorHandlers(musicGrid.querySelectorAll('img'));
  }

  playPreview(previewUrl, playButton) {
    const currentAudio = document.querySelector('audio[data-preview="true"]');
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.remove();
      document.querySelectorAll('.music__section__item__play').forEach((btn) => btn.classList.remove('playing'));
    }

    if (playButton.classList.contains('playing')) {
      return;
    }

    const audio = new Audio(previewUrl);
    audio.dataset.preview = 'true';
    audio.volume = 0.5;
    playButton.classList.add('playing');

    audio.play().catch((error) => {
      console.error('Error playing preview:', error);
      playButton.classList.remove('playing');
      audio.remove();
    });

    audio.addEventListener('ended', () => {
      playButton.classList.remove('playing');
      audio.remove();
    });

    audio.addEventListener('pause', () => {
      playButton.classList.remove('playing');
    });

    document.body.appendChild(audio);
  }

  formatVideoCredits(credits = [], inline = false) {
    if (!credits.length) {
      return inline ? '' : '';
    }

    const content = credits.filter(Boolean).map((credit) => `<div>${credit}</div>`).join('');

    return inline ? content : `<div class="videos__item__credits">${content}</div>`;
  }

  formatTourDate(dateString) {
    if (!dateString) {
      return { year: '', month: '', day: '' };
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return { year: '', month: '', day: '' };
    }

    return {
      year: date.getFullYear().toString(),
      month: date.toLocaleString('en-US', { month: 'short' }),
      day: date.toLocaleString('en-US', { day: '2-digit' }),
    };
  }

  formatPressDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  formatInstagramDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  extractYear(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.getFullYear();
  }

  formatDurationMs(durationMs) {
    if (!durationMs || typeof durationMs !== 'number' || Number.isNaN(durationMs)) return '';
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatCount(value) {
    if (value === null || value === undefined) return '';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toString();
  }

  extractYouTubeId(value) {
    if (!value) return null;
    const trimmed = value.trim();
    const idRegex = /^[a-zA-Z0-9_-]{11}$/;

    if (idRegex.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed);
      if (url.hostname.includes('youtu.be')) {
        return url.pathname.split('/').pop();
      }
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return v;
        const segments = url.pathname.split('/');
        return segments.pop();
      }
    } catch (error) {
      return null;
    }

    return null;
  }

  escapeHtml(value = '') {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  createPlaceholderImage(width, height, text) {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a1a"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24"
              fill="rgba(255,255,255,0.3)" text-anchor="middle" dy=".3em"
              font-weight="300" letter-spacing="2px">${text}</text>
      </svg>
    `.trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  handleVisibilityChange() {
    if (document.hidden) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        const { src } = iframe;
        iframe.src = src;
      });
    }
  }
}

const app = new App();
window.app = app;
document.documentElement.style.scrollBehavior = 'smooth';
document.addEventListener('visibilitychange', () => app.handleVisibilityChange());


