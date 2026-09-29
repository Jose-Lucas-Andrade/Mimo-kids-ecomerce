'use client';
import { useEffect } from 'react';
import { useCart } from '../../../store/cart';

export default function ClearCartOnApprove({ shouldClear }) {
  const clear = useCart((state) => state.clear);

  useEffect(() => {
    if (shouldClear) clear();
  }, [shouldClear, clear]);

  return null;
}
