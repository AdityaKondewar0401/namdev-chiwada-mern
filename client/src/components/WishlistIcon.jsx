import { Heart, Plus } from 'lucide-react';

/* Same heart-with-plus "add to wishlist" glyph used across the site —
   the grid, the homepage collection, and the product detail page.
   `filled` switches it to a solid red heart once the product is
   actually in the wishlist. Extracted to one shared file so every
   surface stays visually in sync automatically. */
export default function WishlistIcon({ size = 16, filled = false }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Heart size={size} strokeWidth={2} fill={filled ? 'currentColor' : 'none'} />
      <span
        className={`absolute flex items-center justify-center rounded-full ${filled ? 'bg-red-50' : 'bg-white'}`}
        style={{
          width: size * 0.52,
          height: size * 0.52,
          right: -size * 0.12,
          bottom: -size * 0.12,
        }}
      >
        <Plus size={size * 0.42} strokeWidth={3} />
      </span>
    </div>
  );
}
