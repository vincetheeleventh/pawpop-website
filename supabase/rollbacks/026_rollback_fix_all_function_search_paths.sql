-- Rollback Migration: Fix search_path for all functions
-- Created: 2025-10-15
-- Description: Removes SET search_path = '' from all functions (reverts to mutable search paths)

-- Note: This rollback removes the security fix and should only be used if there are compatibility issues
-- The original functions will have mutable search paths after this rollback

-- Simply re-run the original function definitions without SET search_path = ''
-- This is not recommended for production as it reintroduces security warnings
