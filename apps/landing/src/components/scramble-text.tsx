'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

const GLYPHS = '!@#$%^&*()_+-=<>?/\\[]{}Xx';

interface ScrambleTextProps {
  text: string;
  className?: string;
  delayMs?: number;
  duration?: number;
}

function runScrambleAnimation(
  text: string,
  duration: number,
  setDisplayText: (text: string) => void,
  onComplete?: () => void,
): gsap.core.Tween {
  const lockedIndices = new Set<number>();
  const finalChars = text.split('');
  const totalChars = finalChars.length;
  const scrambleObj = { progress: 0 };

  return gsap.to(scrambleObj, {
    progress: 1,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      const numLocked = Math.floor(scrambleObj.progress * totalChars);
      for (let i = 0; i < numLocked; i++) {
        lockedIndices.add(i);
      }
      const newDisplay = finalChars
        .map((char, i) => {
          if (lockedIndices.has(i)) return char;
          if (char === ' ') return ' ';
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      setDisplayText(newDisplay);
    },
    onComplete: () => {
      setDisplayText(text);
      onComplete?.();
    },
  });
}

export function ScrambleText({ text, className, delayMs = 0, duration = 0.9 }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const scrambledStart = text
      .split('')
      .map((c) => (c === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join('');
    setDisplayText(scrambledStart);

    const timeout = setTimeout(() => {
      runScrambleAnimation(text, duration, setDisplayText);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [text, delayMs, duration]);

  return <span className={className}>{displayText}</span>;
}
