'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    const handleHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor-hover]')) {
        setIsHovering(true);
      }
    };

    const handleHoverEnd = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor-hover]')) {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <>
      {/* Dot */}
      <motion.div
        className="fixed top-0 left-0 size-1.5 rounded-full pointer-events-none z-[10000] mix-blend-difference bg-white hidden lg:block"
        animate={{
          x: position.x - 3,
          y: position.y - 3,
          scale: isHovering ? 0 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
      />
      {/* Ring */}
      <motion.div
        className="fixed top-0 left-0 size-10 border border-white rounded-full pointer-events-none z-[10000] mix-blend-difference hidden lg:block"
        animate={{
          x: position.x - 20,
          y: position.y - 20,
          scale: isHovering ? 1.3 : 0.8,
          opacity: isVisible ? (isHovering ? 1 : 0.4) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
      />
    </>
  );
}
