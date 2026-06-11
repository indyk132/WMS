/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Layers } from 'lucide-react';
import { Category } from '../types';

interface CategoryCardProps {
  key?: string;
  category: Category;
  onSelect: (categoryName: string) => void;
  isSelected: boolean;
}

export default function CategoryCard({ category, onSelect, isSelected }: CategoryCardProps) {
  // Strip out prefix for actual category query matching if needed
  const cleanName = category.name.replace(/{{category\.name}}\s*/, '').trim();

  return (
    <motion.div
      id={`cat-card-${category.id}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(cleanName)}
      className={`cursor-pointer overflow-hidden border transition-all duration-300 ${
        isSelected
          ? 'bg-zinc-900 border-zinc-500 shadow-lg'
          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="relative h-28 w-full bg-zinc-900">
        <img
          src={category.image}
          alt={category.name}
          className="h-full w-full object-cover filter brightness-75 contrasts-125 saturate-50 select-none hover:saturate-100 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
        
        {/* Floating Category Icon Indicator */}
        <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-none bg-black/80 border border-zinc-805 flex items-center justify-center text-zinc-400">
          <Layers size={11} />
        </div>

        {/* Floating volume counter */}
        <div className="absolute bottom-2 left-3 font-mono text-[10px] text-zinc-400 tracking-wider">
          {category.productCount}
        </div>
      </div>

      <div className="p-3">
        <h5 className="text-sm font-medium text-zinc-100 mb-1 flex items-center justify-between">
          <span>{category.name}</span>
          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        </h5>
        <p className="text-[11px] text-zinc-500 line-clamp-1">
          {category.description}
        </p>
      </div>
    </motion.div>
  );
}
