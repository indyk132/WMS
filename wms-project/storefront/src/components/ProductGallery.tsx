/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, ShieldAlert } from 'lucide-react';

interface ProductGalleryProps {
  primaryImage: string;
  name: string;
}

export default function ProductGallery({ primaryImage, name }: ProductGalleryProps) {
  // Generate multi-images dynamically on base photo for premium rendering
  const images = [
    primaryImage,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomMode, setZoomMode] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCoords({ x, y });
  };

  return (
    <div className="flex flex-col gap-4" id="gallery-root">
      
      {/* Upper Active Photo viewport */}
      <div className="relative aspect-[4/5] bg-zinc-950 border border-zinc-800 overflow-hidden group select-none">
        
        {/* Carousel buttons */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/80 hover:bg-black text-zinc-300 hover:text-white rounded-none border border-zinc-800 z-10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={16} />
        </button>
        
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/80 hover:bg-black text-zinc-300 hover:text-white rounded-none border border-zinc-800 z-10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={16} />
        </button>

        {/* Dynamic Image Canvas (Adaptive Zoom) */}
        <div
          onMouseEnter={() => setZoomMode(true)}
          onMouseLeave={() => setZoomMode(false)}
          onMouseMove={handleMouseMove}
          className="w-full h-full cursor-zoom-in overflow-hidden relative"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={images[activeIndex]}
              alt={`${name} preview ${activeIndex + 1}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-transform duration-100"
              style={{
                transformOrigin: `${coords.x}% ${coords.y}%`,
                transform: zoomMode ? 'scale(2.2)' : 'scale(1)'
              }}
            />
          </AnimatePresence>
        </div>

        {/* Floating image schema indicator */}
        <div className="absolute bottom-3 right-3 bg-black/90 border border-zinc-800 text-[9px] font-mono text-zinc-400 px-2 py-1 tracking-wider pointer-events-none">
          Zdjęcie {activeIndex + 1} z {images.length}
        </div>

        <button className="absolute top-3 right-3 p-2 bg-black/80 border border-zinc-800 text-zinc-400 hover:text-white rounded-none pointer-events-none">
          <Maximize2 size={12} />
        </button>
      </div>

      {/* Grid Thumbnail dock navigation */}
      <div className="grid grid-cols-4 gap-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`aspect-square bg-zinc-950 border overflow-hidden relative cursor-pointer group transition-all duration-300 ${
              activeIndex === idx
                ? 'border-zinc-300 shadow-lg'
                : 'border-zinc-900 opacity-60 hover:opacity-100 hover:border-zinc-700'
            }`}
          >
            <img
              src={img}
              alt={`${name} thumb ${idx}`}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
            {/* Tiny numbering indicator */}
            <div className="absolute bottom-1 right-1 bg-black/85 px-1 py-0.2 text-[8px] font-mono text-zinc-500 rounded-none border border-zinc-900">
              0{idx + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
