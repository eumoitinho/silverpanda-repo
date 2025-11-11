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
    this.promoDataInitialised = false;
    this.socialDataInitialised = false;
    this.shopDataInitialised = false;
    this.heroRendered = false;
    this.cart = [];
    this.products = [];
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
        videosData,
        pressData,
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

      console.log('[loadCMSContent] Hero data from Strapi:', hero);
      this.renderHero(hero);

      // Load tours - try JSON first, then Strapi fallback
      let toursData = await this.loadTourFromJSON();
      if (!toursData || !toursData.items || toursData.items.length === 0) {
        toursData = tours;
      }
      this.renderTours(toursData);
      
      // Load videos - try Strapi first, then JSON fallback
      let videos = videosData;
      if (!videos || videos.length === 0) {
        videos = await this.loadVideosFromJSON();
      }
      this.renderVideos(videos);
      
      // Load press - try Strapi first, then JSON fallback
      let press = pressData;
      if (!press || press.length === 0) {
        press = await this.loadPressFromJSON();
      }
      this.renderPress(press);
      
      await this.renderInfo(info);
      this.renderBio(info);
      
      // Load Instagram posts - try Strapi first, then JSON fallback
      if (!collaborationsPage.instagramPosts || collaborationsPage.instagramPosts.length === 0) {
        this.instagramPostsData = await this.loadSocialFromJSON();
      } else {
        this.instagramPostsData = collaborationsPage.instagramPosts;
      }
      this.renderInstagram(this.instagramPostsData);
    } catch (error) {
      console.error('Error loading Strapi content:', error);
      this.spotifySelections = StrapiCMS.getDefaultSpotifyTracks();
      this.soundcloudSelections = StrapiCMS.getDefaultSoundcloudTracks();

      this.renderHero(StrapiCMS.getDefaultHero());
      
      // Load tours from JSON
      const tours = await this.loadTourFromJSON();
      this.renderTours(tours);
      
      // Load videos from JSON
      const videos = await this.loadVideosFromJSON();
      this.renderVideos(videos);
      
      // Load press from JSON
      const press = await this.loadPressFromJSON();
      this.renderPress(press);
      
      // Load social from JSON
      this.instagramPostsData = await this.loadSocialFromJSON();
      this.renderInstagram(this.instagramPostsData);
      
      const defaultInfo = StrapiCMS.getDefaultInfo();
      await this.renderInfo(defaultInfo);
      this.renderBio(defaultInfo);
    }
  }

  renderHero(hero = {}) {
    console.log('[renderHero] Rendering hero with data:', hero);
    
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
    
    const backgroundUrl = hero.heroBackground || hero.background || '/photos/Untitled-1.png';
    
    console.log('[renderHero] Extracted values:', {
      logoUrl,
      hasLogo,
      hasTitle,
      hasSubtitle,
      backgroundUrl,
      heroKeys: Object.keys(hero),
      heroBackground: hero.heroBackground,
      heroLogo: hero.heroLogo,
      background: hero.background,
      logo: hero.logo,
      elements: {
        titleEl: !!heroTitleEl,
        subtitleEl: !!heroSubtitleEl,
        logoEl: !!heroLogoEl,
        backgroundEl: !!heroBackgroundEl
      }
    });

    if (heroLogoEl) {
      if (logoUrl) {
        // Preload logo image
        console.log('[renderHero] Loading logo:', logoUrl);
        const logoImg = new Image();
        logoImg.onload = () => {
          console.log('[renderHero] Logo loaded successfully:', logoUrl);
          heroLogoEl.src = logoUrl;
          heroLogoEl.alt = hero.title ? `${hero.title} logo` : 'Logo';
          heroLogoEl.style.display = 'block';
          heroLogoEl.style.opacity = '1';
          heroLogoEl.removeAttribute('aria-hidden');
          if (heroTitleContainer) {
            heroTitleContainer.classList.add('has-logo');
          }
        };
        logoImg.onerror = () => {
          console.warn('[renderHero] Failed to load logo:', logoUrl);
          heroLogoEl.style.display = 'none';
          if (heroTitleContainer) {
            heroTitleContainer.classList.remove('has-logo');
          }
        };
        logoImg.src = logoUrl;
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
      // Always show title, even if empty (will show default)
      const titleText = hasTitle ? hero.title : (defaultHero.title);
      heroTitleEl.textContent = titleText;
      heroTitleEl.style.display = 'block';
      heroTitleEl.removeAttribute('aria-hidden');
    }

    // Usar foto da pasta photos como background padrão se não houver background do Strapi
    if (heroBackgroundEl) {
      if (backgroundUrl) {
        // Set background immediately and show it
        console.log('[renderHero] Setting background image:', backgroundUrl);
        heroBackgroundEl.style.setProperty('background-image', `url("${backgroundUrl}")`, 'important');
        heroBackgroundEl.style.setProperty('background-size', 'cover', 'important');
        heroBackgroundEl.style.setProperty('background-position', 'center', 'important');
        heroBackgroundEl.style.setProperty('background-repeat', 'no-repeat', 'important');
        heroBackgroundEl.style.setProperty('visibility', 'visible', 'important');
        heroBackgroundEl.style.setProperty('z-index', '0', 'important');
        heroBackgroundEl.classList.add('loaded');
        heroBackgroundEl.style.setProperty('opacity', '1', 'important');

        // Preload image to check if it loads successfully
        const img = new Image();
        img.onload = () => {
          console.log('[renderHero] Background image loaded successfully:', backgroundUrl);
        };
        img.onerror = () => {
          console.error('[renderHero] Failed to load hero background:', backgroundUrl);
        };
        img.src = backgroundUrl;
      } else {
        heroBackgroundEl.style.backgroundImage = '';
        heroBackgroundEl.classList.remove('loaded');
        heroBackgroundEl.style.opacity = '0';
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
        console.log('[renderHero] Subtitle set to:', hero.subtitle);
      } else if (defaultHero.subtitle) {
        // Show default subtitle if no subtitle provided
        heroSubtitleEl.textContent = defaultHero.subtitle;
        heroSubtitleEl.style.display = 'block';
        console.log('[renderHero] Default subtitle set to:', defaultHero.subtitle);
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

    console.log('[renderTours] Rendering tours with data:', tourData);

    if (sourceEl) {
      sourceEl.textContent = tourData.source || 'Resident Advisor';
    }

    const items = tourData.items || [];

    console.log(`[renderTours] Rendering ${items.length} tour dates`);

    if (!items.length) {
      table.innerHTML = '<div class="section__error">Tour dates coming soon.</div>';
      return;
    }

    table.innerHTML = items
      .map((tour) => {
        const { year, month, day } = this.formatTourDate(tour.date);
        const location = [tour.city, tour.country].filter(Boolean).join(', ');
        const venue = tour.venue || 'TBA';
        const ticketsLink = tour.link
          ? `<a href="${tour.link}" target="_blank" rel="noopener noreferrer" class="tour__tickets__link">Tickets →</a>`
          : '';

        return `
          <div class="tour__table__row">
            <div class="tour__table__cell">${year || '—'}</div>
            <div class="tour__table__cell">${month && day ? `${month} ${day}` : 'TBA'}</div>
            <div class="tour__table__cell">${location || 'TBA'}</div>
            <div class="tour__table__cell">${venue}</div>
            <div class="tour__table__cell tour__table__cell--tickets">${ticketsLink}</div>
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
        // Handle YouTube videos
        const youtubeId = video.youtubeId || (video.youtubeUrl ? this.extractYouTubeId(video.youtubeUrl) : null);
        
        // Handle Instagram reels
        const isReel = video.isReel || video.videoUrl || video.instagramUrl;
        
        return {
          ...video,
          youtubeId: youtubeId || null,
          title: video.title || 'Untitled Video',
          thumbnail: video.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : this.createPlaceholderImage(1920, 1080, 'Video')),
          credits: Array.isArray(video.credits)
            ? video.credits
            : video.credits
              ? [video.credits]
              : [],
          year: video.year || (video.releaseDate ? new Date(video.releaseDate).getFullYear().toString() : ''),
          category: video.category || (isReel ? 'Reels' : 'Music Videos'),
          isReel: isReel,
          instagramUrl: video.instagramUrl || null,
          videoUrl: video.videoUrl || null,
        };
      })
      .filter((video) => video.youtubeId || video.isReel);

    if (!this.videoData.length) {
      grid.innerHTML = '<div class="section__error">No videos available yet.</div>';
      return;
    }

    grid.innerHTML = this.videoData
      .map(
        (video, index) => {
          const reelBadge = video.isReel ? '<div class="videos__item__badge">REEL</div>' : '';
          const reelClass = video.isReel ? 'videos__item--reel' : '';
          
          return `
          <div class="videos__item ${reelClass}" data-index="${index}" data-category="${video.category}">
          <div class="videos__item__media">
              ${reelBadge}
              <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}" loading="lazy" data-error-handler-attached="false">
          </div>
          <div class="videos__item__info">
              <div class="videos__item__title">${this.escapeHtml(video.title)}</div>
            ${video.year ? `<div class="videos__item__year">${video.year}</div>` : ''}
            ${this.formatVideoCredits(video.credits)}
          </div>
        </div>
        `;
        },
      )
      .join('');

    // Register image error handlers and add loaded class when images load
    const images = grid.querySelectorAll('img');
    this.registerImageErrorHandlers(images);
    
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });
        img.addEventListener('error', () => {
          console.warn('Failed to load video thumbnail:', img.src);
        }, { once: true });
      }
    });

    // Setup click handlers for reels and YouTube videos
    grid.querySelectorAll('.videos__item').forEach((item, index) => {
      const video = this.videoData[index];
      if (video.isReel && video.instagramUrl) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          window.open(video.instagramUrl, '_blank', 'noopener,noreferrer');
        });
      } else if (video.youtubeId) {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
          this.openVideoModal(video);
        });
      }
    });

    if (!this.currentVideoCategory) {
      const activeTab = document.querySelector('.videos__tab.active');
      this.currentVideoCategory = activeTab ? activeTab.textContent.trim() : 'Sets';
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
              <img class="press__covers__item__media__image" src="${feature.image || this.createPlaceholderImage(800, 1067, publication)}" alt="${this.escapeHtml(publication)}" loading="lazy" data-error-handler-attached="false">
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

    // Register image error handlers and add loaded class when images load
    const images = grid.querySelectorAll('img');
    this.registerImageErrorHandlers(images);
    
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });
        img.addEventListener('error', () => {
          console.warn('Failed to load press image:', img.src);
        }, { once: true });
      }
    });
  }

  renderInstagram(posts = []) {
    const grid = document.getElementById('instagramGrid');
    if (!grid) return;

    if (!posts.length) {
      grid.innerHTML = '<div class="section__error">Social content coming soon.</div>';
      return;
    }

    console.log('[renderInstagram] Rendering', posts.length, 'posts');
    console.log('[renderInstagram] First post:', posts[0]);

    grid.innerHTML = posts
      .map((post, index) => {
        const dateLabel = this.formatInstagramDate(post.timestamp);
        const likesLabel = typeof post.likes === 'number' ? this.formatCount(post.likes) : (post.likesCount ? this.formatCount(post.likesCount) : '');
        const commentsLabel = typeof post.comments === 'number' ? this.formatCount(post.comments) : (post.commentsCount ? this.formatCount(post.commentsCount) : '');
        const stats = [
          likesLabel ? `<span class="instagram__item__stat">❤️ ${likesLabel}</span>` : '',
          commentsLabel ? `<span class="instagram__item__stat">💬 ${commentsLabel}</span>` : '',
        ].filter(Boolean);
        const statsHtml = stats.length ? `<div class="instagram__item__stats">${stats.join('')}</div>` : '';

        const caption =
          post.caption && post.caption.length > 0
            ? `<p class="instagram__item__caption">${this.escapeHtml(post.caption)}</p>`
            : '';

        const mediaAlt = post.altText || post.alt || post.caption || 'Instagram post';
        const permalink = post.permalink || post.url || '#';
        const mediaSrc = post.mediaUrl || this.createPlaceholderImage(800, 800, 'Instagram');

        if (index < 3) {
          console.log(`[renderInstagram] Post ${index}:`, {
            mediaUrl: post.mediaUrl,
            mediaSrc,
            permalink,
            caption: post.caption?.substring(0, 50)
          });
        }

        return `
        <article class="instagram__item">
          <a href="${permalink}" target="_blank" rel="noopener noreferrer" class="instagram__item__media">
            <img src="${mediaSrc}" alt="${this.escapeHtml(mediaAlt)}" loading="lazy" data-error-handler-attached="false">
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

    // Register image error handlers and add loaded class when images load
    const images = grid.querySelectorAll('img');
    this.registerImageErrorHandlers(images);
    
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });
        img.addEventListener('error', () => {
          console.warn('Failed to load Instagram image:', img.src);
        }, { once: true });
      }
    });
  }

  renderBio(info = {}) {
    const textEl = document.getElementById('bioText');
    if (!textEl) return;

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
    } else {
      // Default bio if no data
      textEl.innerHTML = `
        <p>In an impressively short time, Silver Panda has garnered support from some of the biggest names in the industry, catapulting their profile to epic heights. Their collaborative work with artists like John Summit, Space Motion, and Sevenn has led to significant achievements, including their music reaching the #1 spot on Beatport's Overall Chart.</p>
        <p>In 2024, Silver Panda achieved a major milestone with the #1 top-selling melodic techno track on Beatport and claimed the #1 spot for track support in 2024 via 1001Tracklists stats. Their innovative sound has earned them a place among Beatport's top 10 melodic techno artists, with this notoriety fueling a world tour in 2024 featuring performances at clubs and festivals across the US, South America, Europe, and Asia.</p>
        <p>In addition to their creative output, Silver Panda has made strides in shaping the industry with their label, Panda Lab Records. The label rose to become the #4 melodic techno label on the Beatport charts in 2023, highlighting the duo's exceptional blend of creativity, collaboration, and entrepreneurship.</p>
      `;
    }

    // Register image error handlers for bio images
    const bioImages = document.querySelectorAll('#bioContent img');
    console.log('[renderBio] Found', bioImages.length, 'images in bio');
    this.registerImageErrorHandlers(bioImages);
    bioImages.forEach((img) => {
      console.log('[renderBio] Processing image:', img.src, 'complete:', img.complete, 'naturalHeight:', img.naturalHeight);
      if (img.complete && img.naturalHeight !== 0) {
        img.classList.add('loaded');
        console.log('[renderBio] Image already loaded, added "loaded" class');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
          console.log('[renderBio] Image loaded, added "loaded" class');
        }, { once: true });
        img.addEventListener('error', () => {
          console.warn('[renderBio] Failed to load bio image:', img.src);
        }, { once: true });
      }
    });
  }

  async renderInfo(info = {}) {
    const riderEl = document.getElementById('infoRider');
    const managementEl = document.getElementById('infoManagement');

    // Load rider information
    try {
      const riderResponse = await fetch('/info/rider.json');
      if (riderResponse.ok) {
        const riderData = await riderResponse.json();
        this.renderRiderInfo(riderData, riderEl, managementEl);
      } else {
        if (riderEl) riderEl.innerHTML = '';
        if (managementEl) managementEl.innerHTML = '';
      }
    } catch (error) {
      console.error('Error loading rider info:', error);
      if (riderEl) riderEl.innerHTML = '';
      if (managementEl) managementEl.innerHTML = '';
    }
  }

  renderRiderInfo(riderData, riderEl, managementEl) {
    if (!riderData) return;

    // Render Technical, Hospitality, and Travel Riders
    if (riderEl) {
      riderEl.innerHTML = `
        <div class="info__rider__section">
          <h3>Technical Rider</h3>
          ${riderData.technical_rider?.sections?.map((section) => `
            <div class="info__rider__subsection">
              <h4>${this.escapeHtml(section.title)}</h4>
              <ul>
                ${section.content?.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('') || ''}
              </ul>
            </div>
          `).join('') || ''}
        </div>
        <div class="info__rider__section">
          <h3>Hospitality Rider</h3>
          ${riderData.hospitality_rider?.sections?.map((section) => `
            <div class="info__rider__subsection">
              <h4>${this.escapeHtml(section.title)}</h4>
              <ul>
                ${section.content?.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('') || ''}
              </ul>
            </div>
          `).join('') || ''}
        </div>
        <div class="info__rider__section">
          <h3>Travel Rider</h3>
          ${riderData.travel_rider?.sections?.map((section) => `
            <div class="info__rider__subsection">
              <h4>${this.escapeHtml(section.title)}</h4>
              <ul>
                ${section.content?.map((item) => `<li>${this.escapeHtml(item)}</li>`).join('') || ''}
              </ul>
            </div>
          `).join('') || ''}
        </div>
      `;
    }

    // Render Management & Booking
    if (managementEl && riderData.management) {
      const mgmt = riderData.management;
      managementEl.innerHTML = `
        <div class="info__management__section">
          <h3>Management & Booking</h3>
          <div class="info__management__contact">
            ${mgmt.contact?.name ? `<p><strong>${this.escapeHtml(mgmt.contact.name)}</strong></p>` : ''}
            ${mgmt.contact?.email ? `<p>Email: <a href="mailto:${mgmt.contact.email}">${this.escapeHtml(mgmt.contact.email)}</a></p>` : ''}
            ${mgmt.contact?.phone ? `<p>Phone: <a href="tel:${mgmt.contact.phone}">${this.escapeHtml(mgmt.contact.phone)}</a></p>` : ''}
            ${mgmt.contact?.website ? `<p>Website: <a href="${mgmt.contact.website}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(mgmt.contact.website)}</a></p>` : ''}
          </div>
          ${mgmt.notes?.length ? `
            <div class="info__management__notes">
              <h4>Notes</h4>
              <ul>
                ${mgmt.notes.map((note) => `<li>${this.escapeHtml(note)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    }
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
      promo: 'promo',
      shop: 'shop',
      social: 'social',
      collaborations: 'social', // Backward compatibility
      bio: 'bio',
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

  async showPage(page) {
    const allPages = document.querySelectorAll('.content[data-template]');
    
    // Remove active class and hide all pages
    allPages.forEach((p) => {
      p.classList.remove('active', 'exit');
      p.style.display = 'none';
    });

    const targetPage = document.getElementById(page);
    if (!targetPage) {
      console.warn(`Page "${page}" not found`);
      return;
    }

    // Show the target page immediately
      targetPage.style.display = 'flex';
      this.currentPage = page;
    
    // Add active class immediately to ensure visibility
    targetPage.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    if (page === 'promo' && !this.promoDataInitialised) {
      this.promoDataInitialised = true;
      this.loadPromoTracks();
    }

    if (page === 'shop' && !this.shopDataInitialised) {
      this.shopDataInitialised = true;
      this.products = this.getMockProducts();
      this.renderShop();
    }

    if (page === 'social' && !this.socialDataInitialised) {
      this.socialDataInitialised = true;
      // Load social data if not already loaded
      if (!this.instagramPostsData || this.instagramPostsData.length === 0) {
        this.instagramPostsData = await this.loadSocialFromJSON();
        this.renderInstagram(this.instagramPostsData);
      }
    }

    if (page === 'bio') {
      // Ensure bio images are loaded and registered
      const bioImages = document.querySelectorAll('#bioContent img');
      console.log('[showPage bio] Checking', bioImages.length, 'bio images');
      this.registerImageErrorHandlers(bioImages);
      bioImages.forEach((img) => {
        console.log('[showPage bio] Image state:', img.src, 'complete:', img.complete, 'naturalHeight:', img.naturalHeight);
        if (img.complete && img.naturalHeight !== 0) {
          img.classList.add('loaded');
          console.log('[showPage bio] Image marked as loaded');
        } else {
          img.addEventListener('load', () => {
            img.classList.add('loaded');
            console.log('[showPage bio] Image loaded event triggered');
          }, { once: true });
          img.addEventListener('error', (e) => {
            console.error('[showPage bio] Failed to load bio image:', img.src, e);
          }, { once: true });
        }
      });
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
      // Show home page immediately on load
      const homePage = document.getElementById('home');
      if (homePage) {
        homePage.style.display = 'flex';
        homePage.classList.add('active');
        this.updateActiveNav('home');
        document.body.classList.add('home-active');
        
        // Ensure hero is rendered even if CMS content hasn't loaded yet
        if (!this.heroRendered) {
          const defaultHero = StrapiCMS.getDefaultHero();
          this.renderHero(defaultHero);
          this.heroRendered = true;
        }
      }
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
      // Use class to hide items while maintaining grid layout
      if (matches) {
        item.classList.remove('hidden');
        visibleCount += 1;
      } else {
        item.classList.add('hidden');
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
        console.log('[Music] No CMS selections, trying Spotify API...');
        const tracks = await SpotifyAPI.getTopTracks('US');
        console.log(`[Music] Spotify API returned ${tracks.length} tracks`);
        return tracks.map((track, index) => ({
          ...track,
          provider: 'spotify',
          order: index,
        }));
      } catch (error) {
        console.error('Error fetching default Spotify tracks from API:', error);
        console.log('[Music] Falling back to albums.json...');
        try {
          const response = await fetch('/music/albums.json');
          if (response.ok) {
            const data = await response.json();
            const albums = data.albums || [];
            console.log(`[Music] Loaded ${albums.length} albums from JSON file`);
            return albums.map((album, index) => ({
              id: album.id,
              title: album.name,
              artist: album.artist,
              artwork: album.artwork,
              externalUrl: album.externalUrl,
              album: album.name,
              releaseDate: album.releaseDate,
              duration: null,
              provider: 'spotify',
              order: index,
            }));
          }
        } catch (jsonError) {
          console.error('Error loading albums from JSON:', jsonError);
        }
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
                 loading="lazy"
                 data-error-handler-attached="false">
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

    // Register image error handlers and add loaded class when images load
    const musicImages = musicGrid.querySelectorAll('img');
    this.registerImageErrorHandlers(musicImages);
    
    musicImages.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => {
          img.classList.add('loaded');
        }, { once: true });
        img.addEventListener('error', () => {
          console.warn('Failed to load music artwork:', img.src);
        }, { once: true });
      }
    });

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

  formatTime(timeInSeconds) {
    if (!timeInSeconds || typeof timeInSeconds !== 'number' || Number.isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
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

  async loadPromoTracks() {
    const container = document.getElementById('promoPlayerContainer');
    if (!container) return;

    const promoFiles = [
      {
        filename: 'Moby - Lift Me Up (Silver Panda Remix) B 126 Extended Mix FINAL.wav',
        searchQuery: 'Moby Lift Me Up Silver Panda',
      },
      {
        filename: 'Silver Panda & Ranji - Power Of Acid (Extended Mix) G 126.wav',
        searchQuery: 'Silver Panda Ranji Power Of Acid',
      },
      {
        filename: 'The Temper Trap - Sweet Disposition (John Summit & Silver Panda Remix) Extended Mix.wav',
        searchQuery: 'Sweet Disposition John Summit Silver Panda',
      },
      {
        filename: 'Silver Panda & Ruback - Underground (Extended Mix) G# 126.wav',
        searchQuery: 'Silver Panda Ruback Underground',
      },
    ];

    try {
      container.innerHTML = '<div class="promo__loading">Loading promo tracks...</div>';
      
      const tracks = await Promise.all(
        promoFiles.map(async (file) => {
          const artwork = await this.searchSpotifyArtwork(file.searchQuery);
          const audioUrl = `/Promo%20Tracks/${encodeURIComponent(file.filename)}`;
          console.log('[loadPromoTracks] Track audio URL:', audioUrl);
          return {
            ...file,
            artwork: artwork || this.createPlaceholderImage(500, 500, 'Promo'),
            audioUrl: audioUrl,
          };
        })
      );

      console.log('[loadPromoTracks] All tracks loaded:', tracks);
      this.renderPromoPlayer(tracks);
    } catch (error) {
      console.error('Error loading promo tracks:', error);
      container.innerHTML = '<div class="section__error">Failed to load promo tracks</div>';
    }
  }

  async searchSpotifyArtwork(query) {
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}&type=track&limit=1`);
      if (!response.ok) {
        console.warn(`Failed to search Spotify for: ${query}`);
        return null;
      }
      const data = await response.json();
      // A API retorna { tracks: [{ artwork: ... }] }
      const tracks = data?.tracks || [];
      if (tracks.length > 0 && tracks[0].artwork) {
        return tracks[0].artwork;
      }
      return null;
    } catch (error) {
      console.error(`Error searching Spotify for ${query}:`, error);
      return null;
    }
  }

  renderPromoPlayer(tracks) {
    console.log('[renderPromoPlayer] Rendering', tracks.length, 'tracks');
    const container = document.getElementById('promoPlayerContainer');
    if (!container) {
      console.error('[renderPromoPlayer] Container not found');
      return;
    }

    if (!tracks || tracks.length === 0) {
      container.innerHTML = '<div class="section__error">No promo tracks available</div>';
      return;
    }

    console.log('[renderPromoPlayer] First track:', tracks[0]);

    container.innerHTML = tracks.map((track, index) => {
      const title = track.filename
        .replace(/\.wav$/, '')
        .replace(/\s+(B|G|G#)\s+\d+\s+Extended Mix/i, '')
        .trim();
      
      // Extrair artista e nome da música do título
      const parts = title.split(' - ');
      const artist = parts.length > 1 ? parts[0] : 'Silver Panda';
      const trackName = parts.length > 1 ? parts.slice(1).join(' - ') : title;
      
      return `
        <div class="promo__track__item" data-index="${index}">
          <div class="promo__track__item__media">
            <img class="promo__track__item__artwork" src="${track.artwork || this.createPlaceholderImage(500, 500, 'Promo')}" alt="${this.escapeHtml(title)}" loading="lazy">
            <div class="promo__track__item__play__overlay">
              <div class="promo__track__item__play__button">▶</div>
            </div>
          </div>
          <div class="promo__track__item__info">
            <div class="promo__track__item__title">${this.escapeHtml(trackName)}</div>
            <div class="promo__track__item__artist">${this.escapeHtml(artist)}</div>
          </div>
          <audio class="promo__player__audio" data-index="${index}" preload="none">
            <source src="${track.audioUrl}" type="audio/wav">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
    }).join('');

    const images = container.querySelectorAll('img');
    this.registerImageErrorHandlers(images);
    
    // Mark images as loaded
    images.forEach((img) => {
      if (img.complete && img.naturalHeight !== 0) {
        requestAnimationFrame(() => {
          img.classList.add('loaded');
        });
      } else {
        img.addEventListener('load', () => {
          requestAnimationFrame(() => {
            img.classList.add('loaded');
          });
        }, { once: true });
      }
    });

    this.setupPromoPlayerControls(tracks);
  }

  setupPromoPlayerControls(tracks) {
    let currentTrackIndex = 0;
    let currentAudio = null;
    let isTransitioning = false;
    const bottomPlayer = document.getElementById('promoPlayerBottom');
    const playButton = document.getElementById('promoBottomPlayButton');
    const prevButton = document.getElementById('promoBottomPrevButton');
    const nextButton = document.getElementById('promoBottomNextButton');
    const progressBar = document.getElementById('promoBottomProgressBar');
    const currentTimeEl = document.getElementById('promoBottomCurrentTime');
    const durationEl = document.getElementById('promoBottomDuration');
    const currentTitleEl = document.getElementById('promoBottomTitle');
    const closeButton = document.getElementById('promoBottomCloseButton');

    const playItems = document.querySelectorAll('.promo__track__item');

    const loadTrack = (index) => {
      console.log('[loadTrack] Loading track:', index, tracks[index]);

      // Stop any transition in progress
      if (isTransitioning) {
        console.log('[loadTrack] Already transitioning, waiting...');
        return null;
      }

      isTransitioning = true;

      if (currentAudio) {
        try {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        } catch (e) {
          console.warn('[loadTrack] Error pausing previous audio:', e);
        }
      }

      currentTrackIndex = index;
      const track = tracks[index];
      console.log('[loadTrack] Looking for audio with data-index:', index);
      console.log('[loadTrack] All audio elements:', document.querySelectorAll('audio[data-index]').length);

      const audio = document.querySelector(`audio[data-index="${index}"]`);

      console.log('[loadTrack] Audio element:', audio);
      console.log('[loadTrack] Audio src:', audio ? audio.src : 'no audio element');
      console.log('[loadTrack] Audio currentSrc:', audio ? audio.currentSrc : 'no audio element');

      if (!audio) {
        console.error('[loadTrack] Audio element not found for index:', index);
        console.error('[loadTrack] Available audio elements:', Array.from(document.querySelectorAll('audio')).map(a => ({ index: a.dataset.index, src: a.src })));
        return;
      }

      currentAudio = audio;
      const title = track.filename
        .replace(/\.wav$/, '')
        .replace(/\s+(B|G|G#)\s+\d+\s+Extended Mix/i, '')
        .trim();

      if (currentTitleEl) currentTitleEl.textContent = title;
      
      // Update artwork in bottom player
      const artworkEl = document.getElementById('promoBottomArtwork');
      if (artworkEl && track.artwork) {
        artworkEl.src = track.artwork;
        artworkEl.style.display = 'block';
      }

      if (bottomPlayer) {
        bottomPlayer.style.display = 'flex';
        // Trigger animation
        setTimeout(() => {
          bottomPlayer.classList.add('visible');
          document.body.classList.add('player-active');
        }, 10);
      }

      // Update active state
      playItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
        if (i === index) {
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          });
        }
      });

      audio.addEventListener('loadedmetadata', () => {
        console.log('[loadTrack] Audio metadata loaded successfully:', {
          duration: audio.duration,
          src: audio.src,
          readyState: audio.readyState
        });
        if (durationEl) {
          durationEl.textContent = this.formatTime(audio.duration);
        }
        if (progressBar) {
          progressBar.max = audio.duration || 0;
        }
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('[loadTrack] Audio can play through without buffering');
        isTransitioning = false;
      });

      audio.addEventListener('loadeddata', () => {
        console.log('[loadTrack] Audio data loaded, ready to play');
        isTransitioning = false;
      });

      audio.addEventListener('timeupdate', () => {
        if (progressBar) {
          progressBar.value = audio.currentTime;
          // Update progress bar visual
          const progress = (audio.currentTime / audio.duration) * 100;
          progressBar.style.setProperty('--progress', `${progress}%`);
        }
        if (currentTimeEl) {
          currentTimeEl.textContent = this.formatTime(audio.currentTime);
        }
      });
      
      // Load metadata immediately if available
      if (audio.readyState >= 1) {
        if (durationEl) {
          durationEl.textContent = this.formatTime(audio.duration);
        }
        if (progressBar) {
          progressBar.max = audio.duration || 0;
        }
      }

      audio.addEventListener('ended', () => {
        // Auto-play next track
        const nextIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
        const nextAudio = loadTrack(nextIndex);
        if (nextAudio) {
          nextAudio.play();
          if (playButton) playButton.textContent = '⏸';
        }
      });

      audio.addEventListener('error', (e) => {
        console.error('[PromoPlayer] Audio error:', e);
        console.error('[PromoPlayer] Audio error code:', audio.error?.code);
        console.error('[PromoPlayer] Audio error message:', audio.error?.message);
        console.error('[PromoPlayer] Audio src:', audio.src);

        isTransitioning = false;

        // Error codes:
        // 1 = MEDIA_ERR_ABORTED - fetching process aborted by user
        // 2 = MEDIA_ERR_NETWORK - error occurred when downloading
        // 3 = MEDIA_ERR_DECODE - error occurred when decoding
        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED - audio/video not supported

        if (audio.error?.code === 4) {
          alert('Formato de áudio não suportado pelo navegador');
        } else if (audio.error?.code === 2) {
          alert('Erro ao carregar áudio. Verifique sua conexão.');
        }
      });

      return audio;
    };

    playItems.forEach((item, index) => {
      // Animate items on load
      setTimeout(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0) scale(1)';
      }, index * 100);

      item.addEventListener('click', () => {
        console.log('[PromoPlayer] Track clicked:', index);

        // If already transitioning, ignore click
        if (isTransitioning) {
          console.log('[PromoPlayer] Ignoring click, transition in progress');
          return;
        }

        const audio = loadTrack(index);
        if (!audio) {
          console.error('[PromoPlayer] Audio element not found for index:', index);
          return;
        }

        console.log('[PromoPlayer] Audio element found:', audio.src);
        console.log('[PromoPlayer] Audio readyState:', audio.readyState);
        console.log('[PromoPlayer] Audio networkState:', audio.networkState);

        if (audio.paused) {
          console.log('[PromoPlayer] Playing audio...');

          // Force load if not loaded
          if (audio.readyState < 2) {
            console.log('[PromoPlayer] Loading audio first...');
            audio.load();
          }

          // Small delay to let the load start
          setTimeout(() => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[PromoPlayer] Audio playing successfully');
                  if (playButton) playButton.textContent = '⏸';
                })
                .catch((error) => {
                  console.error('[PromoPlayer] Error playing audio:', error);
                  console.error('[PromoPlayer] Error name:', error.name);
                  console.error('[PromoPlayer] Error message:', error.message);
                  isTransitioning = false;
                  // Don't show alert for abort errors (user clicked pause quickly)
                  if (error.name !== 'AbortError') {
                    alert('Erro ao reproduzir áudio: ' + error.message);
                  }
                });
            }
          }, 100);
        } else {
          audio.pause();
          if (playButton) playButton.textContent = '▶';
        }
      });
    });

    if (playButton) {
      playButton.addEventListener('click', () => {
        if (!currentAudio) {
          const audio = loadTrack(0);
          if (audio) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  if (playButton) playButton.textContent = '⏸';
                })
                .catch((error) => {
                  console.error('[PromoPlayer] Error playing audio from play button:', error);
                });
            }
          }
        } else if (currentAudio.paused) {
          const playPromise = currentAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                playButton.textContent = '⏸';
              })
              .catch((error) => {
                console.error('[PromoPlayer] Error playing audio:', error);
              });
          }
        } else {
          currentAudio.pause();
          playButton.textContent = '▶';
        }
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        const newIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : tracks.length - 1;
        const audio = loadTrack(newIndex);
        if (audio) {
          audio.play();
          if (playButton) playButton.textContent = '⏸';
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const newIndex = currentTrackIndex < tracks.length - 1 ? currentTrackIndex + 1 : 0;
        const audio = loadTrack(newIndex);
        if (audio) {
          audio.play();
          if (playButton) playButton.textContent = '⏸';
        }
      });
    }

    if (progressBar) {
      progressBar.addEventListener('input', (e) => {
        if (currentAudio) {
          currentAudio.currentTime = parseFloat(e.target.value);
        }
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        if (bottomPlayer) {
          // Animate out
          bottomPlayer.classList.remove('visible');
          document.body.classList.remove('player-active');
          setTimeout(() => {
            bottomPlayer.style.display = 'none';
          }, 400);
        }
        if (playButton) playButton.textContent = '▶';
        playItems.forEach((item) => item.classList.remove('active'));
        currentAudio = null;
        currentTrackIndex = 0;
      });
    }
  }

  async loadVideosFromJSON() {
    try {
      // Load YouTube videos
      const youtubeResponse = await fetch('/videos/youtube.json');
      const youtubeVideos = youtubeResponse.ok ? await youtubeResponse.json() : [];
      
      // Load Instagram reels
      const reelsResponse = await fetch('/reels.json');
      const reels = reelsResponse.ok ? await reelsResponse.json() : [];
      
      const videos = [];
      
      // Process YouTube videos
      youtubeVideos.forEach((video) => {
        const id = video.id || this.extractYouTubeId(video.url);
        if (!id) return;
        
        // Extract year from date string
        let year = '';
        if (video.date) {
          const dateMatch = video.date.match(/(\d{4})/);
          if (dateMatch) year = dateMatch[1];
        }
        
        // Determine category
        let category = 'Other';
        const title = (video.title || '').toLowerCase();
        if (title.includes('panda frequency') || title.includes('set')) {
          category = 'Sets';
        } else if (title.includes('remix') || title.includes('mix')) {
          category = 'Music Videos';
        }
        
        videos.push({
          id: `youtube-${id}`,
          title: video.title || 'Untitled Video',
          youtubeId: id,
          youtubeUrl: video.url || `https://www.youtube.com/watch?v=${id}`,
          thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
          year: year,
          category: category,
          credits: [],
        });
      });
      
      // Process Instagram reels
      reels.forEach((reel) => {
        if (!reel.videoUrl) return;
        
        videos.push({
          id: `reel-${reel.id}`,
          title: reel.caption || 'Instagram Reel',
          instagramUrl: reel.url,
          videoUrl: reel.videoUrl,
          thumbnail: reel.images && reel.images[0] ? reel.images[0] : this.createPlaceholderImage(750, 1332, 'Reel'),
          year: reel.timestamp ? new Date(reel.timestamp).getFullYear().toString() : '',
          category: 'Reels',
          credits: [],
          isReel: true,
        });
      });
      
      return videos;
    } catch (error) {
      console.error('Error loading videos from JSON:', error);
      return [];
    }
  }

  async loadPressFromJSON() {
    try {
      const response = await fetch('/press/articles.json');
      if (!response.ok) {
        console.warn('Press articles JSON not found');
        return [];
      }
      
      const data = await response.json();
      const articles = data.press_articles || [];
      
      // Get available photos
      const photoFiles = [
        'SP1.JPG', 'SP2.JPG', 'SP3.JPG', 'SP5.JPG', 'SP6.JPG', 'SP7.JPG',
        'DSCF3797.jpg', 'DSCF3786-Edit.jpg', 'DSCF3641-Edit.jpg',
        'photo2.png', 'Untitled-1.png', 'DSCF3747-Edit.jpg'
      ];
      
      let photoIndex = 0;
      
      return articles.map((article, index) => {
        // Use provided image, or assign from photos folder
        let image = article.capa;
        if (!image || image === null) {
          image = `/photos/${photoFiles[photoIndex % photoFiles.length]}`;
          photoIndex++;
        }
        
        // Extract year from date
        let year = '';
        if (article.data) {
          const yearMatch = article.data.match(/(\d{4})/);
          if (yearMatch) year = yearMatch[1];
        }
        
        return {
          id: `press-${index}`,
          publication: article.publicacao || 'Press',
          title: article.titulo || article.title || '',
          link: article.url || article.link || '',
          image: image,
          date: article.data || '',
          year: year,
          description: article.descricao || article.description || '',
        };
      });
    } catch (error) {
      console.error('Error loading press from JSON:', error);
      return [];
    }
  }

  async loadTourFromJSON() {
    try {
      console.log('[loadTourFromJSON] Fetching tour dates from /tour/dates.json');
      const response = await fetch('/tour/dates.json');
      if (!response.ok) {
        console.warn('[loadTourFromJSON] Tour dates JSON not found, status:', response.status);
        return null;
      }

      const tourData = await response.json();
      console.log('[loadTourFromJSON] Loaded tour data:', tourData);

      if (!tourData || !tourData.items || !Array.isArray(tourData.items)) {
        console.warn('[loadTourFromJSON] Tour dates JSON is invalid');
        return null;
      }

      console.log(`[loadTourFromJSON] Found ${tourData.items.length} tour dates`);

      // Sort tours by date (most recent first)
      const sortedItems = tourData.items.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Descending order (most recent first)
      });

      return {
        source: tourData.source || 'Eventbrite / Songkick',
        items: sortedItems,
      };
    } catch (error) {
      console.error('[loadTourFromJSON] Error loading tour from JSON:', error);
      return null;
    }
  }

  async loadSocialFromJSON() {
    try {
      const response = await fetch('/social.json');
      if (!response.ok) {
        console.warn('Social JSON not found');
        return [];
      }

      const posts = await response.json();
      if (!Array.isArray(posts)) {
        console.warn('Social JSON is not an array');
        return [];
      }

      console.log('[loadSocialFromJSON] Loaded', posts.length, 'posts from JSON');
      console.log('[loadSocialFromJSON] First post structure:', posts[0]);

      return posts.map((post, index) => {
        // Get the first image from the images array or use displayUrl
        let mediaUrl = '';

        // Priority: displayUrl > images array > thumbnailUrl > videoUrl > placeholder
        if (post.displayUrl) {
          mediaUrl = post.displayUrl;
        } else if (post.images && Array.isArray(post.images) && post.images.length > 0) {
          mediaUrl = post.images[0];
        } else if (post.thumbnailUrl) {
          mediaUrl = post.thumbnailUrl;
        } else if (post.videoUrl) {
          // For videos without images, use placeholder
          mediaUrl = this.createPlaceholderImage(800, 800, 'Video');
        } else {
          mediaUrl = this.createPlaceholderImage(800, 800, 'Instagram');
        }

        // Use proxy for Instagram images to avoid CORS issues
        if (mediaUrl && (mediaUrl.includes('cdninstagram.com') || mediaUrl.includes('fbcdn.net'))) {
          mediaUrl = `/api/proxy-image?url=${encodeURIComponent(mediaUrl)}`;
        }

        const result = {
          id: post.id || post.shortCode || `post-${Math.random()}`,
          caption: post.caption || '',
          mediaUrl: mediaUrl,
          permalink: post.url || (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : '#'),
          timestamp: post.timestamp || new Date().toISOString(),
          likes: post.likesCount >= 0 ? post.likesCount : 0,
          comments: post.commentsCount >= 0 ? post.commentsCount : 0,
          type: post.type || 'Photo',
          alt: post.alt || '',
        };

        if (index < 3) {
          console.log(`[loadSocialFromJSON] Processed post ${index}:`, {
            id: result.id,
            mediaUrl: result.mediaUrl,
            hasCaption: !!result.caption,
            timestamp: result.timestamp
          });
        }

        return result;
      });
    } catch (error) {
      console.error('Error loading social from JSON:', error);
      return [];
    }
  }

  // Shop Methods
  getMockProducts() {
    return [
      {
        id: 'sp-tshirt-black',
        name: 'Silver Panda T-Shirt Black',
        price: 35.00,
        image: this.createPlaceholderImage(800, 800, 'T-Shirt'),
        description: 'Premium quality black t-shirt with Silver Panda logo'
      },
      {
        id: 'sp-hoodie-purple',
        name: 'Silver Panda Hoodie Purple',
        price: 65.00,
        image: this.createPlaceholderImage(800, 800, 'Hoodie'),
        description: 'Comfortable purple hoodie with embroidered logo'
      },
      {
        id: 'sp-cap-black',
        name: 'Silver Panda Cap',
        price: 25.00,
        image: this.createPlaceholderImage(800, 800, 'Cap'),
        description: 'Adjustable black cap with Silver Panda embroidery'
      },
      {
        id: 'sp-poster-limited',
        name: 'Limited Edition Poster',
        price: 20.00,
        image: this.createPlaceholderImage(800, 800, 'Poster'),
        description: 'Exclusive limited edition tour poster'
      },
      {
        id: 'sp-vinyl-record',
        name: 'Vinyl Record Collection',
        price: 45.00,
        image: this.createPlaceholderImage(800, 800, 'Vinyl'),
        description: 'Best tracks compilation on premium vinyl'
      },
      {
        id: 'sp-tote-bag',
        name: 'Silver Panda Tote Bag',
        price: 18.00,
        image: this.createPlaceholderImage(800, 800, 'Bag'),
        description: 'Eco-friendly cotton tote bag'
      }
    ];
  }

  renderShop() {
    const shopGrid = document.getElementById('shopGrid');
    if (!shopGrid) return;

    shopGrid.innerHTML = this.products.map(product => `
      <div class="shop__product" data-product-id="${product.id}">
        <img class="shop__product__image" src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="shop__product__info">
          <div class="shop__product__name">${this.escapeHtml(product.name)}</div>
          <div class="shop__product__price">$${product.price.toFixed(2)}</div>
          <div class="shop__product__description">${this.escapeHtml(product.description)}</div>
          <button class="shop__add__to__cart__button" data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    shopGrid.querySelectorAll('.shop__add__to__cart__button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = button.getAttribute('data-product-id');
        this.addToCart(productId);
      });
    });

    this.setupShopModals();
  }

  setupShopModals() {
    const cartButton = document.getElementById('shopCartButton');
    const cartModal = document.getElementById('cartModal');
    const cartModalClose = document.getElementById('cartModalClose');
    const checkoutButton = document.getElementById('checkoutButton');
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutModalClose = document.getElementById('checkoutModalClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationClose = document.getElementById('confirmationClose');

    if (cartButton) {
      cartButton.addEventListener('click', () => this.openCart());
    }

    if (cartModalClose) {
      cartModalClose.addEventListener('click', () => {
        cartModal.style.display = 'none';
      });
    }

    if (checkoutButton) {
      checkoutButton.addEventListener('click', () => {
        if (this.cart.length > 0) {
          cartModal.style.display = 'none';
          this.openCheckout();
        }
      });
    }

    if (checkoutModalClose) {
      checkoutModalClose.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
      });
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        checkoutModal.style.display = 'none';
        this.completeOrder();
      });
    }

    if (confirmationClose) {
      confirmationClose.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        this.cart = [];
        this.updateCartCount();
      });
    }

    [cartModal, checkoutModal, confirmationModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal || e.target.classList.contains('shop__cart__modal__overlay') ||
              e.target.classList.contains('shop__checkout__modal__overlay') ||
              e.target.classList.contains('shop__confirmation__modal__overlay')) {
            modal.style.display = 'none';
          }
        });
      }
    });
  }

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = this.cart.find(item => item.id === productId);
    if (cartItem) {
      cartItem.quantity++;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }

    this.updateCartCount();
    console.log(`Added ${product.name} to cart`);
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.updateCartCount();
    this.renderCartItems();
  }

  updateQuantity(productId, delta) {
    const cartItem = this.cart.find(item => item.id === productId);
    if (!cartItem) return;

    cartItem.quantity += delta;
    if (cartItem.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.renderCartItems();
      this.updateCartCount();
    }
  }

  updateCartCount() {
    const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountEl = document.getElementById('shopCartCount');
    if (cartCountEl) {
      cartCountEl.textContent = count;
    }
  }

  openCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) return;

    this.renderCartItems();
    cartModal.style.display = 'flex';
  }

  renderCartItems() {
    const cartBody = document.getElementById('cartModalBody');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const checkoutButton = document.getElementById('checkoutButton');

    if (!cartBody) return;

    if (this.cart.length === 0) {
      cartBody.innerHTML = '<div class="shop__cart__empty">Your cart is empty</div>';
      if (cartTotalPrice) cartTotalPrice.textContent = '$0.00';
      if (checkoutButton) checkoutButton.disabled = true;
      return;
    }

    if (checkoutButton) checkoutButton.disabled = false;

    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartBody.innerHTML = this.cart.map(item => `
      <div class="shop__cart__item">
        <img class="shop__cart__item__image" src="${item.image}" alt="${item.name}">
        <div class="shop__cart__item__info">
          <div class="shop__cart__item__name">${this.escapeHtml(item.name)}</div>
          <div class="shop__cart__item__price">$${item.price.toFixed(2)}</div>
          <div class="shop__cart__item__quantity">
            <button class="shop__cart__item__quantity__button" data-product-id="${item.id}" data-action="decrease">-</button>
            <span class="shop__cart__item__quantity__value">${item.quantity}</span>
            <button class="shop__cart__item__quantity__button" data-product-id="${item.id}" data-action="increase">+</button>
          </div>
          <button class="shop__cart__item__remove" data-product-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');

    if (cartTotalPrice) {
      cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    cartBody.querySelectorAll('.shop__cart__item__quantity__button').forEach(button => {
      button.addEventListener('click', () => {
        const productId = button.getAttribute('data-product-id');
        const action = button.getAttribute('data-action');
        this.updateQuantity(productId, action === 'increase' ? 1 : -1);
      });
    });

    cartBody.querySelectorAll('.shop__cart__item__remove').forEach(button => {
      button.addEventListener('click', () => {
        const productId = button.getAttribute('data-product-id');
        this.removeFromCart(productId);
      });
    });
  }

  openCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutTotalPrice = document.getElementById('checkoutTotalPrice');

    if (!checkoutModal) return;

    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (checkoutTotalPrice) {
      checkoutTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    checkoutModal.style.display = 'flex';
  }

  completeOrder() {
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmationOrderNumber = document.getElementById('confirmationOrderNumber');

    if (!confirmationModal) return;

    const orderNumber = 'SP' + Date.now().toString().slice(-8);
    if (confirmationOrderNumber) {
      confirmationOrderNumber.textContent = orderNumber;
    }

    confirmationModal.style.display = 'flex';
  }
}

const app = new App();
window.app = app;
document.documentElement.style.scrollBehavior = 'smooth';
document.addEventListener('visibilitychange', () => app.handleVisibilityChange());



