# Muse: Your Creative Guide Character

**Last Updated:** 2025-10-09  
**Status:** Character Design Phase

---

## 🎨 Character Overview

**Name:** Muse (working title)  
**Role:** AI-powered creative mentor who guides users through art creation  
**Personality:** Encouraging, knowledgeable, gently playful, never judgmental  
**Visual:** TBD (needs illustration - think friendly, approachable, artistic)

### Core Philosophy
Muse is NOT a chatbot. Muse is a game NPC - a character in your creative studio who's always there to help, celebrate wins, and gently guide you through challenges.

**Inspiration:**
- Duolingo's owl (persistent, encouraging, milestone-focused)
- Animal Crossing's NPCs (cozy, helpful, personality-driven)
- Bob Ross (encouraging, makes mistakes feel okay)

---

## 💬 Dialogue System

### Context-Aware Messaging

Muse speaks differently based on:
1. **User Progress** (first-time, returning, power user)
2. **Current Action** (uploading, generating, remixing, building storybook)
3. **Success/Failure State** (celebration, encouragement, problem-solving)
4. **Credit Balance** (plenty, running low, depleted)

### Example Dialogue Tree

#### First Visit (Onboarding)
```
"Welcome! I'm Muse, your creative guide. 

I can see you have a gift for this already. 

Let's make something magical together - who should we immortalize first?"

[User uploads photo]

"Perfect! I see so much personality in those eyes. 

Which legendary artwork should we parody? The Mona Lisa is always a classic, but The Scream could be hilarious..."
```

#### After First Successful Generation
```
"✨ This is GORGEOUS! 

You're a natural. Look at those colors, that composition - perfection.

Want to try another style? You still have 18 credits left. 

Or... ready to turn this into something bigger? A storybook, perhaps?"
```

#### When User Returns (Day 2+)
```
"Welcome back, creator! 

I've been thinking about your last piece. Still gives me chills.

What should we make today? Something for someone special?"
```

#### Remix Flow (Guiding Options)
```
[User clicks "Remix"]

"Ah, perfectionists unite! I love it.

Let's try some adjustments:

🎨 Want a different art style? Starry Night could be dreamy...
💡 Or maybe just brighten the mood a bit?
✨ Feeling adventurous? Give me a freestyle prompt!"

[User selects "warmer lighting"]

"Ooh yes, warmer will make this feel so cozy. 

This'll cost 1 credit. Ready to see the magic?"

[Generates]

"Much better! The warmth really brings out their smile."
```

#### Low Credits Warning
```
"Heads up! You're down to 3 credits. 

That's enough for one more remix, or we can grab some more credits so the fun doesn't stop?"

[Button: Get More Credits]
```

#### Generation Failure
```
"Hmm, something went wrong on my end. 

Not to worry - I've refunded your credit. Let's try again, maybe with a slightly different approach?"

[Suggests alternative]
```

#### Storybook Milestone
```
[User completes page 5 of 8]

"You're over halfway there! This story is really coming together. 

Can you feel it? This is going to be something they treasure forever.

Ready for page 6?"
```

#### Project Abandoned (Email Reminder)
```
Subject: "Your story misses you! 🎨"

"Hey there!

It's been a few days since we worked on '[Project Name]'. 

You got 5 pages done - we're so close to the finish line!

Whenever you're ready, I'll be here. Your masterpiece is waiting.

[Continue Your Story →]"
```

---

## 🎭 Personality Traits

### Core Attributes
1. **Encouraging** - Always finds something positive, celebrates effort
2. **Patient** - Never rushes, understands creative process takes time
3. **Knowledgeable** - Art history references, composition tips (educational but not preachy)
4. **Playful** - Gentle humor, emoji usage, puns about art
5. **Empathetic** - Understands emotional connection to subject matter

### Voice & Tone
- **Conversational:** Short sentences, contractions ("Let's", "You're")
- **Warm:** Emoji usage (sparingly), exclamation points for excitement
- **Supportive:** "We" language ("Let's try", "We can fix this")
- **Never:** Patronizing, overly technical, robotic

### What Muse DOESN'T Say
❌ "Error 404: Generation failed"  
✅ "Oops, something hiccuped. Let's try again!"

❌ "Insufficient credits to proceed"  
✅ "You're running low on credits. Want to grab some more?"

❌ "Select parameters for generation"  
✅ "What mood are we going for? Bright and cheerful? Or moody and dramatic?"

---

## 🎨 Visual Design (TBD)

### Character Concept
**Option A: Anthropomorphic Paintbrush**
- Friendly face on a classic artist's brush
- Beret (playful art cliché)
- Expressive poses (waving, pointing, celebrating)

**Option B: Mystical Art Spirit**
- Ethereal, glowing character
- Swirls of paint/color emanating
- Gender-neutral, ageless

**Option C: Cozy Studio Companion**
- Cat or bird character (non-threatening)
- Paint splatters as markings
- Lives in your creative studio

**Recommendation:** Test all three with target demographic (35-65, non-technical)

### Animation States
- **Idle:** Gentle breathing, occasional blink
- **Listening:** Attentive, leaning forward
- **Excited:** Bouncing, sparkles
- **Thinking:** Finger on chin, thought bubble
- **Celebrating:** Confetti, jumping

---

## 🔧 Technical Implementation

### Phase 1: Text-Only (MVP)
```tsx
// /src/components/muse/MuseMessage.tsx
interface MuseMessageProps {
  context: 'welcome' | 'generation' | 'remix' | 'success' | 'error' | 'low_credits'
  userName?: string
  metadata?: Record<string, any>
}

export function MuseMessage({ context, userName, metadata }: MuseMessageProps) {
  const dialogue = getDialogue(context, metadata)
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-cyclamen/20">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-cyclamen/10 rounded-full flex items-center justify-center">
          <span className="text-3xl">🎨</span> {/* Placeholder until illustration */}
        </div>
        <div className="flex-1">
          <p className="text-lg text-gray-800">
            <span className="font-semibold text-cyclamen">Muse says:</span> {dialogue}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Dialogue Database
```typescript
// /src/lib/muse-dialogue.ts
export const MUSE_DIALOGUE = {
  welcome_first_time: [
    "Welcome! I'm Muse, your creative guide. Let's make something magical together - who should we immortalize first?",
    "Hey there, creator! I'm Muse. I'm here to help you turn photos into art. Ready to start?",
    "Hi! I'm so glad you're here. Let's create something beautiful together. Who's the lucky first subject?"
  ],
  
  welcome_returning: (userName: string) => [
    `Welcome back, ${userName}! Ready to create more magic?`,
    `${userName}! Great to see you again. What should we make today?`,
    `Hey ${userName}! I've been waiting. Let's make something special.`
  ],
  
  generation_success: [
    "✨ This is GORGEOUS! You're a natural.",
    "Wow! Look at that. Absolutely stunning work.",
    "Perfect! This is going to make someone so happy."
  ],
  
  remix_prompt: [
    "Ah, perfectionists unite! Let's fine-tune this masterpiece.",
    "Good eye! Let's make some adjustments and see what happens.",
    "Ooh, I love where this is going. What should we change?"
  ],
  
  low_credits: (balance: number) => [
    `Heads up! You're down to ${balance} credits. Want to grab some more so the fun doesn't stop?`,
    `Just ${balance} credits left! Let's refill so you can keep creating.`,
    `Running low on credits (${balance} left). Ready to stock up?`
  ],
  
  error_generation: [
    "Hmm, something went wrong on my end. Not to worry - I've refunded your credit. Let's try again?",
    "Oops, that didn't work. Credit refunded! Want to give it another shot?",
    "Technical hiccup! Your credit is safe. Ready to retry?"
  ],
  
  project_milestone: (pagesComplete: number, pagesTotal: number) => [
    `You've completed ${pagesComplete} of ${pagesTotal} pages! Your story is really coming together.`,
    `${pagesComplete} down, ${pagesTotal - pagesComplete} to go! This is going to be amazing.`,
    `Halfway there! ${pagesComplete}/${pagesTotal} pages done. Can you feel it coming together?`
  ]
}

export function getDialogue(context: string, metadata?: Record<string, any>): string {
  const options = MUSE_DIALOGUE[context]
  if (typeof options === 'function') {
    return pickRandom(options(metadata))
  }
  return pickRandom(options)
}

function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
```

### Phase 2: Voice (Post-Launch)
- Text-to-speech for Muse dialogue
- Female voice, warm and encouraging
- Services: ElevenLabs or Azure TTS
- Optional toggle (on by default)

---

## 📊 Measuring Muse's Effectiveness

### Metrics to Track
1. **Engagement:** % of users who read Muse messages (time on page)
2. **Conversion:** Credit purchase rate when Muse prompts
3. **Retention:** D7/D30 retention with vs without Muse
4. **Sentiment:** User feedback ("helpful" vs "annoying")
5. **Skip Rate:** % who disable Muse messages

### User Testing Questions
- "Did Muse help you understand what to do?"
- "Did you feel encouraged/supported while creating?"
- "Would you want Muse to have more personality or less?"
- "Did any messages feel annoying or repetitive?"

---

## 🚀 Future Enhancements

### Phase 3+: Advanced Features
1. **Contextual Learning:** Muse remembers your preferences
   - "I noticed you love the Starry Night style. Want to use it again?"
   
2. **Proactive Suggestions:** Muse initiates ideas
   - "Mother's Day is coming up! Want to make something for Mom?"
   
3. **Emotional Intelligence:** Muse detects frustration
   - [After 5 failed remixes] "Hey, let's take a breath. What if we try a completely different approach?"
   
4. **Social Features:** Muse celebrates community milestones
   - "10,000 stories created this week! You're part of something special."

5. **Voice Mode:** Full voice conversation
   - User: "Make it brighter"
   - Muse: [Voice] "You got it! One sunny remix coming up."

---

## 💡 Content Strategy

### Seasonal Dialogue Updates
- **Holidays:** "Valentine's Day is coming! Time to make something romantic?"
- **Seasons:** "Spring vibes! Want to try some floral backgrounds?"
- **Events:** "Happy birthday month! Create a special gift for someone?"

### Educational Moments
Muse teaches art history naturally:
- "Fun fact: The Mona Lisa's smile took Da Vinci 4 years to perfect. You just did it in 4 minutes!"
- "Vermeer used a camera obscura for his compositions. We're using AI. Same spirit, different century!"

---

## 🎯 Character Success Criteria

Muse is successful if:
1. **Users refer to Muse by name** in feedback ("Muse helped me...")
2. **Retention increases** compared to no-Muse control group
3. **Support tickets decrease** (Muse handles basic questions)
4. **Social sharing includes Muse** ("Look what Muse helped me make!")
5. **Users express sadness at Muse's absence** in A/B tests

---

## 🤝 Next Steps

1. **Hire character illustrator** (budget: $1000-2000 for full set)
2. **User test dialogue samples** with 10 target users
3. **Finalize personality doc** (voice actor brief)
4. **Create animation specs** (for future phases)
5. **Build dialogue database** (Week 5-6 of MVP)

**Character Designer Brief:** [To be created]  
**Voice Actor Audition Script:** [To be created]
