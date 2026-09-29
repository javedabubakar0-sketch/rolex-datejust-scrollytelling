/**
 * ROLEX OYSTER PERPETUAL DATEJUST — HIGH-PERFORMANCE SCROLLYTELLING ENGINE
 * 
 * Features:
 * - 240-Frame Canvas Preloader & Dynamic Buffer
 * - Sub-pixel LERP Scroll Dampening for Buttery-Smooth Animation
 * - Synchronized Scrollytelling Story Chapters & Exploded HUD
 * - Pure Web Audio API Swiss Escapement Synthesis (28,800 VPH)
 * - Live Mechanical Sweep Clock & Datejust Atelier Configurator
 */

(function () {
  'use strict';

  // --- CONFIGURATION CONSTANTS ---
  const TOTAL_FRAMES = 240;
  const FRAME_BASE_PATH = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';
  const LERP_FACTOR = 0.12; // Smoothness factor for scroll dampening

  // --- APPLICATION STATE ---
  const state = {
    frames: [],
    loadedFramesCount: 0,
    currentFrameFloat: 0,
    targetFrameFloat: 0,
    renderedFrameIndex: -1,
    isPreloaded: false,
    isAutoSpinning: false,
    autoSpinSpeed: 0.45,
    autoSpinDirection: 1,
    soundEnabled: false,
    activeChapter: 1,
    isScrubbing: false,
    clockMode: 'live', // 'live' or 'demo' (10:10:31)
    lastTickTime: 0,
    config: {
      size: '36',
      dial: 'black',
      dialName: 'Bright Black Sunray',
      bezel: 'fluted',
      bracelet: 'jubilee',
      price: '$8,950'
    }
  };

  // --- DOM REFERENCES ---
  const DOM = {
    body: document.body,
    header: document.getElementById('site-header'),
    preloader: document.getElementById('preloader'),
    preloaderFill: document.getElementById('preloader-fill'),
    preloaderPercentage: document.getElementById('preloader-percentage'),
    canvas: document.getElementById('watch-canvas'),
    ctx: null,
    heroTrack: document.getElementById('hero-container'),
    heroStage: document.getElementById('hero-sticky-stage'),
    storyChapters: document.querySelectorAll('.story-chapter'),
    explodedHud: document.getElementById('exploded-hud'),
    hudFrameVal: document.getElementById('hud-frame-val'),
    hudPlayBtn: document.getElementById('hud-play-btn'),
    playIcon: document.getElementById('play-icon'),
    pauseIcon: document.getElementById('pause-icon'),
    playBtnText: document.getElementById('play-btn-text'),
    scrubberContainer: document.getElementById('scrubber-container'),
    scrubberFill: document.getElementById('scrubber-fill'),
    scrubberThumb: document.getElementById('scrubber-thumb'),
    chapterMarkers: document.querySelectorAll('.chapter-markers .marker'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    mobileToggle: document.getElementById('mobile-toggle'),
    mobileMenu: document.getElementById('mobile-menu'),
    // Movement & Clock
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    hourHand: document.getElementById('hour-hand'),
    minuteHand: document.getElementById('minute-hand'),
    secondHand: document.getElementById('second-hand'),
    clockDateNum: document.getElementById('clock-date-num'),
    clockModeLabel: document.getElementById('clock-mode-label'),
    clockSyncBtn: document.getElementById('clock-sync-btn'),
    clockSoundTrigger: document.getElementById('clock-sound-trigger'),
    // Configurator
    sizeOptions: document.getElementById('size-options'),
    dialSwatches: document.getElementById('dial-swatches'),
    bezelOptions: document.getElementById('bezel-options'),
    braceletOptions: document.getElementById('bracelet-options'),
    selectedDialName: document.getElementById('selected-dial-name'),
    cfgRefCode: document.getElementById('cfg-ref-code'),
    cfgSummaryText: document.getElementById('cfg-summary-text'),
    cfgPriceDisplay: document.getElementById('cfg-price-display'),
    configWatchImg: document.getElementById('config-watch-img'),
    // Booking Modal
    bookingModal: document.getElementById('booking-modal'),
    selectedConfigInput: document.getElementById('selected-configuration'),
    bookingForm: document.getElementById('booking-form'),
    bookingSuccessMsg: document.getElementById('booking-success-msg'),
    bookingRefCode: document.getElementById('booking-ref-code')
  };

  if (DOM.canvas) {
    DOM.ctx = DOM.canvas.getContext('2d', { alpha: false });
  }

  // --- WEB AUDIO API: SYNTHESIZED MECHANICAL ESCAPEMENT (28,800 VPH) ---
  let audioCtx = null;
  let isTock = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playEscapementTick(intensity = 1.0) {
    if (!state.soundEnabled || !audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      // High-pass filtered noise burst for jewel pallet strike + resonant tone
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // Alternate slightly between "tick" (3400Hz) and "tock" (2900Hz)
      const baseFreq = isTock ? 2900 : 3400;
      isTock = !isTock;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq, now);
      filter.Q.setValueAtTime(12, now);

      gain.gain.setValueAtTime(0.08 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // Audio fallback silent
    }
  }

  // --- FRAME PRELOADING SYSTEM ---
  function preloadFrames() {
    const pad = (num) => String(num).padStart(3, '0');
    let loadedCount = 0;

    // Allocate array
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      state.frames.push({
        img: null,
        loaded: false
      });
    }

    // High Priority: Load frame 1 first to display immediately
    const firstImg = new Image();
    firstImg.src = `${FRAME_BASE_PATH}001${FRAME_EXT}`;
    firstImg.onload = () => {
      state.frames[0] = { img: firstImg, loaded: true };
      drawFrame(0);
    };

    // Load all 240 frames concurrently
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameIndex = i - 1;
      img.src = `${FRAME_BASE_PATH}${pad(i)}${FRAME_EXT}`;
      
      img.onload = () => {
        state.frames[frameIndex] = { img, loaded: true };
        loadedCount++;
        state.loadedFramesCount = loadedCount;
        
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (DOM.preloaderFill) DOM.preloaderFill.style.width = `${percent}%`;
        if (DOM.preloaderPercentage) DOM.preloaderPercentage.textContent = `${percent}%`;

        // If at least 25 frames are loaded or all are loaded, allow user entry
        if (loadedCount >= 25 && !state.isPreloaded) {
          state.isPreloaded = true;
          dismissPreloader();
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= TOTAL_FRAMES && !state.isPreloaded) {
          state.isPreloaded = true;
          dismissPreloader();
        }
      };
    }
  }

  function dismissPreloader() {
    setTimeout(() => {
      if (DOM.preloader) {
        DOM.preloader.classList.add('fade-out');
        DOM.body.classList.remove('loading-state');
      }
      resizeCanvas();
      drawFrame(0);
    }, 400);
  }

  // --- HIGH-DPI CANVAS RENDERING ---
  function resizeCanvas() {
    if (!DOM.canvas || !DOM.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = DOM.heroStage.getBoundingClientRect();

    DOM.canvas.width = rect.width * dpr;
    DOM.canvas.height = rect.height * dpr;

    // Reset render index to force redraw
    state.renderedFrameIndex = -1;
    drawFrame(Math.floor(state.currentFrameFloat));
  }

  function drawFrame(targetIndex) {
    if (!DOM.ctx || !DOM.canvas) return;

    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, targetIndex));
    
    // Find closest loaded frame if this exact one is still fetching
    let frameObj = state.frames[clampedIndex];
    let actualImg = null;

    if (frameObj && frameObj.loaded) {
      actualImg = frameObj.img;
    } else {
      // Look backwards for nearest loaded frame
      for (let i = clampedIndex; i >= 0; i--) {
        if (state.frames[i] && state.frames[i].loaded) {
          actualImg = state.frames[i].img;
          break;
        }
      }
      // Look forwards if none backwards
      if (!actualImg) {
        for (let i = clampedIndex + 1; i < TOTAL_FRAMES; i++) {
          if (state.frames[i] && state.frames[i].loaded) {
            actualImg = state.frames[i].img;
            break;
          }
        }
      }
    }

    if (!actualImg) return; // Wait for initial frame

    const cw = DOM.canvas.width;
    const ch = DOM.canvas.height;
    const iw = actualImg.naturalWidth || 1280;
    const ih = actualImg.naturalHeight || 720;

    // Preserve aspect ratio: scale to contain with slight upscale for presence
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    // Render image
    DOM.ctx.drawImage(actualImg, 0, 0, iw, ih, dx, dy, dw, dh);
    state.renderedFrameIndex = clampedIndex;

    // Update HUD Frame Counter
    if (DOM.hudFrameVal) {
      DOM.hudFrameVal.textContent = String(clampedIndex + 1).padStart(3, '0');
    }
  }

  // --- SCROLL ANIMATION & LERP LOOP ---
  function computeScrollProgress() {
    if (!DOM.heroTrack) return 0;
    const trackRect = DOM.heroTrack.getBoundingClientRect();
    const scrollDistance = DOM.heroTrack.offsetHeight - window.innerHeight;
    
    if (scrollDistance <= 0) return 0;
    const scrolled = -trackRect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollDistance));
    return progress;
  }

  function updateScrollytelling(progress) {
    // 4 Chapters: 0-0.24, 0.25-0.49, 0.50-0.74, 0.75-1.0
    let activePhase = 1;
    if (progress < 0.25) {
      activePhase = 1;
    } else if (progress < 0.50) {
      activePhase = 2;
    } else if (progress < 0.75) {
      activePhase = 3;
    } else {
      activePhase = 4;
    }

    if (activePhase !== state.activeChapter) {
      state.activeChapter = activePhase;
      DOM.storyChapters.forEach((chapter) => {
        const phase = parseInt(chapter.getAttribute('data-phase'), 10);
        chapter.classList.toggle('active', phase === activePhase);
      });
    }

    // Toggle Exploded HUD Hotspots during Chapter 4 (Phase 4)
    if (DOM.explodedHud) {
      DOM.explodedHud.classList.toggle('visible', progress >= 0.78);
    }

    // Update Scrubber Fill & Thumb
    const percent = progress * 100;
    if (DOM.scrubberFill) DOM.scrubberFill.style.width = `${percent}%`;
    if (DOM.scrubberThumb) DOM.scrubberThumb.style.left = `${percent}%`;

    // Update Chapter Markers
    DOM.chapterMarkers.forEach((marker) => {
      const step = parseFloat(marker.getAttribute('data-step'));
      marker.classList.toggle('active', progress >= step - 0.1 && progress <= step + 0.25);
    });
  }

  let lastFrameStep = 0;

  function animationLoop() {
    // 1. If auto-spin is enabled, increment targetFrameFloat smoothly
    if (state.isAutoSpinning) {
      state.targetFrameFloat += state.autoSpinSpeed * state.autoSpinDirection;
      if (state.targetFrameFloat >= TOTAL_FRAMES - 1) {
        state.targetFrameFloat = TOTAL_FRAMES - 1;
        state.autoSpinDirection = -1; // smooth ping-pong rotation
      } else if (state.targetFrameFloat <= 0) {
        state.targetFrameFloat = 0;
        state.autoSpinDirection = 1;
      }
      // Sync scroll bar visually
      const virtualProgress = state.targetFrameFloat / (TOTAL_FRAMES - 1);
      updateScrollytelling(virtualProgress);
    } else if (!state.isScrubbing) {
      // 2. Normal scroll-driven mode
      const progress = computeScrollProgress();
      state.targetFrameFloat = progress * (TOTAL_FRAMES - 1);
      updateScrollytelling(progress);
    }

    // 3. Apply LERP for silk-smooth interpolation
    const diff = state.targetFrameFloat - state.currentFrameFloat;
    if (Math.abs(diff) > 0.001) {
      state.currentFrameFloat += diff * LERP_FACTOR;
    } else {
      state.currentFrameFloat = state.targetFrameFloat;
    }

    const targetIndex = Math.round(state.currentFrameFloat);
    if (targetIndex !== state.renderedFrameIndex) {
      drawFrame(targetIndex);

      // Play escapement tick on frame change if scrolling actively
      if (Math.abs(targetIndex - lastFrameStep) >= 2) {
        lastFrameStep = targetIndex;
        playEscapementTick(0.6);
      }
    }

    requestAnimationFrame(animationLoop);
  }

  // --- SCRUBBER TIMELINE CONTROLS ---
  function setupScrubber() {
    if (!DOM.scrubberContainer) return;

    function handleScrub(e) {
      const rect = DOM.scrubberContainer.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

      state.isAutoSpinning = false;
      updatePlayButtonUI();

      // Scroll window to matching position
      const scrollDistance = DOM.heroTrack.offsetHeight - window.innerHeight;
      const targetScroll = DOM.heroTrack.offsetTop + ratio * scrollDistance;
      window.scrollTo({ top: targetScroll, behavior: 'auto' });

      state.targetFrameFloat = ratio * (TOTAL_FRAMES - 1);
    }

    DOM.scrubberContainer.addEventListener('mousedown', (e) => {
      state.isScrubbing = true;
      handleScrub(e);
      initAudio();
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isScrubbing) handleScrub(e);
    });

    window.addEventListener('mouseup', () => {
      state.isScrubbing = false;
    });

    // Touch support for mobile
    DOM.scrubberContainer.addEventListener('touchstart', (e) => {
      state.isScrubbing = true;
      handleScrub(e);
      initAudio();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (state.isScrubbing) handleScrub(e);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      state.isScrubbing = false;
    });

    // Chapter Marker Jump Clicks
    DOM.chapterMarkers.forEach((marker) => {
      marker.addEventListener('click', () => {
        const step = parseFloat(marker.getAttribute('data-step'));
        const scrollDistance = DOM.heroTrack.offsetHeight - window.innerHeight;
        const targetScroll = DOM.heroTrack.offsetTop + step * scrollDistance;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        initAudio();
      });
    });
  }

  // --- AUTO SPIN CONTROL ---
  function updatePlayButtonUI() {
    if (!DOM.playIcon || !DOM.pauseIcon || !DOM.playBtnText) return;
    if (state.isAutoSpinning) {
      DOM.playIcon.classList.add('hidden');
      DOM.pauseIcon.classList.remove('hidden');
      DOM.playBtnText.textContent = 'PAUSE';
    } else {
      DOM.playIcon.classList.remove('hidden');
      DOM.pauseIcon.classList.add('hidden');
      DOM.playBtnText.textContent = 'AUTO SPIN';
    }
  }

  function setupAutoSpin() {
    if (!DOM.hudPlayBtn) return;
    DOM.hudPlayBtn.addEventListener('click', () => {
      state.isAutoSpinning = !state.isAutoSpinning;
      updatePlayButtonUI();
      initAudio();
    });
  }

  // --- AUDIO TOGGLE ---
  function setupAudioToggle() {
    if (!DOM.audioToggleBtn) return;

    DOM.audioToggleBtn.addEventListener('click', () => {
      initAudio();
      state.soundEnabled = !state.soundEnabled;

      const soundOn = DOM.audioToggleBtn.querySelector('.sound-on');
      const soundOff = DOM.audioToggleBtn.querySelector('.sound-off');

      if (state.soundEnabled) {
        soundOn.classList.remove('hidden');
        soundOff.classList.add('hidden');
        DOM.audioToggleBtn.classList.add('active');
        playEscapementTick(1.0);
      } else {
        soundOn.classList.add('hidden');
        soundOff.classList.remove('hidden');
        DOM.audioToggleBtn.classList.remove('active');
      }
    });

    // Simulator listen button
    if (DOM.clockSoundTrigger) {
      DOM.clockSoundTrigger.addEventListener('click', () => {
        initAudio();
        state.soundEnabled = true;
        const soundOn = DOM.audioToggleBtn.querySelector('.sound-on');
        const soundOff = DOM.audioToggleBtn.querySelector('.sound-off');
        soundOn.classList.remove('hidden');
        soundOff.classList.add('hidden');
        DOM.audioToggleBtn.classList.add('active');
        playEscapementTick(1.0);
      });
    }
  }

  // --- HEADER SCROLL DETECTOR ---
  function setupHeaderScroll() {
    window.addEventListener('scroll', () => {
      if (DOM.header) {
        DOM.header.classList.toggle('scrolled', window.scrollY > 80);
      }
    }, { passive: true });
  }

  // --- MOVEMENT TABS ---
  function setupMovementTabs() {
    DOM.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        DOM.tabBtns.forEach((b) => b.classList.remove('active'));
        DOM.tabContents.forEach((c) => c.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-tab');
        const targetContent = document.getElementById(`tab-${tabKey}`);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  // --- LIVE CHRONOMETER CLOCK ENGINE (28,800 VPH SIMULATED SWEEP) ---
  function setupLiveClock() {
    function tickClock() {
      let now = new Date();
      let hours = now.getHours() % 12;
      let minutes = now.getMinutes();
      let seconds = now.getSeconds();
      let millis = now.getMilliseconds();

      if (state.clockMode === 'demo') {
        // Catalogue 10:10:31
        hours = 10;
        minutes = 10;
        seconds = 31;
        millis = 0;
      }

      // Smooth mechanical 8-beats-per-second continuous sweep
      // (Each beat is 1/8 sec = 125ms)
      const fractionalSeconds = seconds + millis / 1000;
      const secondDeg = fractionalSeconds * 6; // 360 / 60
      const minuteDeg = (minutes + fractionalSeconds / 60) * 6;
      const hourDeg = (hours + minutes / 60) * 30; // 360 / 12

      if (DOM.secondHand) DOM.secondHand.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
      if (DOM.minuteHand) DOM.minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
      if (DOM.hourHand) DOM.hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;

      // Date update
      if (DOM.clockDateNum) {
        DOM.clockDateNum.textContent = String(now.getDate());
      }

      // Audio tick rate (4Hz / 8 ticks per sec if sound active)
      if (state.soundEnabled && state.clockMode === 'live') {
        const currentBeat = Math.floor(millis / 125);
        if (currentBeat !== state.lastTickTime) {
          state.lastTickTime = currentBeat;
          playEscapementTick(0.3);
        }
      }

      requestAnimationFrame(tickClock);
    }

    if (DOM.clockSyncBtn) {
      DOM.clockSyncBtn.addEventListener('click', () => {
        if (state.clockMode === 'live') {
          state.clockMode = 'demo';
          DOM.clockSyncBtn.textContent = 'Sync to Live Time';
          if (DOM.clockModeLabel) DOM.clockModeLabel.textContent = 'OFFICIAL CATALOGUE TIME (10:10:31)';
        } else {
          state.clockMode = 'live';
          DOM.clockSyncBtn.textContent = 'Reset to 10:10:31';
          if (DOM.clockModeLabel) DOM.clockModeLabel.textContent = 'LIVE SWISS ESCAPEMENT (8 BEATS/SEC)';
        }
      });
    }

    requestAnimationFrame(tickClock);
  }

  // --- THE DATEJUST CONFIGURATOR ---
  function setupConfigurator() {
    function updateConfigPreview() {
      // Generate reference code
      // 36mm: 126234, 41mm: 126334
      const baseRef = state.config.size === '36' ? '126234' : '126334';
      const dialCodeMap = {
        black: '0015',
        green: '0051',
        blue: '0027',
        slate: '0032',
        gold: '0044'
      };
      const dialCode = dialCodeMap[state.config.dial] || '0015';
      const fullRef = `M${baseRef}-${dialCode}`;

      if (DOM.cfgRefCode) DOM.cfgRefCode.textContent = fullRef;
      
      const summary = `Oyster, ${state.config.size} mm, ${state.config.dialName}, ${state.config.bezel === 'fluted' ? 'Fluted White Gold Bezel' : 'Smooth Steel Bezel'}, ${state.config.bracelet === 'jubilee' ? 'Jubilee Bracelet' : 'Oyster Bracelet'}`;
      if (DOM.cfgSummaryText) DOM.cfgSummaryText.textContent = summary;
      if (DOM.cfgPriceDisplay) DOM.cfgPriceDisplay.textContent = `${state.config.price}*`;

      // Update input in booking modal
      if (DOM.selectedConfigInput) {
        DOM.selectedConfigInput.value = `Datejust ${state.config.size}, ${state.config.dialName} (${fullRef})`;
      }

      // Subtle feedback animation on preview image
      if (DOM.configWatchImg) {
        DOM.configWatchImg.style.transform = 'scale(0.97)';
        setTimeout(() => {
          DOM.configWatchImg.style.transform = 'scale(1)';
        }, 150);
      }
    }

    // Size option pills
    if (DOM.sizeOptions) {
      DOM.sizeOptions.querySelectorAll('.pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          DOM.sizeOptions.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.config.size = btn.getAttribute('data-size');
          state.config.price = btn.getAttribute('data-price');
          updateConfigPreview();
        });
      });
    }

    // Dial swatches
    if (DOM.dialSwatches) {
      DOM.dialSwatches.querySelectorAll('.swatch-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          DOM.dialSwatches.querySelectorAll('.swatch-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.config.dial = btn.getAttribute('data-dial');
          state.config.dialName = btn.getAttribute('data-name');
          if (DOM.selectedDialName) DOM.selectedDialName.textContent = state.config.dialName;
          updateConfigPreview();
        });
      });
    }

    // Bezel option pills
    if (DOM.bezelOptions) {
      DOM.bezelOptions.querySelectorAll('.pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          DOM.bezelOptions.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.config.bezel = btn.getAttribute('data-bezel');
          updateConfigPreview();
        });
      });
    }

    // Bracelet option pills
    if (DOM.braceletOptions) {
      DOM.braceletOptions.querySelectorAll('.pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          DOM.braceletOptions.querySelectorAll('.pill-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          state.config.bracelet = btn.getAttribute('data-bracelet');
          updateConfigPreview();
        });
      });
    }
  }

  // --- MOBILE MENU ---
  function setupMobileMenu() {
    if (DOM.mobileToggle && DOM.mobileMenu) {
      DOM.mobileToggle.addEventListener('click', () => {
        DOM.mobileMenu.classList.toggle('open');
      });
    }
  }

  window.closeMobileMenu = function () {
    if (DOM.mobileMenu) DOM.mobileMenu.classList.remove('open');
  };

  // --- VIP BOOKING MODAL ---
  window.openBookingModal = function () {
    if (DOM.bookingModal) {
      DOM.bookingModal.classList.add('open');
      DOM.bookingModal.setAttribute('aria-hidden', 'false');
    }
  };

  window.openBookingWithConfig = function () {
    window.openBookingModal();
  };

  window.closeBookingModal = function () {
    if (DOM.bookingModal) {
      DOM.bookingModal.classList.remove('open');
      DOM.bookingModal.setAttribute('aria-hidden', 'true');
    }
  };

  window.handleBookingSubmit = function (e) {
    e.preventDefault();
    const randomCode = `RLX-${Math.floor(10000 + Math.random() * 90000)}-GE`;
    if (DOM.bookingRefCode) DOM.bookingRefCode.textContent = randomCode;
    if (DOM.bookingSuccessMsg) DOM.bookingSuccessMsg.classList.remove('hidden');

    const submitBtn = document.getElementById('submit-booking-btn');
    if (submitBtn) {
      submitBtn.textContent = 'Consultation Registered ✓';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
    }
  };

  // Close modal on click outside
  if (DOM.bookingModal) {
    DOM.bookingModal.addEventListener('click', (e) => {
      if (e.target === DOM.bookingModal) {
        window.closeBookingModal();
      }
    });
  }

  // --- INITIALIZATION ---
  function init() {
    window.addEventListener('resize', resizeCanvas);
    setupHeaderScroll();
    setupScrubber();
    setupAutoSpin();
    setupAudioToggle();
    setupMovementTabs();
    setupLiveClock();
    setupConfigurator();
    setupMobileMenu();

    // Start loading frames and run animation loop
    preloadFrames();
    requestAnimationFrame(animationLoop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
