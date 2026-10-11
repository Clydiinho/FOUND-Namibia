import type Lenis from 'lenis';

let activeLenis: Lenis | null = null;

export const setGlobalLenis = (instance: Lenis | null) => {
  activeLenis = instance;
};

export const getGlobalLenis = (): Lenis | null => {
  return activeLenis;
};
