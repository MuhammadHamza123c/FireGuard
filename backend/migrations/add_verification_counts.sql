-- Run this in Supabase SQL Editor before using verification voting
ALTER TABLE fire_detections
  ADD COLUMN IF NOT EXISTS verification_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_verified_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0;
