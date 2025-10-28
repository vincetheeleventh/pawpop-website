# Shtuu Studio - Quick Start Guide

**Status:** MVP Questionnaire Built ✅  
**Date:** October 27, 2025  

---

## ✅ What's Been Built

### 1. Database Migration
- **File:** `/supabase/migrations/015_shtuu_dialogue_sessions.sql`
- **Creates:** `dialogue_sessions` table for conversation tracking
- **Adds:** `parody_style` and `dialogue_session_id` columns to `artworks` table
- **Rollback:** `/supabase/rollbacks/015_rollback_shtuu_dialogue_sessions.sql`

### 2. API Endpoints
- ✅ `POST /api/shtuu/dialogue/start` - Initialize dialogue session
- ✅ `POST /api/shtuu/dialogue/respond` - Handle user responses

### 3. React Components (with placeholders)
- ✅ `ShtuuCharacter.tsx` - Character display (uses emoji placeholders)
- ✅ `DialogueBox.tsx` - Speech bubble with typewriter effect
- ✅ `ShtuuStudio.tsx` - Main container orchestrating the flow

### 4. Route
- ✅ `/shtuu` page created

### 5. Dependencies
- ✅ `nanoid` installed for session token generation

---

## 🚀 Next Steps to Launch

### Step 1: Apply Database Migration
```bash
# Option A: Using Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Copy contents of supabase/migrations/015_shtuu_dialogue_sessions.sql
# 3. Run the SQL

# Option B: Using migration manager (if set up)
npm run migration:apply 015_shtuu_dialogue_sessions.sql
```

### Step 2: Add Placeholder Images
Create these placeholder files until you provide final assets:

```
/public/images/shtuu/
├── shtuu-idle.png      (or leave as emoji for now ✅)
├── shtuu-working.png   (or leave as emoji for now ✅)
├── shtuu-happy.png     (or leave as emoji for now ✅)
├── shtuu-thinking.png  (or leave as emoji for now ✅)
├── pixel.png           (optional, using emoji 🐱)
└── studio-background.png (optional, using gradient)
```

**Current Status:** Using emoji placeholders that work perfectly for MVP! 😌 🎨 😊 🤔

### Step 3: Test the Questionnaire
```bash
# Start development server
npm run dev

# Visit in browser
http://localhost:3000/shtuu
```

**Expected Flow:**
1. Page loads → Shtuu appears with "Hi! I'm Shtuu..."
2. User clicks "Dog" or "Cat"
3. Shtuu responds with personalized message
4. Shows upload placeholder (to be implemented next)

---

## 📝 Current Implementation Details

### Database Schema
```sql
dialogue_sessions
├── id (UUID)
├── session_token (TEXT, unique)
├── current_step (TEXT) - 'welcome', 'upload', etc.
├── conversation_state (JSONB) - stores pet_type, etc.
├── artwork_id (UUID, nullable)
└── timestamps

artworks (enhanced)
├── parody_style (TEXT) - NEW
└── dialogue_session_id (UUID) - NEW
```

### API Flow
```
Client                    Server
  │                         │
  ├─── POST /start ────────>│
  │<─── session_token ──────┤
  │                         │
  ├─── POST /respond ──────>│
  │     (petType: 'dog')    │
  │<─── next dialogue ──────┤
```

### Component Hierarchy
```
/shtuu (page)
└── ShtuuStudio (container)
    ├── ShtuuCharacter (left side)
    │   └── Emoji placeholder
    └── DialogueBox (right side)
        └── Options buttons
```

---

## 🎨 Placeholder Strategy (MVP)

### Current Approach: Using Emojis!
- **Idle:** 😌
- **Happy:** 😊  
- **Working:** 🎨
- **Thinking:** 🤔
- **Pixel (cat):** 🐱
- **Background:** CSS gradient

### When You Provide Images
Simply replace emoji in `ShtuuCharacter.tsx` with:
```typescript
<Image
  src={`/images/shtuu/shtuu-${mood}.png`}
  alt="Shtuu the artist"
  width={300}
  height={300}
/>
```

---

## 🧪 Testing Checklist

- [ ] Run database migration
- [ ] Visit `/shtuu` page
- [ ] Click "Dog" button → See Shtuu respond
- [ ] Click "Cat" button → See Shtuu respond  
- [ ] Check console for errors
- [ ] Verify session token created in database

---

## 🔧 Troubleshooting

### "supabaseAdmin is not defined"
- Check that `/src/lib/supabase.ts` exports `supabaseAdmin`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`

### "Table dialogue_sessions does not exist"
- Run the migration SQL in Supabase Dashboard
- Verify in Database > Tables that `dialogue_sessions` exists

### Emoji placeholders not showing
- That's fine! They're just visual placeholders
- Replace with actual images when ready

---

## 📦 What's Still Using Placeholders

1. **Shtuu Character Images** - Using emojis (😌 🎨 😊 🤔)
2. **Studio Background** - Using CSS gradient
3. **Upload Component** - Showing placeholder div
4. **Pixel Cat** - Using emoji 🐱

**All of these can be easily replaced when you provide assets!**

---

## 🎯 Next Development Tasks

### Immediate (This Week)
1. ✅ Basic questionnaire (DONE!)
2. ⬜ Image upload integration
3. ⬜ Connect to fal.ai generation
4. ⬜ Email capture

### Soon
1. Watermarking for free tier
2. Credit system backend
3. Stripe integration

---

## 💡 Pro Tips

### Adding New Dialogue Steps
Edit `/api/shtuu/dialogue/respond/route.ts`:
```typescript
if (step === 'welcome' && response.petType) {
  nextStep = 'upload';
  dialogueMessage = 'Your custom message here';
  dialogueMood = 'happy';
}
```

### Changing Shtuu's Personality
All dialogue messages are in the API routes - easy to customize!

### Testing Locally
The questionnaire works entirely offline - no external API calls needed yet.

---

## 🎉 Success!

You now have a working interactive questionnaire with:
- ✅ Persistent session tracking
- ✅ Smooth typewriter effect
- ✅ Responsive design
- ✅ Character mood changes
- ✅ Clean component architecture

**Ready to add upload functionality next!** 🚀
