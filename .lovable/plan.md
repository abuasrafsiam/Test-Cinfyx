

## Hero Gradient Gap Fix

**Problem**: The `mt-6` margin on the content section below the hero creates a visible gap. The gradient ends exactly at the hero container boundary (`h-[42vh]` with `overflow-hidden`), causing a hard cutoff.

**Two changes needed:**

### 1. FeaturedCarousel.tsx — Extend gradient beyond container
- Remove `overflow-hidden` from the hero container
- Add a gradient overlay that extends **below** the hero using a taller gradient div with `bottom: -40px` positioning
- Set proper z-index: gradient above video, below text

### 2. Index.tsx — Remove gap, overlap content
- Change `mt-6` to `-mt-10` (negative margin) so the content section overlaps into the hero's extended gradient
- Add `relative z-10` to ensure movie rows sit above the gradient

This creates a seamless, cinematic fade from hero video into the content rows with zero visible gap.

