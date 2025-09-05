# PawPop Website

## Project Structure

```
pawpop-website/
├── .github/                 # GitHub workflows and configurations
├── public/                  # Static files (images, videos, etc.)
├── scripts/                 # Utility scripts
│   └── test/                # Test scripts for manual execution
├── src/                     # Source code
│   ├── app/                 # Next.js app router pages and API routes
│   ├── components/          # React components
│   └── lib/                 # Utility functions and configurations
├── supabase/               # Supabase configurations
├── tests/                  # Test files
│   ├── e2e/                # End-to-end tests
│   ├── integration/        # Integration tests
│   └── unit/               # Unit tests
├── .env.example            # Example environment variables
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Setup

1. Copy the example environment file and update with your credentials:
   ```bash
   cp .env.example .env.local
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Manual Test Scripts
- `npm run test:complete-pipeline` - Test the complete image generation pipeline
- `npm run test:flux` - Test the Flux transformation
- `npm run test:monalisa-maker` - Test the MonaLisa maker
- `npm run test:pet-integration` - Test pet integration
- `npm run test:overlay` - Test the image overlay API
- `npm run test:supabase-direct` - Test direct Supabase connection

## Building for Production

```bash
npm run build
```

## Deployment

Deploy to production:
```bash
npm run start
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

Proprietary - All rights reserved
