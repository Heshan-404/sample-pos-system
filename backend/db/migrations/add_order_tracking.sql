-- Add columns to track who added order items and when
-- Migration: add_order_tracking_columns

ALTER TABLE order_items ADD COLUMN added_by_user_id INTEGER;
ALTER TABLE order_items ADD COLUMN added_by_name TEXT;
ALTER TABLE order_items ADD COLUMN added_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE order_items ADD COLUMN batch_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_order_items_batch ON order_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_order_items_table_batch ON order_items(tableNumber, batch_id);
