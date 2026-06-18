/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Category } from '../types';

interface CategoryCardProps {
  category: Category;
  onSelect: (categoryName: string) => void;
  isSelected: boolean;
}

export default function CategoryCard({ category, onSelect, isSelected }: CategoryCardProps) {
  const cleanName = category.name.replace(/{{category\.name}}\s*/, '').trim();

  // Helper to format Polish product counts nicely
  const getProductCountText = (text: string) => {
    const match = text.match(/(\d+)/);
    if (!match) return text;
    
    const count = parseInt(match[1], 10);
    if (count === 1) return "1 produkt";
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
      return `${count} produkty`;
    }
    return `${count} produktów`;
  };

  return (
    <motion.div
      id={`cat-card-${category.id}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(cleanName)}
      className={`relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 group ${
        isSelected
          ? 'border-white ring-1 ring-white shadow-xl'
          : 'border-zinc-800/80 hover:border-zinc-600'
      }`}
    >
      {/* Background Image */}
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover filter brightness-[0.5] group-hover:scale-105 transition-transform duration-700 select-none"
        referrerPolicy="no-referrer"
      />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      
      {/* Selection Dot */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-white shadow-sm shadow-black" />
      )}

      {/* Bottom Text Overlaid */}
      <div className="absolute bottom-4 left-4 right-4">
        <h4 className="text-base font-bold text-white tracking-wide">
          {category.name}
        </h4>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          {getProductCountText(category.productCount)}
        </p>
      </div>
    </motion.div>
  );
}
