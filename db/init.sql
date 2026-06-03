CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    total_budget DECIMAL(10, 2) NOT NULL,
    spent_budget DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE influencers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle VARCHAR(255) UNIQUE NOT NULL,
    follower_count INT,
    engagement_rate DECIMAL(5, 2),
    estimated_cpm DECIMAL(10, 2),
    metadata JSONB
);

CREATE TABLE outreach_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    influencer_id UUID REFERENCES influencers(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    max_authorized_budget DECIMAL(10, 2) NOT NULL,
    current_offer DECIMAL(10, 2) DEFAULT NULL,
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_followup_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, influencer_id)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES outreach_threads(id),
    sender_type VARCHAR(50) CHECK (sender_type IN ('AGENT', 'INFLUENCER')),
    content TEXT NOT NULL,
    detected_intent VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
