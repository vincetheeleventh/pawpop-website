# PawPop Backend Documentation

This directory contains comprehensive documentation for the PawPop backend system.

## 📁 Directory Structure

### `/architecture/`
High-level system design and implementation overview
- `BACKEND_IMPLEMENTATION.md` - Complete backend architecture and API documentation

### `/database/`
Database schema, migrations, and management
- `DATABASE_SCHEMA_MANAGEMENT.md` - Migration system and workflow
- `DATABASE_ENVIRONMENTS.md` - Environment setup (local, staging, production)
- `SIMPLIFIED_DATABASE_STRATEGY.md` - Pre-launch development strategy
- `MIGRATION_STRATEGY.md` - Clean schema migration plan
- `SUPABASE_SCHEMA.sql` - Current production schema
- `SUPABASE_SCHEMA_CLEAN.sql` - Proposed clean schema
- `SUPABASE_SETUP.md` - Basic Supabase configuration
- `LOCAL_SUPABASE_SETUP.md` - Local development setup

### `/integrations/`
Third-party service integrations
- `STRIPE_INTEGRATION.md` - Payment processing
- `PRINTIFY_INTEGRATION.md` - Print-on-demand fulfillment
- `FLUX_INTEGRATION.md` - AI image generation (FAL.ai)
- `EMAIL_INTEGRATION.md` - Email notifications (Resend)
- `EMAIL_DOMAIN_PROTECTION.md` - Email security and testing

### `/features/`
Specific feature implementations
- `ARTWORK_DISPLAY_PAGE.md` - Artwork viewing and sharing
- `UPLOAD_COMPLETION_FLOW.md` - Photo upload workflow
- `UPSCALING_IMPLEMENTATION.md` - High-resolution image processing

### `/testing/`
Testing strategies and guides
- `BACKEND_TESTING_GUIDE.md` - Comprehensive testing framework

## 🚀 Quick Start

1. **Database Setup**: Start with `/database/SIMPLIFIED_DATABASE_STRATEGY.md`
2. **Schema Changes**: Use `/database/DATABASE_SCHEMA_MANAGEMENT.md`
3. **API Overview**: See `/architecture/BACKEND_IMPLEMENTATION.md`
4. **Testing**: Follow `/testing/BACKEND_TESTING_GUIDE.md`

## 🔄 Development Workflow

```bash
# Schema changes
npm run migration:create "description"
npm run migration:apply file.sql

# Testing
npm run test:integration
npm run test:contract

# Health checks
npm run migration:health
```

## 📋 Key Components

- **Database**: Supabase PostgreSQL with RLS policies
- **Authentication**: Anonymous users with email-based access
- **File Storage**: UploadThing for image uploads
- **AI Generation**: FAL.ai Flux Pro for artwork creation
- **Payments**: Stripe for checkout and webhooks
- **Fulfillment**: Printify for physical product orders
- **Email**: Resend for customer notifications

## 🛡️ Production Safety

All schema changes go through the migration system with:
- Git-tracked versioning
- Automatic rollback scripts
- Health monitoring
- Environment separation at launch
