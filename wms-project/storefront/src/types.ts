/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string; // Dynamic placeholder: "{{product.id}}"
  name: string; // Dynamic placeholder: "{{product.name}}"
  description: string; // Dynamic placeholder: "{{product.description}}"
  price: string; // Dynamic placeholder: "{{product.price}}"
  stock: string; // Dynamic placeholder: "{{product.stock}}"
  image: string; // Dynamic placeholder: "{{product.image}}"
  category: string; // Dynamic placeholder: "{{product.category}}"
  sku: string; // Dynamic placeholder: "{{product.sku}}"
  rating: string; // Dynamic placeholder: "{{product.rating}}"
  specifications: Record<string, string>; // Dynamic specification keys and values
}

export interface Category {
  id: string; // Dynamic placeholder: "{{category.id}}"
  name: string; // Dynamic placeholder: "{{category.name}}"
  image: string; // Dynamic placeholder: "{{category.image}}"
  productCount: string; // Dynamic placeholder: "{{category.productCount}}"
  description: string; // Dynamic placeholder: "{{category.description}}"
}

export interface CartItem {
  id: string; // Dynamic placeholder: "{{cartItem.id}}"
  product: Product; // Root product model
  quantity: number; // Interactive number for sandbox
  selectedColor: string; // Selected variant details
  selectedSize: string; // Selected variant details
}

export interface Cart {
  id: string; // Dynamic placeholder: "{{cart.id}}"
  items: CartItem[];
  subtotal: string; // Dynamic placeholder: "{{cart.subtotal}}"
  discount: string; // Dynamic placeholder: "{{cart.discount}}"
  shipping: string; // Dynamic placeholder: "{{cart.shipping}}"
  total: string; // Dynamic placeholder: "{{cart.total}}"
  couponCode: string; // Applied coupon value
}

export interface OrderItem {
  id: string; // Dynamic placeholder: "{{orderItem.id}}"
  productId: string; // Dynamic placeholder: "{{orderItem.productId}}"
  name: string; // " {{product.name}} "
  price: string; // " {{product.price}} "
  quantity: number;
  image: string;
}

export interface Order {
  id: string; // Dynamic placeholder: "{{order.id}}"
  orderNumber: string; // Dynamic placeholder: "{{order.orderNumber}}"
  date: string; // Dynamic placeholder: "{{order.date}}"
  status: string; // Dynamic placeholder: "{{order.status}}"
  items: OrderItem[];
  shippingAddress: Address;
  total: string; // Dynamic placeholder: "{{order.total}}"
  trackingNumber?: string; // Dynamic placeholder: "{{order.trackingNumber}}"
}

export interface Address {
  id: string; // Dynamic placeholder: "{{address.id}}"
  firstName: string; // Dynamic placeholder: "{{address.firstName}}"
  lastName: string; // Dynamic placeholder: "{{address.lastName}}"
  company?: string;
  street: string; // Dynamic placeholder: "{{address.street}}"
  apartment?: string;
  city: string; // Dynamic placeholder: "{{address.city}}"
  postalCode: string; // Dynamic placeholder: "{{address.postalCode}}"
  country: string; // Dynamic placeholder: "{{address.country}}"
  phone: string; // Dynamic placeholder: "{{address.phone}}"
}

export interface Customer {
  id: string; // Dynamic placeholder: "{{customer.id}}"
  email: string; // Dynamic placeholder: "{{customer.email}}"
  firstName: string; // Dynamic placeholder: "{{customer.firstName}}"
  lastName: string; // Dynamic placeholder: "{{customer.lastName}}"
  addresses: Address[];
  defaultAddressId: string;
}

export interface Review {
  id: string; // Dynamic placeholder: "{{review.id}}"
  author: string; // Dynamic placeholder: "{{review.author}}"
  rating: number;
  comment: string; // Dynamic placeholder: "{{review.comment}}"
  date: string; // Dynamic placeholder: "{{review.date}}"
}
