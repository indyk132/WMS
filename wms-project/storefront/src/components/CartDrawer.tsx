/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, Tag, Truck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [shippingEstimator, setShippingEstimator] = useState<string | null>(null);

  // Parse numerical subtotal for active calculations
  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      // Find numbers in product.price (e.g. 899.00 EUR or templated strings)
      const matches = item.product.price.match(/[\d.,]+/);
      const parsedPrice = matches ? parseFloat(matches[0].replace(/,/g, '')) : 0;
      return acc + parsedPrice * item.quantity;
    }, 0);
  };

  const activeSubtotal = calculateSubtotal();
  const shippingCost = activeSubtotal > 1000 || activeSubtotal === 0 ? 0 : 45;
  const discountAmount = appliedCoupon ? activeSubtotal * 0.1 : 0; // 10% coupon promo
  const activeTotal = activeSubtotal + shippingCost - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (coupon.trim()) {
      setAppliedCoupon(coupon.toUpperCase());
    }
  };

  const handleApplyZip = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipCode.trim()) {
      setShippingEstimator(
        `WMS API response for Delivery to [${zipCode}]: Express Courier available in 24 hours.`
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-zinc-400" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-100">
                  Cart ({"{{cart.items_count}}"} {cartItems.reduce((a, b) => a + b.quantity, 0)})
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Shopping List Items Container */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingBag size={36} className="text-zinc-700 mb-3 animate-bounce" />
                  <p className="text-sm text-zinc-400 font-medium">Cart is empty</p>
                  <p className="text-xs text-zinc-600 mt-1">Select products to inspect active logic.</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 bg-zinc-900/40 p-3 border border-zinc-900/80 rounded-none relative group"
                  >
                    {/* Item Thumbnail */}
                    <div className="h-16 w-16 bg-zinc-900 flex-shrink-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-full w-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 truncate pr-6">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">
                        Variant: {item.selectedColor} / {item.selectedSize}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2.5">
                        {/* Adjust Qty */}
                        <div className="flex items-center border border-zinc-800 bg-black">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2.5 text-xs text-zinc-200 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                        
                        {/* Value Display */}
                        <div className="text-xs font-mono text-zinc-300">
                          {item.product.price}
                        </div>
                      </div>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="absolute top-2 right-2 text-zinc-600 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Sticky Lower Section Summary */}
            <div className="bg-zinc-950 p-4 border-t border-zinc-900 space-y-4">
              {cartItems.length > 0 && (
                <>
                  {/* Estimators Panel */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Shipping Estimation */}
                    <form onSubmit={handleApplyZip} className="flex flex-col gap-1 border border-zinc-900 p-2">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1">
                        <Truck size={10} /> Shipping ZIP Estimator
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="e.g. 00-001"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          className="bg-black border border-zinc-800 text-[11px] text-white px-2 py-1 w-full rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                        />
                        <button type="submit" className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 px-2 py-1 font-mono text-[10px] cursor-pointer">
                          Apply
                        </button>
                      </div>
                    </form>

                    {/* Coupon Box */}
                    <form onSubmit={handleApplyCoupon} className="flex flex-col gap-1 border border-zinc-900 p-2">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono flex items-center gap-1">
                        <Tag size={10} /> Promo Coupon
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          placeholder="e.g. WMS10"
                          value={coupon}
                          onChange={(e) => setCoupon(e.target.value)}
                          className="bg-black border border-zinc-800 text-[11px] text-white px-2 py-1 w-full rounded-none focus:outline-none focus:border-zinc-500 font-mono"
                        />
                        <button type="submit" className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 px-2 py-1 font-mono text-[10px] cursor-pointer">
                          Apply
                        </button>
                      </div>
                    </form>
                  </div>

                  {shippingEstimator && (
                    <div className="p-2 bg-emerald-950/20 border border-emerald-900 text-[10px] font-mono text-emerald-400">
                      {shippingEstimator}
                    </div>
                  )}

                  {/* Calculations breakdown containing variable placeholders */}
                  <div className="space-y-1.5 border-t border-zinc-900 pt-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono">Subtotal:</span>
                      <span className="font-mono text-zinc-300">
                        {activeSubtotal.toFixed(2)} EUR ({"{{cart.subtotal}}"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono">Discount (10%):</span>
                      <span className="font-mono text-zinc-300">
                        -{discountAmount.toFixed(2)} EUR ({"{{cart.discount}}"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono">Est. Shipping:</span>
                      <span className="font-mono text-zinc-300">
                        {shippingCost === 0 ? 'FREE' : `${shippingCost.toFixed(2)} EUR`} ({"{{cart.shipping}}"})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm font-semibold text-white pt-2 border-t border-zinc-900">
                      <span className="font-mono uppercase tracking-wider">Total:</span>
                      <span className="font-mono text-emerald-400">
                        {activeTotal.toFixed(2)} EUR ({"{{cart.total}}"})
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Checkout Trigger */}
              <button
                id="btn-drawer-checkout"
                disabled={cartItems.length === 0}
                onClick={onCheckout}
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-medium py-3 text-xs uppercase tracking-wider font-mono text-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
