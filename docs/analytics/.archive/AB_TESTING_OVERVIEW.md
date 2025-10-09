# A/B Testing Overview

Cross-device and variant consistency for pricing experiments.

## Docs
- `PRICE_VARIANT_CROSS_DEVICE_CONSISTENCY.md` — Hybrid approach (DB + URL params) to keep price variant consistent across devices.

## Key Ideas
- Priority chain: URL param > DB value > localStorage > default
- Emails append `?pv=` to sync variant on new devices
- Artwork page respects URL override and persists to localStorage
