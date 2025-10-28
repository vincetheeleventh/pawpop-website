# Shtuu's Studio - Component Architecture Guide

**Version:** 1.0  
**Date:** October 27, 2025  
**Related:** SHTUU_TECHNICAL_SPEC.md, SHTUU_API_DESIGN.md  

---

## 1. Component Hierarchy

```
/shtuu (Landing Page)
├── ShtuuHero (Shtuu introduction + CTA)
├── ShtuuStudio (Main dialogue container)
│   ├── ShtuuCharacter (Animated character)
│   ├── DialogueBox (Speech bubble + options)
│   ├── PetTypeSelector (Dog/Cat selection)
│   ├── ImageUploadZone (Drag & drop)
│   ├── GeneratingAnimation (Working sequence)
│   └── ArtworkReveal (Preview + CTAs)
└── CreditStatusBar (Persistent top bar)

/shtuu/credits
├── CreditBalance (Current balance card)
├── CreditPurchaseOptions (Snack packs)
└── TransactionHistory (Credit usage log)

/shtuu/subscription
├── SubscriptionPlans (Comparison cards)
├── SubscriptionBenefits (Feature list)
└── SubscriptionManagement (Portal access)
```

---

## 2. Core Components

### 2.1 ShtuuCharacter Component

**File:** `/src/components/shtuu/ShtuuCharacter.tsx`

**Purpose:** Renders Shtuu character with animations

**Props:**
```typescript
interface ShtuuCharacterProps {
  mood: 'idle' | 'working' | 'happy' | 'sad' | 'excited' | 'thinking';
  size?: 'sm' | 'md' | 'lg';
  showPixel?: boolean; // Shtuu's cat companion
}
```

**Implementation (MVP - Still Images):**
```typescript
export default function ShtuuCharacter({ 
  mood = 'idle', 
  size = 'md',
  showPixel = false 
}: ShtuuCharacterProps) {
  return (
    <div className="relative">
      {/* Shtuu still image - will use placeholder until assets provided */}
      <Image
        src={`/images/shtuu/shtuu-${mood}.png`}
        alt="Shtuu the artist"
        width={getSizePixels(size)}
        height={getSizePixels(size)}
        className="transition-opacity duration-300"
        placeholder="blur"
        blurDataURL="/images/shtuu/placeholder.png"
      />
      
      {/* Pixel (cat companion) - optional */}
      {showPixel && (
        <Image
          src="/images/shtuu/pixel.png"
          alt="Pixel the cat"
          width={getSizePixels(size) * 0.4}
          height={getSizePixels(size) * 0.4}
          className="absolute bottom-0 right-0"
        />
      )}
    </div>
  );
}
```

**Still Images Needed (MVP):**
- `shtuu-idle.png` - Default expression
- `shtuu-working.png` - Focused/creating
- `shtuu-happy.png` - Celebrating
- `shtuu-thinking.png` - Pondering
- `pixel.png` - Cat companion (optional)
- `studio-background.png` - Background scene

---

### 2.2 DialogueBox Component

**File:** `/src/components/shtuu/DialogueBox.tsx`

**Purpose:** Display Shtuu's messages with options

**Props:**
```typescript
interface DialogueBoxProps {
  message: string;
  options?: DialogueOption[];
  onSelectOption?: (optionId: string) => void;
  isTyping?: boolean;
}

interface DialogueOption {
  id: string;
  label: string;
  emoji?: string;
  disabled?: boolean;
}
```

**Implementation:**
```typescript
export default function DialogueBox({
  message,
  options = [],
  onSelectOption,
  isTyping = false
}: DialogueBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  
  // Typewriter effect
  useEffect(() => {
    if (isTyping) {
      let index = 0;
      const interval = setInterval(() => {
        setDisplayedText(message.slice(0, index));
        index++;
        if (index > message.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(message);
    }
  }, [message, isTyping]);

  return (
    <div className="bg-card-surface border-2 border-naples-yellow rounded-2xl p-6 shadow-lg relative">
      {/* Speech bubble tail */}
      <div className="absolute -left-3 top-8 w-6 h-6 bg-card-surface border-l-2 border-b-2 border-naples-yellow transform rotate-45" />
      
      {/* Message text */}
      <p className="font-geist text-lg text-text-primary mb-4">
        {displayedText}
        {isTyping && <span className="animate-pulse">|</span>}
      </p>
      
      {/* Options */}
      {options.length > 0 && !isTyping && (
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectOption?.(option.id)}
              disabled={option.disabled}
              className="bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option.emoji && <span className="mr-2">{option.emoji}</span>}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 2.3 ShtuuStudio Component (Main Container)

**File:** `/src/components/shtuu/ShtuuStudio.tsx`

**Purpose:** Orchestrate entire dialogue flow

**State Management:**
```typescript
interface StudioState {
  sessionToken: string | null;
  currentStep: DialogueStep;
  conversationHistory: DialogueMessage[];
  petType: 'dog' | 'cat' | null;
  uploadedImage: File | null;
  artworkId: string | null;
  generationStatus: 'idle' | 'generating' | 'complete' | 'error';
}

type DialogueStep = 'welcome' | 'pet_type' | 'upload' | 'generating' | 'reveal' | 'feedback';
```

**Implementation:**
```typescript
export default function ShtuuStudio() {
  const [state, setState] = useState<StudioState>({
    sessionToken: null,
    currentStep: 'welcome',
    conversationHistory: [],
    petType: null,
    uploadedImage: null,
    artworkId: null,
    generationStatus: 'idle'
  });

  // Initialize dialogue session
  useEffect(() => {
    startDialogueSession();
  }, []);

  const startDialogueSession = async () => {
    const response = await fetch('/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'landing_page' })
    });
    const data = await response.json();
    
    setState((prev) => ({
      ...prev,
      sessionToken: data.sessionToken,
      currentStep: data.currentStep,
      conversationHistory: [data.dialogue]
    }));
  };

  const handleOptionSelect = async (optionId: string) => {
    // Send response to API
    const response = await fetch('/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: state.sessionToken,
        step: state.currentStep,
        response: { petType: optionId }
      })
    });
    const data = await response.json();
    
    setState((prev) => ({
      ...prev,
      currentStep: data.currentStep,
      petType: optionId as 'dog' | 'cat',
      conversationHistory: [...prev.conversationHistory, data.dialogue]
    }));
  };

  return (
    <div className="min-h-screen bg-site-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Studio header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-arvo text-3xl font-bold">Shtuu's Studio</h1>
          <CreditBalance />
        </div>

        {/* Main dialogue area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Shtuu Character */}
          <div className="flex flex-col items-center justify-center">
            <ShtuuCharacter 
              animation={getAnimationForStep(state.currentStep, state.generationStatus)}
              size="lg"
              showPixel
            />
            <p className="font-geist text-sm text-text-primary/60 mt-4 text-center italic">
              {getShtuuStatusText(state.currentStep)}
            </p>
          </div>

          {/* Right: Dialogue box + actions */}
          <div className="flex flex-col gap-6">
            {state.conversationHistory.map((dialogue, index) => (
              <DialogueBox
                key={index}
                message={dialogue.message}
                options={index === state.conversationHistory.length - 1 ? dialogue.options : []}
                onSelectOption={handleOptionSelect}
                isTyping={index === state.conversationHistory.length - 1}
              />
            ))}

            {/* Dynamic components based on step */}
            {state.currentStep === 'upload' && (
              <ImageUploadZone onUpload={handleImageUpload} />
            )}
            
            {state.currentStep === 'generating' && (
              <GeneratingAnimation artworkId={state.artworkId!} />
            )}
            
            {state.currentStep === 'reveal' && (
              <ArtworkReveal artworkId={state.artworkId!} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 2.4 ImageUploadZone Component

**File:** `/src/components/shtuu/ImageUploadZone.tsx`

**Purpose:** Reuse existing UploadThing integration with Shtuu theming

**Props:**
```typescript
interface ImageUploadZoneProps {
  onUpload: (file: File, url: string) => void;
  sessionToken: string;
}
```

**Implementation:**
```typescript
export default function ImageUploadZone({ onUpload, sessionToken }: ImageUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [email, setEmail] = useState('');
  
  const handleFileSelect = async (file: File) => {
    if (!email) {
      alert('Please enter your email first!');
      return;
    }
    
    setIsUploading(true);
    
    // Upload to UploadThing
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/uploadthing/upload', {
      method: 'POST',
      body: formData
    });
    const uploadData = await uploadResponse.json();
    
    // Submit to dialogue API
    const dialogueResponse = await fetch('/api/shtuu/dialogue/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        petPhotoUrl: uploadData.url,
        email
      })
    });
    
    setIsUploading(false);
    onUpload(file, uploadData.url);
  };

  return (
    <div className="bg-card-surface border-2 border-dashed border-cyclamen rounded-2xl p-8">
      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email (so Shtuu can send you the art!)"
        className="w-full px-4 py-3 border-2 border-naples-yellow rounded-xl mb-4 font-geist"
      />
      
      {/* Upload area */}
      <UploadDropzone
        endpoint="petPhotoUploader"
        onClientUploadComplete={(files) => handleFileSelect(files[0].file)}
        appearance={{
          button: 'bg-atomic-tangerine hover:bg-atomic-tangerine/90',
          container: 'border-none'
        }}
      />
      
      {isUploading && (
        <div className="text-center mt-4">
          <p className="font-geist text-cyclamen animate-pulse">
            Sending to Shtuu's studio...
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### 2.5 GeneratingAnimation Component

**File:** `/src/components/shtuu/GeneratingAnimation.tsx`

**Purpose:** Show Shtuu working animation while polling generation status

**Implementation:**
```typescript
export default function GeneratingAnimation({ artworkId }: { artworkId: string }) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Gathering inspiration...');
  
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const response = await fetch(`/api/shtuu/dialogue/status?sessionToken=${sessionToken}`);
      const data = await response.json();
      
      if (data.status === 'completed') {
        clearInterval(pollInterval);
        // Trigger reveal step
      }
      
      setMessage(data.dialogue.message);
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, [artworkId]);

  return (
    <div className="bg-card-surface rounded-2xl p-8 text-center">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div 
          className="bg-cyclamen h-4 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Message */}
      <p className="font-geist text-lg text-text-primary">
        {message}
      </p>
      
      {/* Animation frames */}
      <div className="mt-6">
        <Image
          src="/images/shtuu/working-animation.gif"
          alt="Shtuu working"
          width={400}
          height={300}
          className="mx-auto"
        />
      </div>
    </div>
  );
}
```

---

### 2.6 ArtworkReveal Component

**File:** `/src/components/shtuu/ArtworkReveal.tsx`

**Purpose:** Show generated artwork with monetization CTAs

**Implementation:**
```typescript
export default function ArtworkReveal({ artworkId }: { artworkId: string }) {
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const { creditBalance } = useCreditBalance();
  
  useEffect(() => {
    fetchArtwork();
  }, [artworkId]);
  
  const fetchArtwork = async () => {
    const response = await fetch(`/api/artworks/${artworkId}`);
    const data = await response.json();
    setArtwork(data.artwork);
  };

  return (
    <div className="bg-card-surface rounded-2xl p-6 shadow-xl">
      {/* Artwork preview (watermarked if free tier) */}
      <div className="relative mb-6">
        <Image
          src={artwork?.generated_images.artwork_preview || ''}
          alt="Your pet parody"
          width={600}
          height={600}
          className="rounded-xl w-full"
        />
        {artwork?.has_watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/30 text-6xl font-bold rotate-[-45deg]">
              PREVIEW
            </p>
          </div>
        )}
      </div>
      
      {/* CTAs */}
      <div className="space-y-3">
        {artwork?.has_watermark ? (
          <>
            <button className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-4 rounded-xl">
              Download High-Res (1 Credit)
            </button>
            <button className="w-full bg-cyclamen hover:bg-cyclamen/90 text-white font-fredoka text-lg px-6 py-4 rounded-xl">
              Make Another Style (1 Credit)
            </button>
          </>
        ) : (
          <>
            <button className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka text-lg px-6 py-4 rounded-xl">
              Download Now
            </button>
            <button className="w-full bg-pale-azure hover:bg-pale-azure/90 text-white font-fredoka text-lg px-6 py-4 rounded-xl">
              Make More Art ({creditBalance} credits left)
            </button>
          </>
        )}
      </div>
      
      {/* Sharing */}
      <div className="mt-6 text-center">
        <p className="font-geist text-sm text-text-primary/60 mb-2">
          Love it? Share Shtuu's art!
        </p>
        <div className="flex justify-center gap-3">
          <ShareButton platform="facebook" />
          <ShareButton platform="twitter" />
          <ShareButton platform="instagram" />
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Shared Components

### 3.1 CreditBalance Component

**File:** `/src/components/shtuu/CreditBalance.tsx`

**Purpose:** Persistent credit balance display

```typescript
export default function CreditBalance() {
  const { creditBalance, isLoading } = useCreditBalance();
  
  return (
    <div className="bg-card-surface border-2 border-naples-yellow rounded-xl px-4 py-2 flex items-center gap-2">
      <Image src="/images/shtuu/snack-icon.png" alt="Credits" width={24} height={24} />
      <span className="font-fredoka text-lg text-atomic-tangerine">
        {isLoading ? '...' : creditBalance}
      </span>
      <button className="text-xs text-cyclamen hover:underline">
        Get More
      </button>
    </div>
  );
}
```

---

### 3.2 CreditPurchaseModal Component

**File:** `/src/components/shtuu/CreditPurchaseModal.tsx`

**Purpose:** Display credit pack options

```typescript
const CREDIT_PACKS = [
  { id: 'snack', credits: 5, price: 999, emoji: '🍪', popular: false },
  { id: 'meal', credits: 12, price: 1999, emoji: '🍔', popular: true },
  { id: 'feast', credits: 25, price: 3499, emoji: '🍕', popular: false }
];

export default function CreditPurchaseModal({ isOpen, onClose }: ModalProps) {
  const handlePurchase = async (pack: CreditPack) => {
    const response = await fetch('/api/shtuu/credits/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: getCurrentUserId(),
        creditAmount: pack.credits,
        productType: pack.id
      })
    });
    const data = await response.json();
    
    // Redirect to Stripe Checkout
    window.location.href = data.checkoutUrl;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-6">
        <h2 className="font-arvo text-3xl font-bold mb-2">
          Feed Shtuu's Creativity!
        </h2>
        <p className="font-geist text-text-primary/70">
          Shtuu needs snacks to make more art for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`bg-card-surface border-2 rounded-xl p-6 relative ${
              pack.popular ? 'border-atomic-tangerine' : 'border-naples-yellow'
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-atomic-tangerine text-white px-3 py-1 rounded-full text-xs font-fredoka">
                Most Popular
              </div>
            )}
            
            <div className="text-5xl mb-2">{pack.emoji}</div>
            <h3 className="font-fredoka text-2xl mb-1">{pack.credits} Credits</h3>
            <p className="font-geist text-3xl font-bold text-atomic-tangerine mb-4">
              ${(pack.price / 100).toFixed(2)}
            </p>
            
            <button
              onClick={() => handlePurchase(pack)}
              className="w-full bg-atomic-tangerine hover:bg-atomic-tangerine/90 text-white font-fredoka py-3 rounded-xl"
            >
              Get Snacks
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
```

---

## 4. Custom Hooks

### 4.1 useCreditBalance Hook

**File:** `/src/hooks/useCreditBalance.ts`

```typescript
export function useCreditBalance() {
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchBalance();
  }, []);
  
  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/shtuu/credits/balance');
      const data = await response.json();
      setCreditBalance(data.creditBalance);
    } catch (error) {
      console.error('Failed to fetch credit balance:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshBalance = () => {
    fetchBalance();
  };
  
  return { creditBalance, isLoading, refreshBalance };
}
```

---

### 4.2 useDialogueSession Hook

**File:** `/src/hooks/useDialogueSession.ts`

```typescript
export function useDialogueSession() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<DialogueStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  
  const startSession = async () => {
    const response = await fetch('/api/shtuu/dialogue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: null, source: 'landing_page' })
    });
    const data = await response.json();
    setSessionToken(data.sessionToken);
    setCurrentStep(data.currentStep);
    setIsLoading(false);
  };
  
  const submitResponse = async (response: any) => {
    const result = await fetch('/api/shtuu/dialogue/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        step: currentStep,
        response
      })
    });
    const data = await result.json();
    setCurrentStep(data.currentStep);
    return data;
  };
  
  return { sessionToken, currentStep, isLoading, startSession, submitResponse };
}
```

---

## 5. Page Components

### 5.1 Shtuu Landing Page

**File:** `/src/app/shtuu/page.tsx`

```typescript
export default function ShtuuLandingPage() {
  return (
    <main className="min-h-screen bg-site-bg">
      <ShtuuHero />
      <ShtuuStudio />
    </main>
  );
}
```

---

### 5.2 Credits Page

**File:** `/src/app/shtuu/credits/page.tsx`

```typescript
export default function CreditsPage() {
  return (
    <main className="min-h-screen bg-site-bg py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-arvo text-4xl font-bold mb-8">Your Credits</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CreditPurchaseOptions />
            <TransactionHistory />
          </div>
          
          <div>
            <CreditBalance />
            <SubscriptionUpsell />
          </div>
        </div>
      </div>
    </main>
  );
}
```

---

## 6. Styling Guidelines

### 6.1 Shtuu Design Tokens

```typescript
// tailwind.config.ts additions
colors: {
  'shtuu-purple': '#9B7EDE',  // Shtuu's fur color
  'shtuu-blue': '#6EC6FF',    // Studio accents
  'snack-orange': '#FFA94D',  // Credit/snack icons
}
```

### 6.2 Animation Classes

```css
/* Bouncing animation for Shtuu */
@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.shtuu-bounce {
  animation: bounce-gentle 2s ease-in-out infinite;
}

/* Typewriter cursor */
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.typewriter-cursor {
  animation: blink 1s step-end infinite;
}
```

---

## 7. Component Testing Checklist

- [ ] ShtuuCharacter renders all animation states
- [ ] DialogueBox typewriter effect works
- [ ] ImageUploadZone handles file uploads
- [ ] GeneratingAnimation polls correctly
- [ ] ArtworkReveal shows watermark for free tier
- [ ] CreditBalance updates in real-time
- [ ] CreditPurchaseModal creates Stripe session
- [ ] All CTAs track analytics events
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessibility: keyboard navigation, ARIA labels
