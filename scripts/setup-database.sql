-- 0gSecura Database Setup Script
-- Run this script to create the necessary database tables

-- Create database (run as postgres superuser)
-- CREATE DATABASE ogsecura;
-- CREATE USER ogsecura WITH PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE ogsecura TO ogsecura;

-- Connect to ogsecura database and run the following:

-- Create blacklist entries table
CREATE TABLE IF NOT EXISTS blacklist_entries (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('address', 'domain', 'contract', 'url')),
    value VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('scam', 'phishing', 'honeypot', 'rug-pull', 'malware', 'fake-website', 'suspicious')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    source VARCHAR(100) NOT NULL CHECK (source IN ('community', 'expert', 'automated', 'threat-intel', 'partner')),
    description TEXT NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disputed', 'resolved', 'false-positive')),
    confidence INTEGER DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
    evidence JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    related_entries TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL CHECK (type IN ('phishing', 'scam-token', 'malicious-contract', 'rug-pull', 'honeypot', 'fake-website')),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    affected_address VARCHAR(500) NOT NULL,
    affected_domain VARCHAR(500),
    reported_by VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false-positive')),
    affected_users INTEGER DEFAULT 0,
    evidence JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'community-verified', 'expert-verified')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create storage metadata table for 0G Storage tracking
CREATE TABLE IF NOT EXISTS storage_metadata (
    root_hash VARCHAR(255) PRIMARY KEY,
    content_type VARCHAR(100),
    size_bytes BIGINT,
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    tx_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'uploaded' CHECK (status IN ('uploading', 'uploaded', 'failed', 'deleted'))
);

-- Create user sessions table (for future authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    wallet_address VARCHAR(42),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist_entries(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist_entries(value);
CREATE INDEX IF NOT EXISTS idx_blacklist_status ON blacklist_entries(status);
CREATE INDEX IF NOT EXISTS idx_blacklist_severity ON blacklist_entries(severity);
CREATE INDEX IF NOT EXISTS idx_blacklist_timestamp ON blacklist_entries(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON security_alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_affected_address ON security_alerts(affected_address);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON security_alerts(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_storage_upload_time ON storage_metadata(upload_time DESC);
CREATE INDEX IF NOT EXISTS idx_storage_status ON storage_metadata(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_blacklist_entries_updated_at BEFORE UPDATE ON blacklist_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_alerts_updated_at BEFORE UPDATE ON security_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO blacklist_entries (id, type, value, category, severity, source, description, reported_by, status, confidence) VALUES
('bl_test_001', 'address', '0x0000000000000000000000000000000000000001', 'scam', 'critical', 'expert', 'Test scam address for demonstration', 'System', 'active', 95),
('bl_test_002', 'domain', 'test-phishing.example.com', 'phishing', 'high', 'automated', 'Test phishing domain for demonstration', 'AutoScanner', 'active', 88)
ON CONFLICT (id) DO NOTHING;

INSERT INTO security_alerts (id, type, severity, title, description, affected_address, reported_by, status) VALUES
('alert_test_001', 'scam-token', 'critical', 'Test Scam Token Alert', 'This is a test alert for demonstration purposes', '0x0000000000000000000000000000000000000002', 'System', 'active'),
('alert_test_002', 'phishing', 'high', 'Test Phishing Alert', 'This is a test phishing alert for demonstration', 'https://test-phishing.example.com', 'System', 'active')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to ogsecura user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ogsecura;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ogsecura;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO ogsecura;

-- Display success message
SELECT '✅ Database setup completed successfully!' AS status;
SELECT 'Tables created: ' || count(*) || ' tables' AS summary FROM information_schema.tables WHERE table_schema = 'public';
