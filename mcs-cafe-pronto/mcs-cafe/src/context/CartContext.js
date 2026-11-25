import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = (p, qty = 1) =>
    setItems((cur) => {
      const found = cur.find((x) => x.id === p.id);
      if (found) return cur.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x));
      return [...cur, { id: p.id, name: p.name, price: p.price, category: p.category || '', imageUrl: p.imageUrl || '', qty }];
    });

  const change = (id, delta) =>
    setItems((cur) => cur.map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0));

  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  return <CartContext.Provider value={{ items, add, change, clear, count, subtotal }}>{children}</CartContext.Provider>;
}
