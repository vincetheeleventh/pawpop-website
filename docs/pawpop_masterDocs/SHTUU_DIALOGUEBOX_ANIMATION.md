# Shtuu DialogueBox Animation

**Version:** 2.0  
**Updated:** October 28, 2025  
**Files:** `/src/components/shtuu/DialogueBox.tsx`, `/src/app/shtuu/page.tsx`

## Overview

Dialogue boxes animate from a tiny dot → thin line → full box in 300ms, then text appears with a typewriter effect. All boxes use the `DialogueBox` component with controlled text visibility.

**Key Features:**
- Scale-based animation (no layout shifts)
- Text completely hidden during animation
- GPU-accelerated transforms only
- 300ms duration with `ease-in-out` timing
- Sequential conversation flow

---

## Implementation

### Animation Keyframes (`/tailwind.config.ts`)

```typescript
animation: {
  'dialogue-pop': 'dialoguePop 0.3s ease-in-out forwards',
},
keyframes: {
  dialoguePop: {
    '0%': { transform: 'scale(0.02, 0.05)', borderRadius: '50%' },      // Dot
    '50%': { transform: 'scale(1, 0.05)', borderRadius: '2px' },        // Line
    '100%': { transform: 'scale(1, 1)', borderRadius: '1rem' },         // Box
  },
}
```

**Stages:**
- 0ms: Tiny circular dot (2% × 5%)
- 150ms: Full-width thin line
- 300ms: Full-size rounded box

### Sequential Timing (`/src/app/shtuu/page.tsx`)

```typescript
// State: showBubble, showText, isTyping for each bubble
const [showBubble1, setShowBubble1] = useState(false);
const [showText1, setShowText1] = useState(false);
const [isTyping1, setIsTyping1] = useState(false);
// ... (bubble 2, 3)

useEffect(() => {
  setTimeout(() => setShowBubble1(true), 300);           // Show box
  setTimeout(() => setShowText1(true), 600);              // Show text after animation
  setTimeout(() => setIsTyping1(true), 600);              // Start typing
  
  setTimeout(() => { setIsTyping1(false); setShowBubble2(true); }, 1400);
  setTimeout(() => { setShowText2(true); setIsTyping2(true); }, 1700);
  
  setTimeout(() => { setIsTyping2(false); setShowBubble3(true); }, 3700);
  // ...
}, []);
```

**Timeline:**
| Time | Event |
|------|-------|
| 300ms | Bubble 1 box animates |
| 600ms | Bubble 1 text appears, types |
| 1400ms | Bubble 2 box animates |
| 1700ms | Bubble 2 text appears, types |
| 3700ms | Bubble 3 (buttons) appears |

### DialogueBox Component (`/src/components/shtuu/DialogueBox.tsx`)

```typescript
interface DialogueBoxProps {
  message: string;
  isTyping?: boolean;
  showText?: boolean;  // Controls text visibility during animation
  compact?: boolean;
}

// Font: Fredoka (rounded, friendly, playful style)
// Typewriter: 30ms per character
// Text container: invisible span reserves space, prevents layout shifts
{showText && <span>{displayedText}{isTyping && <span>|</span>}</span>}
```

**Usage:**
```tsx
<div className="animate-dialogue-pop origin-center">
  <DialogueBox 
    message="Hi my name is Shtuu" 
    isTyping={isTyping1} 
    showText={showText1} 
  />
</div>
```

---

## Technical Details

**Performance:**
- GPU-accelerated `transform: scale()` only
- No layout shifts (space reserved with invisible text)
- No opacity changes (no repainting)
- 60fps smooth animation

**Browser Support:**
- Modern browsers with CSS animations
- Graceful degradation (instant display if animations fail)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Animation too fast/slow | Adjust duration in `tailwind.config.ts` (currently 0.3s) |
| Text appears too early | Increase `showText` delay (currently matches animation end) |
| Box moves during animation | Ensure `origin-center` class is applied |
| Line too thick at 50% | Adjust `scaleY` value (currently 0.05) |

---

**Related:** [Shtuu PRD](/docs/pawpop_masterDocs/PRD_SHTUU_FREEMIUM.md) • [Component Guide](/docs/pawpop_masterDocs/SHTUU_COMPONENT_GUIDE.md)
