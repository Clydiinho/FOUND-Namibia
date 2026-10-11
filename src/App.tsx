/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navigation } from './components/Navigation';
import { CinematicCanvas } from './components/CinematicCanvas';
import { setGlobalLenis } from './lenisStore';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;
    setGlobalLenis(lenis);

    // 2. Synchronize Lenis scroll updates with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 3. Official GSAP ticker integration (Lenis expects milliseconds, GSAP ticker passes seconds)
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    // 4. Disable GSAP lag smoothing to keep ticks in tight lockstep with Lenis during scrolling
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
      setGlobalLenis(null);
    };
  }, []);

  const handleScrollToTop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black text-white">
      {/* Floating Glassmorphism Pill Navigation */}
      <Navigation onScrollToTop={handleScrollToTop} />

      {/* Main Content with Pinned Cinematic Canvas */}
      <main id="top" className="relative w-full">
        {/* Cinematic Scroll-Controlled Video Section */}
        <CinematicCanvas videoSrc="/found%20namibia%20website%20bg2.webm" />

        {/* Continuation section: demonstrates normal page scrolling resumes after the video */}
        <section
          aria-label="Continuation Section"
          className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center p-8 text-neutral-500 text-xs tracking-widest uppercase select-none"
        >
          <div className="w-12 h-px bg-white/15 mb-4" />
          <span className="opacity-50">FOUND NAMIBIA</span>
        </section>
      </main>
    </div>
  );
}
