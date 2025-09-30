#!/bin/bash

# Email-First Flow Implementation Validation Script
# Checks that all required files and configurations are in place

echo "🔍 Email-First Flow Implementation Validation"
echo "=============================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 (missing)"
        ((ERRORS++))
    fi
}

warn() {
    echo -e "${YELLOW}⚠${NC}  $1"
    ((WARNINGS++))
}

info() {
    echo -e "ℹ  $1"
}

echo "📁 Checking Required Files..."
echo ""

# Database Migration
echo "Database Migration:"
check_file "supabase/migrations/018_add_deferred_upload_tracking.sql"
check_file "supabase/rollbacks/018_rollback_deferred_upload_tracking.sql"
echo ""

# New Components
echo "Components:"
check_file "src/components/forms/UploadModalEmailFirst.tsx"
check_file "src/app/upload/[token]/page.tsx"
echo ""

# API Endpoints
echo "API Endpoints:"
check_file "src/app/api/email/capture-confirmation/route.ts"
check_file "src/app/api/email/upload-reminder/route.ts"
check_file "src/app/api/artwork/generate-upload-token/route.ts"
check_file "src/app/api/artwork/by-upload-token/route.ts"
echo ""

# Modified Files
echo "Modified Core Files:"
check_file "src/lib/supabase.ts"
check_file "src/lib/email.ts"
check_file "src/hooks/usePlausibleTracking.ts"
echo ""

# Documentation
echo "Documentation:"
check_file "docs/EMAIL_FIRST_FLOW_IMPLEMENTATION.md"
check_file "docs/INTEGRATION_CHECKLIST.md"
check_file "docs/EMAIL_FIRST_FLOW_SUMMARY.md"
check_file "DEPLOY_EMAIL_FIRST_FLOW.md"
echo ""

# Tests
echo "Test Files:"
check_file "tests/email-first-flow/email-templates.test.ts"
check_file "tests/email-first-flow/api-endpoints.test.ts"
check_file "tests/email-first-flow/database-functions.test.ts"
echo ""

# Scripts
echo "Test Scripts:"
check_file "scripts/test-email-first-flow.js"
echo ""

echo "🔧 Checking Configuration..."
echo ""

# Check if TypeScript interface updated
if grep -q "email_captured_at" src/lib/supabase.ts; then
    echo -e "${GREEN}✓${NC} Artwork interface includes email_captured_at"
else
    echo -e "${RED}✗${NC} Artwork interface missing email_captured_at"
    ((ERRORS++))
fi

if grep -q "upload_deferred" src/lib/supabase.ts; then
    echo -e "${GREEN}✓${NC} Artwork interface includes upload_deferred"
else
    echo -e "${RED}✗${NC} Artwork interface missing upload_deferred"
    ((ERRORS++))
fi

if grep -q "upload_token" src/lib/supabase.ts; then
    echo -e "${GREEN}✓${NC} Artwork interface includes upload_token"
else
    echo -e "${RED}✗${NC} Artwork interface missing upload_token"
    ((ERRORS++))
fi

echo ""

# Check email templates
if grep -q "sendEmailCaptureConfirmation" src/lib/email.ts; then
    echo -e "${GREEN}✓${NC} Email capture confirmation template exists"
else
    echo -e "${RED}✗${NC} Email capture confirmation template missing"
    ((ERRORS++))
fi

if grep -q "sendUploadReminder" src/lib/email.ts; then
    echo -e "${GREEN}✓${NC} Upload reminder template exists"
else
    echo -e "${RED}✗${NC} Upload reminder template missing"
    ((ERRORS++))
fi

echo ""

# Check analytics tracking
if grep -q "emailCaptured" src/hooks/usePlausibleTracking.ts; then
    echo -e "${GREEN}✓${NC} Email captured analytics event exists"
else
    echo -e "${YELLOW}⚠${NC}  Email captured analytics event missing"
    ((WARNINGS++))
fi

if grep -q "deferredUpload" src/hooks/usePlausibleTracking.ts; then
    echo -e "${GREEN}✓${NC} Deferred upload analytics event exists"
else
    echo -e "${YELLOW}⚠${NC}  Deferred upload analytics event missing"
    ((WARNINGS++))
fi

echo ""
echo "📋 Summary"
echo "=========="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Ready to deploy. Follow these steps:"
    echo "1. Apply database migration"
    echo "2. Update homepage to use UploadModalEmailFirst"
    echo "3. Configure cron job for reminders"
    echo "4. Deploy to production"
    echo ""
    echo "See DEPLOY_EMAIL_FIRST_FLOW.md for detailed instructions."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠  Checks passed with ${WARNINGS} warning(s)${NC}"
    echo ""
    echo "Implementation is functional but has minor issues."
    echo "Review warnings above before deploying to production."
    exit 0
else
    echo -e "${RED}❌ ${ERRORS} error(s) and ${WARNINGS} warning(s) found${NC}"
    echo ""
    echo "Fix errors above before deploying."
    exit 1
fi
