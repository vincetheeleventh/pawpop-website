# Supabase Setup Guide

## Step 1: Get Your Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon (top right)
3. Go to "Access Tokens"
4. Create a new token or copy an existing one

## Step 2: Set Environment Variable

Add this to your shell profile (`.bashrc`, `.zshrc`, etc.):
```bash
export SUPABASE_ACCESS_TOKEN=your_access_token_here
```

Or run temporarily:
```bash
export SUPABASE_ACCESS_TOKEN=your_access_token_here
```

## Step 3: Verify Connection

Once the token is set, we can proceed with creating the database schema.

## Required Environment Variables

Make sure you also have these in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

You can find these in your Supabase project settings under "API".
