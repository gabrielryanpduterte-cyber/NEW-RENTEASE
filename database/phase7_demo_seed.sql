-- Phase 7 Demo Data Seed
-- Prerequisite: schema already exists (use rentease_final_phase7.sql for full restore).

SET time_zone = "+08:00";
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE feedback;
TRUNCATE TABLE error_logs;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE payments;
TRUNCATE TABLE reservations;
TRUNCATE TABLE rooms;
TRUNCATE TABLE boarding_house;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (user_id, full_name, email, password_hash, role, contact_number, account_status, created_at) VALUES
(1, 'System Administrator', 'admin@rentease.local', '$2y$12$y7nCCZDXVoJ0Py85deHbmumVvnz1ZjKeJsRfWf/ArTp09vWdWl/E.', 'admin', '09170000001', 'active', '2026-01-10 09:00:00'),
(2, 'Olivia Ramos', 'owner@rentease.local', '$2y$12$UAqLNlKBJ5m31I1DC7SiJOYx1EQGQgGCWvCvKE4O9YtKKoREjkNOG', 'owner', '09170000002', 'active', '2026-01-10 09:10:00'),
(3, 'Ethan Cruz', 'seeker@rentease.local', '$2y$12$BCT/9GZyN/pFUzVzZZUNHur2y0imNoxrFxn4acCus/xNq.F4GsdBW', 'seeker', '09170000003', 'active', '2026-01-10 09:20:00'),
(4, 'Mia Fernandez', 'parent@rentease.local', '$2y$12$aXX5g6cvJD6qVwaUll/gkuW9lnItiW5jwuC2d2DkvKYsLO6iiZAKW', 'parent', '09170000004', 'active', '2026-01-10 09:30:00');

INSERT INTO boarding_house (boarding_house_id, owner_id, house_name, address, description, house_rules) VALUES
(1, 2, 'Sunrise Residences', '123 Mabini St, Baguio City', 'Mixed solo and shared rooms near major schools.', 'Observe quiet hours after 10:00 PM. No smoking indoors.');

INSERT INTO rooms (room_id, boarding_house_id, room_number, room_type, capacity, monthly_rate, amenities, availability_status) VALUES
(1, 1, 'A101', 'solo', 1, 4500.00, 'Bed, study table, cabinet, wifi', 'occupied'),
(2, 1, 'A102', 'shared', 2, 3500.00, 'Bunk bed, fan, wifi', 'available'),
(3, 1, 'A103', 'solo', 1, 4000.00, 'Bed, cabinet', 'unavailable'),
(4, 1, 'B201', 'shared', 3, 3200.00, '3 beds, fan, wifi', 'occupied');

INSERT INTO reservations (reservation_id, user_id, room_id, date_submitted, move_in_date, status, remarks) VALUES
(1, 3, 1, '2026-03-01 10:00:00', '2026-03-10', 'approved', 'Ready for move-in'),
(2, 3, 2, '2026-04-05 11:20:00', '2026-05-01', 'pending', 'Waiting for owner review'),
(3, 4, 4, '2026-03-15 08:45:00', '2026-04-01', 'approved', 'Parent-assisted booking'),
(4, 4, 3, '2026-04-12 16:05:00', '2026-05-10', 'rejected', 'Room unavailable for requested date'),
(5, 3, 4, '2026-04-20 13:33:00', '2026-05-20', 'rejected', 'Capacity already reached');

INSERT INTO payments (payment_id, reservation_id, user_id, room_id, amount_due, amount_paid, payment_status, payment_date, billing_period, recorded_by) VALUES
(1, 1, 3, 1, 4500.00, 4500.00, 'paid', '2026-03-15', '2026-03', 2),
(2, 1, 3, 1, 4500.00, 2000.00, 'unpaid', '2026-04-15', '2026-04', 2),
(3, 3, 4, 4, 3200.00, 3200.00, 'paid', '2026-04-20', '2026-04', 2),
(4, 3, 4, 4, 3200.00, 0.00, 'unpaid', '2026-04-26', '2026-05', 2);

INSERT INTO activity_logs (log_id, user_id, action_performed, affected_module, `timestamp`) VALUES
(1, 1, 'User login', 'auth', '2026-04-27 08:00:00'),
(2, 2, 'User login', 'auth', '2026-04-27 08:05:00'),
(3, 3, 'User login', 'auth', '2026-04-27 08:08:00'),
(4, 3, 'Created reservation #2', 'reservations', '2026-04-05 11:21:15'),
(5, 2, 'Updated reservation #1', 'reservations', '2026-03-02 09:10:44'),
(6, 2, 'Created payment #2', 'payments', '2026-04-15 10:01:00'),
(7, 4, 'User login', 'auth', '2026-04-27 08:20:00'),
(8, 4, 'Submitted feedback #2', 'feedback', '2026-04-21 14:42:11'),
(9, 1, 'Viewed reports dashboard', 'reports', '2026-04-27 09:00:00'),
(10, 1, 'Viewed activity logs', 'activity_logs', '2026-04-27 09:05:00'),
(11, 1, 'Viewed error logs', 'error_logs', '2026-04-27 09:06:00'),
(12, 2, 'Viewed reports dashboard', 'reports', '2026-04-27 09:12:00');

INSERT INTO error_logs (error_id, error_code, error_message, affected_user_id, `timestamp`) VALUES
(1, 'AUTH_LOGIN_FAILED', 'Failed login for email invalid-user@rentease.local', NULL, '2026-04-26 18:10:33'),
(2, 'PAYMENT_VALIDATION', 'payment_status must be paid or unpaid.', 2, '2026-04-26 18:20:11'),
(3, 'FEEDBACK_DUPLICATE', 'Feedback already exists for this reservation.', 3, '2026-04-26 19:03:59');

INSERT INTO feedback (feedback_id, user_id, reservation_id, rating, comment, status, created_at, updated_at) VALUES
(1, 3, 1, 5, 'Great room and very responsive owner. Process was smooth.', 'visible', '2026-04-10 12:10:00', NULL),
(2, 4, 3, 4, 'Clean room and fair rent. We requested minor maintenance.', 'hidden', '2026-04-21 14:40:00', '2026-04-22 09:15:00');

ALTER TABLE users AUTO_INCREMENT = 5;
ALTER TABLE boarding_house AUTO_INCREMENT = 2;
ALTER TABLE rooms AUTO_INCREMENT = 5;
ALTER TABLE reservations AUTO_INCREMENT = 6;
ALTER TABLE payments AUTO_INCREMENT = 5;
ALTER TABLE activity_logs AUTO_INCREMENT = 13;
ALTER TABLE error_logs AUTO_INCREMENT = 4;
ALTER TABLE feedback AUTO_INCREMENT = 3;
