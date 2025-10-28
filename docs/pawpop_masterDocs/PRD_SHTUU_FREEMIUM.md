
# **🧩 PRD: Dialogue-based Onboarding UX MVP — “Shtuu’s Studio”**

**Version:** v1.0

**Last Edited:** October 27, 2025

**Owner:** Vince Xi

**Product Line:** PawPop (Credit-based Creative Studio)

**Feature Type:** Freemium Onboarding / Growth Loop

---

## **1. 🎯 Purpose**

To create a **frictionless, delightful onboarding experience** that introduces new users to PawPop through a conversational mascot named **Shtuu**, who helps users co-create their first artwork in a playful, emotionally resonant way.

This experience will serve as both:

- a **freemium acquisition funnel** (low friction, high engagement)
- the foundation of a **credit-based subscription economy**, where users fund Shtuu’s art-making with “snacks” or “art supplies” (credits).
- **Differentiate** from other pet portrait, ai generated art services by gamifying the process, making the UX fun and engaging, while leveraging the advantages of AI agents
- **Secondary assumption validation:** User acceptance of a new mode of interacting with shops: an interactive llm dialogue “game”

**🧠 Strategic Rationale**

This model:

- Drastically reduces user friction through **character-based onboarding**
- Converts delight into payment through **reciprocity and care**
- Differentiates PawPop from “AI art tools” by emphasizing **narrative intimacy**
- Creates a scalable foundation for a **credit-based creative studio economy** applicable across products (books, posters, keepsakes)

---

## **2. 🌈 Product Vision**

> “You don’t just use PawPop — you meet a little artist who wants to make something for you.”
> 

Through the lens of **Shtuu**, a shy, fuzzy monster who loves human movies, music, and pets, users enter a whimsical world where art generation becomes a co-creative, story-driven process.

The goal is to convert curiosity into emotional attachment — and emotional attachment into subscription behavior.

---

## **3. 🧭 Goals & Success Metrics**

| **Goal** | **Metric** | **Target** |
| --- | --- | --- |
| **Drive user activation** | % of users who complete first artwork | ≥ 60% |
| **Deliver “aha moment”** | Avg. time to first generated art | < 90 sec |
| **Increase viral spread** | % of users who share their free artwork | ≥ 20% |
| **User Feedback** | Survey of Artwork satisfaction | > 60% |
| **Email Capture** | Users who enter email | >30% |
| **Convert free → paid** | % of free users who subscribe or buy credits | ≥ 10% |
| **Sustain engagement** | Returning sessions per user / week | ≥ 1.5x baseline |

---

## **4. 🧱 Core Experience Flow**

### **4.1 Overview**

Users meet **Shtuu**, who guides them through a short, emotionally charged creative conversation.

They co-create a parody-style pet poster (e.g. *The Dogfather, Claws, Nevermind*), receive a free preview, and are invited to support Shtuu with “snacks” or “art supplies” (credits) to continue creating.

### **4.2 Step-by-Step Flow**

| **Step** | **Description** | **Emotional Goal, What users are thinking** | **Desired User Action Outcome** |
| --- | --- | --- | --- |
| 1️⃣ Landing page: Meet Shtuu | Charming still image of Shtuu, Pixel, and his studio full of paintings and posters | Charm, curiosity, oh this is so cute | None |
| 2️⃣ First interaction | Shtuu asks in a dialogue box: ”I love making art of pets. Do you have a pet?” 

Dialogue box with the options:
Dog
Cat | Oh I can engage with Shtuu, let me reply back. This looks fun | Click response |
| Image upload | New dialogue box in the text-based game, from shtuu

”I love doggies/kitties! Show me a picture and I will make something for my new friend”

UI element saying “Drag and drop Images” | Do I have a photo on my phone?

Can I trust this?

 | Upload workable image |
| 3️⃣ Creative Loading | “So cute! I have a great idea for something… ”

sequence of images showing Shtuu painting, working on his laptop, petting Pixel | Anticipation, delight at animation sequence | Visual delight |
| 4️⃣ Reveal | text: “I got the idea from a moving picture I watched. Humans are so creative!”

Shows a parody of Godfather or Jaws, depending on dog or cat.

 | laughter, delight, oh so cute and clever

Maybe disappointment, weirded out by generation mistake or artefact

 | CTA → “Enter email so I can mail it to you” |

## **4.3 Further steps beyond MVP**

| 5️⃣ Dialogue options Prompt | “Did I do a good job? I might have made a mistake… let’s fix it together”“Do you have any ideas? I’ll make more for you!””See my other art ideas, or if you have your own, let’s work together” | Ongoing engagement | Try a more hands on interaction with Shtuu : CTA → Edit Image, Try New Idea, See Shtuu’s Other Ideas |
| --- | --- | --- | --- |
| 6️⃣ Co-creating Images | Editing images with Shtuu, or creating new parodies and new images from scratch | Demonstrate value: it is fun to create art with Shtuu |  |
| Snack / Credit System | Shtuu says: “I make more art when you send me snacks or art supplies!” | Reciprocity, care | Credit/subscription purchase |

---

# **5. 💰 Monetization Model**

### **5.1 Freemium Layer**

| **Tier** | **Access** | **Description** |
| --- | --- | --- |
| **Free** | 1 generated artwork (low-res, watermark) | “First taste of magic” |
| **Credit Pack** | 5–20 credits | 1 credit = 1 artwork |
| **Subscription (“Snacks for Shtuu”)** | Monthly recurring | Auto-refill credits; unlocks exclusive art sets, faster generations, and secret prompts |

### **5.2 Narrative Framing**

Instead of “buy credits,” users “feed” Shtuu art supplies or snacks.

- **Snack Pack** = Small credit pack (impulse buy)
- **Art Supply Crate** = Large pack (subscription tier)
    
    → Keeps the emotional loop lighthearted and story-consistent.
    

---

## **6. 🎨 Character Design & Tone**

| **Element** | **Description** |
| --- | --- |
| **Appearance** | Shy furry creature, gentle eyes, small horns, lives in a cozy studio full of sketches and books |
| **Voice** | Curious, kind, slightly awkward (childlike sincerity) |
| **Catchphrases** | “I hope you’ll like it…” / “Your pet looks so cool in this!” / “Snacks make me draw faster!” |
| **Behavior** | Draws inspiration from user answers; reacts to each with warmth and surprise |
| **Emotion Design** | Users should *feel protective* of Shtuu — evoking empathy and care |

---

## **7. 🪄 Feature Details**

Prototype: questionnaire → backend image generation → email capture

### **7.1 Conversational Questionnaire**

- 2–3 short questions → no typing required except pet name.
- Each answer triggers small animation or dialogue reaction.

### **7.2 AI Generation Engine**

- Uses stored parody templates (e.g., “Claws,” “Dogfather”) + user’s pet photo.
- Returns low-res preview for free tier; upscaled version gated behind credits.

# Beyond MVP

### **7.3 Snack / Art Supply Economy**

| **Action** | **Credit Cost** | **Result** |
| --- | --- | --- |
| Generate new poster | 1 credit | Instant artwork |
| Request variation | 0.5 credit | “Shtuu tries again!” |
| Print poster | 3 credits | Redirect to checkout |
| Subscribe | Monthly refill (10–20 credits) | Bonus “mystery art” monthly |

---

## **8. 📊 Data & Analytics**

| **Event** | **What to Track** | **Purpose** |
| --- | --- | --- |
| onboarding_start | user_id, timestamp | Funnel tracking |
| first_art_generated | time_elapsed, parody_type | Activation speed |
| credit_purchase | amount, pack_type | Monetization tracking |
| poster_shared | platform, conversion from shares | Virality |
| return_visit | days_since_last | Engagement retention |

---

## **9. 🧪 Experiments & A/B Tests**

---

## **10. 📅 Roadmap**

| **Phase** | **Deliverable** | **Target Date** |
| --- | --- | --- |
| **v1** | Prototype: questionnaire → backend image generation → email capture | Oct 31 |
| **v2** | Snack/credit backend + Stripe integration |  |
| **v3** | Subscription logic + recurring rewards |  |
| **v4** | Personal idea input (“Do you have any ideas?” prompt) |  |

---

---

## **12. 🔮 Future Extensions**

- **Shtuu’s Gallery:** Users can showcase and trade artworks.
- **Collab Mode:** “Shtuu and You” co-op creation for couples/friends.
- **Seasonal Drops:** Limited-edition parody packs (holiday, Oscars, etc.)
- **Emotional AI:** Shtuu adapts tone to user sentiment (“You seem curious today!”).

---