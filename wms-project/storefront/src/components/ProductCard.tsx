/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors h-full"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/5] bg-zinc-900 overflow-hidden w-full">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 select-none"
          referrerPolicy="no-referrer"
        />
        
        {/* Dynamic Dark Gradient Backdrop Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity" />

        {/* Floating Quick Status Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase bg-black/90 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Dostępne
          </span>
        </div>

        {/* Floating Actions on Hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-xs">
          <button
            id={`btn-view-${product.id}`}
            onClick={() => onViewDetails(product)}
            className="flex h-10 w-10 items-center justify-center bg-zinc-900 border border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            title="Zobacz szczegóły"
          >
            <Eye size={16} />
          </button>
          
          <button
            id={`btn-cart-${product.id}`}
            onClick={() => onAddToCart(product)}
            className="flex h-10 w-10 items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors cursor-pointer"
            title="Dodaj do koszyka"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category & SKU Indicators */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-mono tracking-wider uppercase text-zinc-500 truncate">
            {product.category}
          </span>
          <span className="text-[9px] font-mono text-zinc-500 truncate" title="Kod SKU">
            {product.sku}
          </span>
        </div>

        {/* Product Title */}
        <h4 className="text-sm font-medium text-zinc-100 line-clamp-2 mb-2 group-hover:text-white transition-colors">
          {product.name}
        </h4>

        {/* Spacer to push pricing below */}
        <div className="flex-grow" />

        {/* Financial Line Item & Details button */}
        <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest leading-none">Cena</div>
            <div className="text-sm font-medium text-zinc-200 mt-1 font-mono">
              {product.price}
            </div>
          </div>
          
          <button
            id={`btn-inspect-${product.id}`}
            onClick={() => onViewDetails(product)}
            className="text-[11px] font-mono text-zinc-400 group-hover:text-white flex items-center gap-1 hover:underline transition-colors cursor-pointer"
          >
            Szczegóły <span className="text-[9px]">→</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
