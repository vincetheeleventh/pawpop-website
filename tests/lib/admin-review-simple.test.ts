import { describe, it, expect, beforeEach } from 'vitest'
import { 
  isHumanReviewEnabled,
  shouldCreateReview
} from '@/lib/admin-review'

describe('Admin Review System - Core Functions', () => {
  beforeEach(() => {
    // Reset environment variable
    delete process.env.ENABLE_HUMAN_REVIEW
  })

  describe('isHumanReviewEnabled', () => {
    it('should return true when ENABLE_HUMAN_REVIEW is "true"', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      expect(isHumanReviewEnabled()).toBe(true)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is "false"', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      expect(isHumanReviewEnabled()).toBe(false)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is not set', () => {
      expect(isHumanReviewEnabled()).toBe(false)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is any other value', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'maybe'
      expect(isHumanReviewEnabled()).toBe(false)
    })
  })

  describe('shouldCreateReview', () => {
    it('should return false when human review is disabled', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      expect(shouldCreateReview('artwork_proof')).toBe(false)
      expect(shouldCreateReview('highres_file')).toBe(false)
    })

    it('should return true when human review is enabled', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      expect(shouldCreateReview('artwork_proof')).toBe(true)
      expect(shouldCreateReview('highres_file')).toBe(true)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is not set', () => {
      expect(shouldCreateReview('artwork_proof')).toBe(false)
      expect(shouldCreateReview('highres_file')).toBe(false)
    })
  })
})
