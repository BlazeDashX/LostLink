-- LostLink Relational Database Schema for PostgreSQL / Neon
-- Clean teardown in reverse dependency order
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('User', 'Admin')),
    status VARCHAR(12) NOT NULL CHECK (status IN ('Active', 'Suspended')),
    avatar TEXT NULL
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    icon TEXT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. ITEMS TABLE
CREATE TABLE items (
    id VARCHAR(16) PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('Lost', 'Found')),
    title VARCHAR(150) NOT NULL,
    category_id VARCHAR(16) NOT NULL REFERENCES categories(id),
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    image TEXT NULL,
    reporter_id VARCHAR(16) NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Active', 'Pending Claim', 'Reserved', 'Delivered', 'Received', 'Solved', 'Hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CLAIMS TABLE
CREATE TABLE claims (
    id VARCHAR(20) PRIMARY KEY,
    item_id VARCHAR(16) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    claimant_id VARCHAR(16) NOT NULL REFERENCES users(id),
    identifying_detail TEXT NOT NULL,
    loss_context TEXT NOT NULL,
    private_evidence TEXT NOT NULL,
    handover_method VARCHAR(40) NOT NULL,
    status VARCHAR(12) NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed')),
    reviewed_by VARCHAR(16) NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CONVERSATIONS TABLE
CREATE TABLE conversations (
    id VARCHAR(20) PRIMARY KEY,
    item_id VARCHAR(16) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    participant_one_id VARCHAR(16) NOT NULL REFERENCES users(id),
    participant_two_id VARCHAR(16) NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MESSAGES TABLE
CREATE TABLE messages (
    id VARCHAR(20) PRIMARY KEY,
    conversation_id VARCHAR(20) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    item_id VARCHAR(16) NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    sender_id VARCHAR(16) NOT NULL REFERENCES users(id),
    receiver_id VARCHAR(16) NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT FALSE
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE notifications (
    id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(16) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    related_id VARCHAR(20) NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES for Query Optimization
CREATE INDEX idx_items_reporter ON items(reporter_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_claims_item ON claims(item_id);
CREATE INDEX idx_claims_claimant ON claims(claimant_id);
CREATE INDEX idx_conversations_item ON conversations(item_id);
CREATE INDEX idx_conversations_p1 ON conversations(participant_one_id);
CREATE INDEX idx_conversations_p2 ON conversations(participant_two_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
