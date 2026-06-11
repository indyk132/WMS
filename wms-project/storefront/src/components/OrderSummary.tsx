/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CartItem } from '../types';
import { CreditCard, CheckCircle2, ShoppingBag } from 'lucide-react';

interface OrderSummaryProps {
  cartItems: CartItem[];
  couponDiscountPct: number; // e.g. 0.1 for 10%
  shippingCost: number; // e.g. 0 or 45
}

export default function OrderSummary({ cartItems, couponDiscountPct, shippingCost }: OrderSummaryProps) {
  // Compute prices
  const computeSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      const match = item.product.price.match(/[\d.,]+/);
      const val = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
      return acc + val * item.quantity;
    }, 0);
  };

  const subtotal = computeSubtotal();
  const discountAmount = subtotal * couponDiscountPct;
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  // 23% VAT Polish Tax simulation
  const vatAmount = taxableSubtotal * 0.23;
  const grandTotal = taxableSubtotal + shippingCost;

  return (
    <div className="bg-zinc-950 border border-zinc-800 p-5 space-y-5" id="order-summary-box">
      {/* List Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold flex items-center gap-2">
          <ShoppingBag size={13} /> Review Order Items
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">WMS API Schema Context</span>
      </div>

      {/* Cart Items List */}
      <div className="divide-y divide-zinc-900 overflow-y-auto max-h-[220px] pr-1.5 space-y-2.5">
        {cartItems.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-6 font-mono">No items in the checkout queue.</p>
        ) : (
          cartItems.map((item) => {
            const match = item.product.price.match(/[\d.,]+/);
            const val = match ? parseFloat(match[0].replace(/,/g, '')) : 0;
            const lineSub = val * item.quantity;
            
            return (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3.5 text-xs">
                {/* Product Thumbnail */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="h-10 w-10 object-cover bg-zinc-900 border border-zinc-900 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                
                {/* Context */}
                <div className="min-w-0 flex-grow">
                  <div className="flex justify-between gap-1">
                    <h4 className="font-medium text-zinc-200 truncate leading-tight">
                      {item.product.name}
                    </h4>
                    <span className="font-mono text-zinc-300 flex-shrink-0">
                      {lineSub.toFixed(2)} EUR
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-zinc-500">
                    <span>
                      Qty: {item.quantity} × {item.product.price}
                    </span>
                    <span>
                      SKU: {item.product.sku}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Financial Calculations Sheet */}
      <div className="space-y-2 border-t border-zinc-900 pt-4 text-xs font-mono">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Subtotal:</span>
          <span className="text-zinc-200">
            {subtotal.toFixed(2)} EUR ({"{{cart.subtotal}}"})
          </span>
        </div>

        {couponDiscountPct > 0 && (
          <div className="flex items-center justify-between text-zinc-400">
            <span>Coupon Promo ({(couponDiscountPct * 100).toFixed(0)}%):</span>
            <span className="text-zinc-200">
              -{discountAmount.toFixed(2)} EUR ({"{{cart.discount}}"})
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-zinc-400">
          <span>Estimated Cargo Shipping:</span>
          <span className="text-zinc-200">
            {shippingCost === 0 ? 'FREE' : `${shippingCost.toFixed(2)} EUR`} ({"{{cart.shipping}}"})
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900 border-dashed pt-2.5">
          <span>Included Tax (23% VAT Est):</span>
          <span>{vatAmount.toFixed(2)} EUR</span>
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-white pt-3 border-t border-zinc-900">
          <span className="uppercase tracking-widest text-xs">Grand Total:</span>
          <span className="text-emerald-400 text-base">
            {grandTotal.toFixed(2)} EUR ({"{{cart.total}}"})
          </span>
        </div>
      </div>

      {/* Safety Badges */}
      <div className="p-3 bg-zinc-950 border border-zinc-900 flex items-start gap-2.5">
        <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-[10px] font-mono font-bold text-zinc-200 uppercase tracking-wider">WMS Secured Gateway</h5>
          <p className="text-[9px] text-zinc-500 font-mono mt-0.5 leading-relaxed">
            Upon confirmation, the system publishes a <code className="text-zinc-400">POST /api/order</code> transaction containing this breakdown directly to WMS, reserving active stocks automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
