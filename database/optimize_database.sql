-- RENTEASE Database Optimization Script
-- Run this to optimize database performance

-- ============================================
-- 1. ADD PERFORMANCE INDEXES
-- ============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Boarding houses indexes
CREATE INDEX IF NOT EXISTS idx_boarding_houses_owner ON boarding_houses(owner_id);
CREATE INDEX IF NOT EXISTS idx_boarding_houses_created ON boarding_houses(created_at);

-- Rooms indexes
CREATE INDEX IF NOT EXISTS idx_rooms_boarding_house ON rooms(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_rooms_available ON rooms(is_available);
CREATE INDEX IF NOT EXISTS idx_rooms_house_available ON rooms(boarding_house_id, is_available);

-- Reservations indexes
CREATE INDEX IF NOT EXISTS idx_reservations_seeker ON reservations(seeker_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_seeker_status ON reservations(seeker_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_reservation ON payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_status ON payments(reservation_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_reservation ON feedback(reservation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_boarding_house ON feedback(boarding_house_id);
CREATE INDEX IF NOT EXISTS idx_feedback_visible ON feedback(is_visible);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp ON activity_logs(user_id, timestamp);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);

-- Uploads indexes
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploads_entity ON uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at);

-- Parent-seeker links indexes
CREATE INDEX IF NOT EXISTS idx_parent_seeker_links_parent ON parent_seeker_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_seeker_links_seeker ON parent_seeker_links(seeker_id);
CREATE INDEX IF NOT EXISTS idx_parent_seeker_links_status ON parent_seeker_links(status);
CREATE INDEX IF NOT EXISTS idx_parent_seeker_links_parent_status ON parent_seeker_links(parent_id, status);

-- ============================================
-- 2. OPTIMIZE TABLES
-- ============================================

OPTIMIZE TABLE users;
OPTIMIZE TABLE boarding_houses;
OPTIMIZE TABLE rooms;
OPTIMIZE TABLE reservations;
OPTIMIZE TABLE payments;
OPTIMIZE TABLE feedback;
OPTIMIZE TABLE activity_logs;
OPTIMIZE TABLE error_logs;
OPTIMIZE TABLE uploads;
OPTIMIZE TABLE parent_seeker_links;

-- ============================================
-- 3. ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================================

ANALYZE TABLE users;
ANALYZE TABLE boarding_houses;
ANALYZE TABLE rooms;
ANALYZE TABLE reservations;
ANALYZE TABLE payments;
ANALYZE TABLE feedback;
ANALYZE TABLE activity_logs;
ANALYZE TABLE error_logs;
ANALYZE TABLE uploads;
ANALYZE TABLE parent_seeker_links;

-- ============================================
-- 4. CHECK TABLE STATUS
-- ============================================

SELECT 
    TABLE_NAME,
    ENGINE,
    TABLE_ROWS,
    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS 'Data Size (MB)',
    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS 'Index Size (MB)',
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Total Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'rentease_db'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;

-- ============================================
-- 5. CHECK INDEX USAGE
-- ============================================

SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'rentease_db'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- 6. CLEANUP OLD DATA (OPTIONAL)
-- ============================================

-- Delete activity logs older than 90 days
-- DELETE FROM activity_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete error logs older than 30 days
-- DELETE FROM error_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- ============================================
-- OPTIMIZATION COMPLETE
-- ============================================

SELECT 'Database optimization complete!' AS Status;
