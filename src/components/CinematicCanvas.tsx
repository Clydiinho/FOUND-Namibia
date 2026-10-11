import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getGlobalLenis } from '../lenisStore';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface CinematicCanvasProps {
  videoSrc?: string;
}

interface SceneInfo {
  id: number;
  chapter: string;
  location: string;
  line1: string;
  line2: string;
  direction: 'left-to-right' | 'right-to-left';
  positionClass: string;
  // Progress timings along the master scrollable timeline (0.0 to 1.0)
  enterStart: number;
  settleStart: number;
  settleEnd: number;
  exitEnd: number;
  settledCenter: number;
  audioPath: string;
  audioDuration: number;
  holdSeconds: number; // Duration to linger in automatic Play mode
}

// 6 Scenic Chapters with accurate timings & unhurried pauses
const SCENE_CONFIG: SceneInfo[] = [
  {
    id: 1,
    chapter: '01',
    location: 'THE ORIGIN',
    line1: 'The world is bigger',
    line2: 'than you think.',
    direction: 'left-to-right',
    positionClass: 'left-6 md:left-16 bottom-24 md:bottom-32 max-w-2xl text-left',
    enterStart: 0.01,
    settleStart: 0.035,
    settleEnd: 0.075,
    exitEnd: 0.095,
    settledCenter: 0.055,
    audioPath: '/audio/narration-1.wav',
    audioDuration: 3.2,
    holdSeconds: 5.0,
  },
  {
    id: 2,
    chapter: '02',
    location: 'SOSSUSVLEI',
    line1: 'Come for the view.',
    line2: 'Leave with a story.',
    direction: 'right-to-left',
    positionClass: 'right-6 md:right-16 top-28 md:top-36 max-w-2xl ml-auto text-right',
    enterStart: 0.12,
    settleStart: 0.15,
    settleEnd: 0.22,
    exitEnd: 0.25,
    settledCenter: 0.185,
    audioPath: '/audio/narration-2.wav',
    audioDuration: 4.36,
    holdSeconds: 6.2,
  },
  {
    id: 3,
    chapter: '03',
    location: 'DEADVLEI',
    line1: 'Some places take your breath away.',
    line2: 'Others stay with you forever.',
    direction: 'left-to-right',
    positionClass: 'left-6 md:left-16 top-28 md:top-36 max-w-3xl text-left',
    enterStart: 0.28,
    settleStart: 0.32,
    settleEnd: 0.44,
    exitEnd: 0.48,
    settledCenter: 0.38,
    audioPath: '/audio/narration-3.wav',
    audioDuration: 6.16,
    holdSeconds: 8.2,
  },
  {
    id: 4,
    chapter: '04',
    location: 'NAMIB VASTNESS',
    line1: 'Lose yourself in the vastness.',
    line2: 'Discover what moves you.',
    direction: 'right-to-left',
    positionClass: 'right-6 md:right-16 bottom-24 md:bottom-32 max-w-3xl ml-auto text-right',
    enterStart: 0.51,
    settleStart: 0.55,
    settleEnd: 0.63,
    exitEnd: 0.67,
    settledCenter: 0.59,
    audioPath: '/audio/narration-4.wav',
    audioDuration: 5.28,
    holdSeconds: 7.2,
  },
  {
    id: 5,
    chapter: '05',
    location: 'SANDWICH HARBOUR',
    line1: 'Follow the road less travelled.',
    line2: 'Find the extraordinary.',
    direction: 'left-to-right',
    positionClass: 'left-6 md:left-16 bottom-24 md:bottom-32 max-w-2xl text-left',
    enterStart: 0.70,
    settleStart: 0.73,
    settleEnd: 0.80,
    exitEnd: 0.83,
    settledCenter: 0.765,
    audioPath: '/audio/narration-5.wav',
    audioDuration: 5.84,
    holdSeconds: 7.8,
  },
  {
    id: 6,
    chapter: '06',
    location: 'ETOSHA',
    line1: 'Get closer to the wild.',
    line2: 'Get closer to what matters.',
    direction: 'right-to-left',
    positionClass: 'right-6 md:right-16 top-28 md:top-36 max-w-2xl ml-auto text-right',
    enterStart: 0.85,
    settleStart: 0.875,
    settleEnd: 0.935,
    exitEnd: 0.955,
    settledCenter: 0.905,
    audioPath: '/audio/narration-6.wav',
    audioDuration: 5.76,
    // Generous Etosha hold: speech (5.76s) + 4.5s watering hole visual stillness = 10.3s
    holdSeconds: 10.3,
  },
];

const BRAND_REVEAL = {
  id: 7,
  location: 'GET FOUND',
  enterStart: 0.965,
  settleStart: 0.975,
  settleEnd: 1.00,
  settledCenter: 0.985,
  audioPath: '/audio/narration-7.wav',
  audioDuration: 1.72,
  holdSeconds: 5.5,
};

export const CinematicCanvas: React.FC<CinematicCanvasProps> = ({
  videoSrc = '/found%20namibia%20website%20bg2.webm',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // References for animated scene text elements
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const brandRevealRef = useRef<HTMLDivElement | null>(null);

  // Direct DOM references for media controller (avoids 60fps React re-renders while scrolling)
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressTextRef = useRef<HTMLSpanElement | null>(null);
  const chapterTextRef = useRef<HTMLSpanElement | null>(null);

  // UI state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);

  // Stable references for state accessible inside GSAP animation updates
  const isAudioEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  // Audio system state
  const audioMapRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const activeAudioIdRef = useRef<number | null>(null);
  const activeSceneIdRef = useRef<number | null>(null);
  const debounceAudioTimerRef = useRef<number | null>(null);

  // Timeline & Scroll coordinates
  const masterTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const scrollDistanceRef = useRef<number>(5400);
  const autoPlayTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const currentProgressRef = useRef<number>(0);

  // Preload and manage all 7 narration audio clips
  useEffect(() => {
    const map = new Map<number, HTMLAudioElement>();

    SCENE_CONFIG.forEach((s) => {
      const a = new Audio(s.audioPath);
      a.preload = 'auto';
      map.set(s.id, a);
    });

    const finalA = new Audio(BRAND_REVEAL.audioPath);
    finalA.preload = 'auto';
    map.set(7, finalA);

    audioMapRef.current = map;

    return () => {
      map.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
    };
  }, []);

  // Safe audio fade-out utility
  const fadeOutActiveAudio = useCallback((durationMs = 250) => {
    const activeId = activeAudioIdRef.current;
    if (activeId === null) return;

    const audio = audioMapRef.current.get(activeId);
    if (!audio || audio.paused) {
      activeAudioIdRef.current = null;
      return;
    }

    const startVol = audio.volume;
    const startT = performance.now();

    const fadeStep = () => {
      const elapsed = performance.now() - startT;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = Math.max(0, startVol * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        if (activeAudioIdRef.current === activeId) {
          activeAudioIdRef.current = null;
        }
      }
    };

    requestAnimationFrame(fadeStep);
  }, []);

  // Play narration clip for a specific scene
  const playNarration = useCallback(
    (sceneId: number) => {
      if (!isAudioEnabledRef.current) return;

      const audio = audioMapRef.current.get(sceneId);
      if (!audio) return;

      // If already playing this exact clip, don't interrupt
      if (activeAudioIdRef.current === sceneId && !audio.paused) {
        return;
      }

      // Fade out previous audio
      if (activeAudioIdRef.current !== null && activeAudioIdRef.current !== sceneId) {
        fadeOutActiveAudio(180);
      }

      audio.currentTime = 0;
      audio.volume = 1;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            activeAudioIdRef.current = sceneId;
          })
          .catch(() => {
            // Handled gracefully
          });
      }
    },
    [fadeOutActiveAudio]
  );

  // Update narration triggers based on scroll progress
  const updateNarrationState = useCallback(
    (progress: number) => {
      currentProgressRef.current = progress;

      // Update HUD progress bar directly (no React re-renders)
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
      }
      if (progressTextRef.current) {
        progressTextRef.current.textContent = `${Math.round(progress * 100)}%`;
      }

      // Check final brand reveal
      if (progress >= BRAND_REVEAL.enterStart) {
        if (chapterTextRef.current) {
          chapterTextRef.current.textContent = 'GET FOUND';
        }
        if (activeSceneIdRef.current !== 7) {
          activeSceneIdRef.current = 7;
          playNarration(7);
        }
        return;
      }

      // Check scenes 1 to 6
      let foundScene: SceneInfo | null = null;
      for (const scene of SCENE_CONFIG) {
        if (progress >= scene.enterStart && progress <= scene.exitEnd) {
          foundScene = scene;
          break;
        }
      }

      if (foundScene) {
        if (chapterTextRef.current) {
          chapterTextRef.current.textContent = `${foundScene.chapter} · ${foundScene.location}`;
        }

        // New scene entered (or scrolled backwards into it)
        if (activeSceneIdRef.current !== foundScene.id) {
          activeSceneIdRef.current = foundScene.id;

          if (debounceAudioTimerRef.current) {
            window.clearTimeout(debounceAudioTimerRef.current);
          }
          debounceAudioTimerRef.current = window.setTimeout(() => {
            if (activeSceneIdRef.current === foundScene!.id) {
              playNarration(foundScene!.id);
            }
          }, 80);
        }
      } else {
        // Between scenes: gracefully fade speech
        if (activeSceneIdRef.current !== null) {
          activeSceneIdRef.current = null;
          fadeOutActiveAudio(250);
        }
      }
    },
    [playNarration, fadeOutActiveAudio]
  );

  // Video loaded handler
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const dur = video.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
      setIsVideoReady(true);
    }
  }, []);

  // Check cached video metadata on mount
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 1 && video.duration && !isNaN(video.duration) && video.duration > 0) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // ignore
      }
      setIsVideoReady(true);
    } else {
      try {
        video.load();
      } catch {
        // ignore
      }
    }
  }, [videoSrc]);

  // Master GSAP ScrollTrigger timeline: Video scrubbing + Editorial Text Animations
  // Built ONCE when video is ready, perfectly stable across state changes
  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;

    if (!isVideoReady || !video || !section) return;

    const duration = video.duration || 35.0;
    const scrollDistance = Math.round(duration * 155); // ~5,400px of luxurious scroll distance
    scrollDistanceRef.current = scrollDistance;

    // Hardware-safe seeking mechanism
    let targetTime = 0;
    let pendingSeekTime: number | null = null;
    let rafId: number | null = null;

    const performSeek = () => {
      if (!video || !video.duration) return;

      if (video.seeking) {
        pendingSeekTime = targetTime;
        return;
      }

      // Clamp target time: ensure video stays at the final Etosha frame for progress >= 0.88
      const clamped = Math.max(0, Math.min(targetTime, video.duration - 0.05));
      if (Math.abs(video.currentTime - clamped) < 0.025) {
        return;
      }

      try {
        video.currentTime = clamped;
      } catch {
        // ignore
      }
    };

    const handleSeeked = () => {
      if (pendingSeekTime !== null) {
        const nextTime = pendingSeekTime;
        pendingSeekTime = null;
        targetTime = nextTime;
        performSeek();
      }
    };

    video.addEventListener('seeked', handleSeeked);

    const requestSeek = (time: number) => {
      targetTime = time;
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          performSeek();
        });
      }
    };

    // Ensure all scene texts and brand reveal start completely hidden before timeline starts
    sceneRefs.current.forEach((el, index) => {
      if (!el) return;
      const scene = SCENE_CONFIG[index];
      const fromX = scene.direction === 'left-to-right' ? -130 : 130;
      gsap.set(el, {
        autoAlpha: 0,
        xPercent: fromX,
        filter: 'blur(8px)',
      });
    });

    const brandEl = brandRevealRef.current;
    if (brandEl) {
      gsap.set(brandEl, {
        autoAlpha: 0,
        scale: 0.92,
        filter: 'blur(10px)',
      });
    }

    // Master ScrollTrigger timeline
    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: `+=${scrollDistance}`,
        pin: true,
        scrub: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          // Video scrub mapping:
          // Video plays from 0s to 35s across progress 0.0 to 0.88
          // From 0.88 to 1.00, it holds rock-solid on the final frame of Etosha
          const videoProgress = Math.min(1, p / 0.88);
          requestSeek(videoProgress * duration);

          updateNarrationState(p);
        },
      },
    });

    masterTimelineRef.current = masterTl;
    scrollTriggerRef.current = masterTl.scrollTrigger || null;

    // 1. Text Statement Animations (Scenes 1 - 6)
    SCENE_CONFIG.forEach((scene, index) => {
      const el = sceneRefs.current[index];
      if (!el) return;

      const flyInSpan = scene.settleStart - scene.enterStart;
      const flyOutSpan = scene.exitEnd - scene.settleEnd;
      const fromX = scene.direction === 'left-to-right' ? -130 : 130;
      const toX = scene.direction === 'left-to-right' ? 130 : -130;

      // Fly-in to settled viewpoint
      masterTl.fromTo(
        el,
        {
          autoAlpha: 0,
          xPercent: fromX,
          filter: 'blur(8px)',
        },
        {
          autoAlpha: 1,
          xPercent: 0,
          filter: 'blur(0px)',
          ease: 'power2.out',
          duration: flyInSpan,
          immediateRender: false,
        },
        scene.enterStart
      );

      // Accelerate out to opposite side
      masterTl.to(
        el,
        {
          autoAlpha: 0,
          xPercent: toX,
          filter: 'blur(8px)',
          ease: 'power2.in',
          duration: flyOutSpan,
        },
        scene.settleEnd
      );
    });

    // 2. Final Brand Reveal: FOUND Namibia & GET FOUND.
    if (brandEl) {
      masterTl.fromTo(
        brandEl,
        {
          autoAlpha: 0,
          scale: 0.92,
          filter: 'blur(10px)',
        },
        {
          autoAlpha: 1,
          scale: 1.0,
          filter: 'blur(0px)',
          ease: 'power3.out',
          duration: BRAND_REVEAL.settleStart - BRAND_REVEAL.enterStart,
          immediateRender: false,
        },
        BRAND_REVEAL.enterStart
      );
    }

    ScrollTrigger.refresh();

    return () => {
      video.removeEventListener('seeked', handleSeeked);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      masterTl.kill();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === section) {
          trigger.kill();
        }
      });
      masterTimelineRef.current = null;
      scrollTriggerRef.current = null;
    };
  }, [isVideoReady, updateNarrationState]);

  // Clean auto-play cancellation
  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimelineRef.current) {
      autoPlayTimelineRef.current.kill();
      autoPlayTimelineRef.current = null;
    }
    setIsAutoPlaying(false);
  }, []);

  // Listen for manual user interactions (wheel, touch, keyboard) to smoothly pause AutoPlay
  useEffect(() => {
    const handleManualScroll = () => {
      if (autoPlayTimelineRef.current) {
        stopAutoPlay();
      }
    };

    window.addEventListener('wheel', handleManualScroll, { passive: true });
    window.addEventListener('touchmove', handleManualScroll, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Space'].includes(e.code)) {
        handleManualScroll();
      }
    });

    return () => {
      window.removeEventListener('wheel', handleManualScroll);
      window.removeEventListener('touchmove', handleManualScroll);
    };
  }, [stopAutoPlay]);

  // Start or resume Automatic Play Mode
  const startAutoPlay = useCallback(() => {
    if (autoPlayTimelineRef.current) {
      autoPlayTimelineRef.current.kill();
    }

    setIsAutoPlaying(true);
    setIsJourneyComplete(false);
    setIsAudioEnabled(true);

    const scrollDist = scrollDistanceRef.current;
    let startP = currentProgressRef.current;

    // If near the very end, restart cleanly from 0
    if (startP >= 0.985) {
      startP = 0;
      const lenis = getGlobalLenis();
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    const autoTl = gsap.timeline({
      onComplete: () => {
        setIsAutoPlaying(false);
        setIsJourneyComplete(true);
      },
    });

    autoPlayTimelineRef.current = autoTl;

    // Sequence of key checkpoints through scenes and final brand reveal
    const journeyCheckpoints = [
      ...SCENE_CONFIG.map((s) => ({
        targetProgress: s.settledCenter,
        holdSeconds: s.holdSeconds,
      })),
      {
        targetProgress: BRAND_REVEAL.settledCenter,
        holdSeconds: BRAND_REVEAL.holdSeconds,
      },
      {
        targetProgress: 1.0,
        holdSeconds: 1.0,
      },
    ];

    const upcomingCheckpoints = journeyCheckpoints.filter(
      (cp) => cp.targetProgress > startP - 0.02
    );

    let fromProgress = startP;

    upcomingCheckpoints.forEach((cp) => {
      const delta = Math.max(0.01, cp.targetProgress - fromProgress);
      // Pacing: smooth gliding time between scenes (~2.2s - 3.5s)
      const travelTime = Math.max(2.0, delta * 24);

      const progressProxy = { p: fromProgress };

      // 1. Smoothly glide to the scene's settled viewpoint
      autoTl.to(progressProxy, {
        p: cp.targetProgress,
        duration: travelTime,
        ease: 'power1.inOut',
        onUpdate: () => {
          const targetY = progressProxy.p * scrollDist;
          const lenis = getGlobalLenis();
          if (lenis) {
            lenis.scrollTo(targetY, { immediate: true });
          } else {
            window.scrollTo(0, targetY);
          }
        },
      });

      // 2. Lingering hold: video and text settle, narration plays completely, followed by visual pause
      autoTl.to({}, { duration: cp.holdSeconds });

      fromProgress = cp.targetProgress;
    });
  }, []);

  // Toggle Play / Pause button
  const handleTogglePlay = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isAutoPlaying) {
        stopAutoPlay();
        // Pause active narration
        const activeId = activeAudioIdRef.current;
        if (activeId !== null) {
          const audio = audioMapRef.current.get(activeId);
          if (audio && !audio.paused) {
            audio.pause();
          }
        }
      } else {
        startAutoPlay();
      }
    },
    [isAutoPlaying, stopAutoPlay, startAutoPlay]
  );

  // Restart Journey from beginning
  const handleRestartJourney = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      stopAutoPlay();
      fadeOutActiveAudio(150);
      activeSceneIdRef.current = null;
      setIsJourneyComplete(false);

      const lenis = getGlobalLenis();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setTimeout(() => {
        startAutoPlay();
      }, 350);
    },
    [stopAutoPlay, fadeOutActiveAudio, startAutoPlay]
  );

  // Toggle Mute / Unmute
  const handleToggleAudio = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const next = !isAudioEnabled;
      setIsAudioEnabled(next);

      if (!next) {
        // Mute: stop audio immediately
        audioMapRef.current.forEach((a) => {
          a.pause();
          a.currentTime = 0;
        });
        activeAudioIdRef.current = null;
      } else {
        // Unmute: replay narration for active scene
        if (activeSceneIdRef.current !== null) {
          playNarration(activeSceneIdRef.current);
        }
      }
    },
    [isAudioEnabled, playNarration]
  );

  return (
    <div
      ref={sectionRef}
      className="relative w-screen h-screen overflow-hidden bg-black select-none"
      aria-label="FOUND Namibia Cinematic Journey"
    >
      {/* Edge-to-Edge WebM Video Canvas */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster="/poster.jpg"
        playsInline
        muted
        preload="auto"
        controls={false}
        autoPlay={false}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-cover object-center pointer-events-none select-none"
      >
        <source src="/found%20namibia%20website%20bg2.webm" type="video/webm" />
        <source src="/found namibia website bg2.webm" type="video/webm" />
      </video>

      {/* Atmospheric Vignette Overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/55 via-transparent to-black/75 z-10"
        aria-hidden="true"
      />

      {/* Editorial Scene Typography Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {SCENE_CONFIG.map((scene, index) => (
          <div
            key={scene.id}
            ref={(el) => {
              sceneRefs.current[index] = el;
            }}
            className={`absolute ${scene.positionClass} px-6 md:px-0 pointer-events-none opacity-0 invisible will-change-transform`}
          >
            {/* Subtle Chapter Marker */}
            <div className="text-[10px] sm:text-xs font-sans tracking-[0.35em] text-[#D8C7A8] uppercase mb-2 sm:mb-3 opacity-80 font-semibold">
              {scene.chapter} / {scene.location}
            </div>

            {/* Editorial Line 1 */}
            <div className="font-editorial italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white/90 leading-[1.1] tracking-normal drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
              {scene.line1}
            </div>

            {/* Editorial Line 2 (Oversized Cinematic Statement) */}
            <div className="font-editorial italic text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-[#FAF7EE] leading-[1.05] tracking-tight mt-1 sm:mt-2 drop-shadow-[0_6px_24px_rgba(0,0,0,0.95)]">
              {scene.line2}
            </div>
          </div>
        ))}

        {/* 7. Final Brand Reveal: FOUND Namibia & GET FOUND. */}
        <div
          ref={brandRevealRef}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-30 opacity-0 invisible will-change-transform"
        >
          {/* Brand Wordmark / Logo */}
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <span className="font-cinzel tracking-[0.35em] text-sm sm:text-base md:text-lg text-white font-semibold uppercase">
              FOUND
            </span>
            <span className="text-[10px] sm:text-xs tracking-[0.45em] text-[#CBB99E] font-medium uppercase">
              NAMIBIA
            </span>
          </div>

          {/* GET FOUND. Statement */}
          <h1 className="font-editorial italic text-5xl sm:text-7xl md:text-9xl text-[#FAF7EE] tracking-wide leading-none drop-shadow-[0_12px_40px_rgba(0,0,0,0.95)]">
            GET FOUND.
          </h1>

          {/* Understated Gold Hairline */}
          <div className="w-16 sm:w-24 h-px bg-[#D4AF37]/60 mt-6 sm:mt-8" />
        </div>
      </div>

      {/* Floating Cinematic Media Dock */}
      <aside
        aria-label="Cinematic Experience Controls"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-xl pointer-events-auto"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 rounded-full bg-[#0a0a0c]/85 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] transition-all">
          {/* Play / Pause / Replay Button */}
          <div className="flex items-center gap-2">
            {isJourneyComplete ? (
              <button
                type="button"
                onClick={handleRestartJourney}
                className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] text-[#121214] text-xs font-semibold tracking-wider uppercase hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] outline-none focus-visible:ring-2 focus-visible:ring-white"
                title="Replay Cinematic Journey"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replay</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`group flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-md outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  isAutoPlaying
                    ? 'bg-[#D8C7A8] text-[#121214] shadow-[0_0_20px_rgba(216,199,168,0.4)] hover:bg-[#FAF4E8]'
                    : 'bg-[#FAF7F2] text-[#121214] hover:bg-white hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title={isAutoPlaying ? 'Pause Journey' : 'Play Cinematic Journey'}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play Journey</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Chapter & Progress Bar Indicator */}
          <div className="flex-1 flex flex-col justify-center px-2 sm:px-4 min-w-0">
            <div className="flex items-center justify-between text-[10px] tracking-widest uppercase text-neutral-400 font-sans mb-1 truncate">
              <span
                ref={chapterTextRef}
                className="truncate text-neutral-300 font-medium"
              >
                01 · THE ORIGIN
              </span>
              <span
                ref={progressTextRef}
                className="ml-2 tabular-nums text-neutral-500 font-mono"
              >
                0%
              </span>
            </div>
            {/* Visual Progress Bar Track */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-[#D8C7A8] to-white rounded-full transition-all duration-75"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* Audio Mute/Unmute Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className="flex items-center justify-center w-8 h-8 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            title={isAudioEnabled ? 'Mute Voice-over' : 'Unmute Voice-over'}
            aria-label={isAudioEnabled ? 'Mute voice-over' : 'Unmute voice-over'}
          >
            {isAudioEnabled ? (
              <Volume2 className="w-4 h-4 text-[#D8C7A8]" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            )}
          </button>
        </div>
      </aside>
    </div>
  );
};
