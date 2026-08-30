-- WeatherGPT Database Schema
-- PostgreSQL + TimescaleDB for time-series weather data

-- ============================================
-- EXTENSIONS
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial data (optional)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable TimescaleDB for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, basic, premium
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_location ON users(location_lat, location_lng);
CREATE INDEX idx_users_subscription ON users(subscription_tier);

-- ============================================
-- LOCATIONS & GEO-DATA
-- ============================================

CREATE TABLE locations (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    name_local VARCHAR(100), -- Local language name
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    admin_district VARCHAR(100),
    admin_state VARCHAR(100),
    admin_country VARCHAR(100) DEFAULT 'India',
    region_type VARCHAR(50), -- city, district, rural, urban, weather_station
    elevation_m DECIMAL(10, 2),
    timezone VARCHAR(50),
    source VARCHAR(100), -- IMD, OpenStreetMap, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for geospatial queries
CREATE INDEX idx_locations_coords ON locations USING gist (
    ST_MakePoint(lng, lat)::GEOGRAPHY
);

CREATE INDEX idx_locations_coords_2d ON locations USING gist (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY
);

CREATE INDEX idx_locations_district ON locations(admin_district);
CREATE INDEX idx_locations_state ON locations(admin_state);

-- ============================================
-- WEATHER OBSERVATIONS (TIME-SERIES)
-- ============================================

-- Create hypertable for time-series weather data
CREATE TABLE weather_observations (
    observation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature_2m DECIMAL(6, 2),
    apparent_temperature DECIMAL(6, 2),
    pressure_msl DECIMAL(8, 2),
    relative_humidity_2m INTEGER,
    windspeed_10m DECIMAL(6, 2),
    winddirection_10m INTEGER,
    precipitation_sum DECIMAL(10, 2),
    weather_code INTEGER, -- WMO weather code
    visibility DECIMAL(8, 2),
    cloudcover DECIMAL(6, 2),
    uv_index DECIMAL(4, 2),
    soil_temp_0cm DECIMAL(6, 2),
    soil_moisture_0_1 DECIMAL(6, 2),
    dew_point DECIMAL(6, 2),
    data_source VARCHAR(100),
    quality_flag VARCHAR(20) DEFAULT 'verified' -- verified, pending, rejected, estimated
);

-- Create hypertable
SELECT create_hypertable(
    'weather_observations',
    'timestamp',
    if_not_exists: true,
    if_not_exists_chunk_time_interval: INTERVAL '1 hour'
);

-- Indexes for time-series queries
CREATE INDEX idx_observations_time ON weather_observations(timestamp);
CREATE INDEX idx_observations_location ON weather_observations(location_id);
CREATE INDEX idx_observations_weather ON weather_observations(weather_code);
CREATE INDEX idx_observations_precip ON weather_observations(precipitation_sum);
CREATE INDEX idx_observations_humidity ON weather_observations(relative_humidity_2m);

-- ============================================
-- WEATHER FORECASTS (TIME-SERIES)
-- ============================================

CREATE TABLE weather_forecasts (
    forecast_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id),
    model_name VARCHAR(100) NOT NULL, -- GFS, WRF, ECMWF, IFS
    model_version VARCHAR(50),
    model_resolution VARCHAR(50),
    valid_time TIMESTAMPTZ NOT NULL,
    lead_hours INTEGER NOT NULL,
    temperature_2m DECIMAL(6, 2),
    temperature_2m_min DECIMAL(6, 2),
    temperature_2m_max DECIMAL(6, 2),
    apparent_temperature DECIMAL(6, 2),
    precipitation_probability_max INTEGER,
    precipitation_probability_min INTEGER,
    precipitation_sum DECIMAL(10, 2),
    precipitation_type VARCHAR(20), -- rain, snow, hail
    wind_speed_10m DECIMAL(6, 2),
    wind_speed_10m_max DECIMAL(6, 2),
    winddirection_10m INTEGER,
    weather_code INTEGER,
    pressure_msl DECIMAL(8, 2),
    relative_humidity_2m INTEGER,
    cloudcover DECIMAL(6, 2),
    visibility DECIMAL(8, 2),
    uv_index DECIMAL(4, 2),
    confidence_level VARCHAR(20), -- high, medium, low
    ensemble_spread DECIMAL(6, 2), -- Model ensemble spread
    data_source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable(
    'weather_forecasts',
    'valid_time',
    if_not_exists: true,
    if_not_exists_chunk_time_interval: INTERVAL '1 hour'
);

CREATE INDEX idx_forecasts_time ON weather_forecasts(valid_time);
CREATE INDEX idx_forecasts_location ON weather_forecasts(location_id);
CREATE INDEX idx_forecasts_model ON weather_forecasts(model_name);
CREATE INDEX idx_forecasts_lead ON weather_forecasts(lead_hours);
CREATE INDEX idx_forecasts_weather ON weather_forecasts(weather_code);

-- ============================================
-- ALERTS & WARNINGS
-- ============================================

CREATE TABLE weather_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- cyclone, flood, heatwave, heavy_rain, fog, storm, drought
    severity_level VARCHAR(20) NOT NULL, -- watch, warning, severe, critical
    source VARCHAR(100) NOT NULL, -- IMD, IndiaMeteo, internal_model
    title VARCHAR(200) NOT NULL,
    description TEXT,
    affected_districts JSONB, -- Array of district names
    affected_states JSONB, -- Array of state names
    affected_coordinates GEOGRAPHY(POINT, 4326), -- Centroid coordinates
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ, -- NULL for ongoing alerts
    confidence_level DECIMAL(4, 2) DEFAULT 0.85,
    impact_assessment JSONB, -- Population at risk, infrastructure affected
    source_url VARCHAR(500),
    is_urgent BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(user_id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_type ON weather_alerts(alert_type);
CREATE INDEX idx_alerts_severity ON weather_alerts(severity_level);
CREATE INDEX idx_alerts_start_time ON weather_alerts(start_time);
CREATE INDEX idx_alerts_affected_district ON weather_alerts->>'affected_districts';
CREATE INDEX idx_alerts_urgent ON weather_alerts(is_urgent);

-- ============================================
-- USER ALERT SUBSCRIPTIONS
-- ============================================

CREATE TABLE alert_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    location_id UUID REFERENCES locations(location_id),
    alert_types JSONB NOT NULL DEFAULT '[]', -- Array of alert_type
    severity_levels JSONB NOT NULL DEFAULT '[]', -- Array of severity_level
    delivery_channels JSONB NOT NULL DEFAULT '["push"]', -- ['sms', 'push', 'email', 'whatsapp', 'voice']
    notification_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'hourly', 'daily'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subs_user ON alert_subscriptions(user_id);
CREATE INDEX idx_subs_location ON alert_subscriptions(location_id);

-- ============================================
-- CHAT CONVERSATIONS & HISTORY
-- ============================================

CREATE TABLE chat_conversations (
    conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    session_id VARCHAR(100),
    location_id UUID REFERENCES locations(location_id),
    language VARCHAR(10),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conv_user ON chat_conversations(user_id);
CREATE INDEX idx_conv_session ON chat_conversations(session_id);

CREATE TABLE chat_messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(conversation_id),
    role VARCHAR(20) NOT NULL, -- user, assistant, system
    content TEXT NOT NULL,
    language VARCHAR(10),
    sentiment VARCHAR(20), -- positive, negative, neutral, urgent
    intent VARCHAR(100), -- rain_forecast, storm_alert, temperature_check
    entities JSONB, -- {city: "Mumbai", date: "tomorrow"}
    response_time_ms INTEGER,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conv ON chat_messages(conversation_id);
CREATE INDEX idx_messages_user ON chat_messages(user_id);
CREATE INDEX idx_messages_intent ON chat_messages(intent);
CREATE INDEX idx_messages_time ON chat_messages(created_at);

-- ============================================
-- CLIMATE TRENDS & HISTORICAL DATA
-- ============================================

CREATE TABLE climate_trends (
    trend_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(location_id),
    metric VARCHAR(50) NOT NULL, -- temperature, precipitation, monsoon_onset, extreme_events
    period_type VARCHAR(20) NOT NULL, -- monthly, seasonal, annual, decadal
    period_name VARCHAR(100) NOT NULL, -- e.g., "Monsoon 2024", "FY2023-24"
    period_start DATE NOT NULL,
    period_end DATE,
    value DECIMAL(10, 2),
    historical_average DECIMAL(10, 2),
    deviation_from_avg DECIMAL(10, 2),
    percentile_rank DECIMAL(5, 2),
    is_anomaly BOOLEAN DEFAULT FALSE,
    data_quality VARCHAR(20) DEFAULT 'verified',
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trends_location ON climate_trends(location_id);
CREATE INDEX idx_trends_metric ON climate_trends(metric);
CREATE INDEX idx_trends_period ON climate_trends(period_name);

-- ============================================
-- API USAGE LOGS
-- ============================================

CREATE TABLE api_usage_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    request_id VARCHAR(100) UNIQUE,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    payload_size_bytes INTEGER,
    ip_address INET,
    user_agent VARCHAR(500),
    api_key_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON api_usage_logs(user_id);
CREATE INDEX idx_usage_time ON api_usage_logs(created_at);
CREATE INDEX idx_usage_endpoint ON api_usage_logs(endpoint);

-- ============================================
-- NWP MODEL DATA
-- ============================================

CREATE TABLE nwp_model_outputs (
    model_output_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    grid_resolution VARCHAR(50),
    valid_time TIMESTAMPTZ NOT NULL,
    data_source VARCHAR(100),
    variables JSONB, -- {temperature, pressure, humidity, etc.}
    download_url VARCHAR(500),
    file_size_bytes BIGINT,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nwp_model ON nwp_model_outputs(model_name);
CREATE INDEX idx_nwp_time ON nwp_model_outputs(valid_time);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Current weather by location
CREATE VIEW v_current_weather AS
SELECT
    l.location_id,
    l.name,
    l.admin_state,
    l.admin_district,
    w.temperature_2m,
    w.apparent_temperature,
    w.relative_humidity_2m,
    w.windspeed_10m,
    w.weather_code,
    w.precipitation_sum,
    w.quality_flag,
    w.data_source
FROM locations l
JOIN weather_observations w ON l.location_id = w.location_id
WHERE w.timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY l.name;

-- Active alerts view
CREATE VIEW v_active_alerts AS
SELECT
    a.alert_id,
    a.alert_type,
    a.severity_level,
    a.title,
    a.description,
    a.start_time,
    a.affected_districts,
    a.affected_states,
    a.is_urgent
FROM weather_alerts a
WHERE a.start_time <= NOW()
  AND (a.end_time IS NULL OR a.end_time > NOW())
  AND a.is_urgent = FALSE
ORDER BY
    CASE a.severity_level
        WHEN 'critical' THEN 1
        WHEN 'severe' THEN 2
        WHEN 'warning' THEN 3
        ELSE 4
    END,
    a.start_time DESC;

-- Active urgent alerts
CREATE VIEW v_urgent_alerts AS
SELECT * FROM weather_alerts
WHERE is_urgent = TRUE
  AND start_time <= NOW()
ORDER BY start_time DESC;

-- User's subscribed alerts
CREATE VIEW v_user_alert_subscriptions AS
SELECT
    s.subscription_id,
    s.user_id,
    s.location_id,
    l.name as location_name,
    s.alert_types,
    s.severity_levels,
    s.delivery_channels,
    s.notification_frequency
FROM alert_subscriptions s
LEFT JOIN locations l ON s.location_id = l.location_id
WHERE s.is_active = TRUE;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON weather_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Indian Cities)
-- ============================================

-- Insert major Indian cities
INSERT INTO locations (
    name,
    name_local,
    lat,
    lng,
    admin_district,
    admin_state,
    region_type,
    source
) VALUES
    ('Mumbai', 'मुंबई', 19.0760, 72.8777, 'Mumbai', 'Maharashtra', 'city', 'IMD'),
    ('Delhi', 'दिल्ली', 28.7041, 77.1025, 'Central Delhi', 'Delhi', 'city', 'IMD'),
    ('Bengaluru', 'ಬೆಂಗಳೂರು', 12.9716, 77.5946, 'Bengaluru Urban', 'Karnataka', 'city', 'IMD'),
    ('Hyderabad', 'హైదరాబాద్', 17.3850, 78.4867, 'Kamareddy', 'Telangana', 'city', 'IMD'),
    ('Ahmedabad', 'અમદાવાદ', 23.0225, 72.5714, 'Ahmedabad', 'Gujarat', 'city', 'IMD'),
    ('Chennai', 'சென்னை', 13.0827, 80.2707, 'Chennai', 'Tamil Nadu', 'city', 'IMD'),
    ('Kolkata', 'কলকাতা', 22.5726, 88.3639, 'Kolkata', 'West Bengal', 'city', 'IMD'),
    ('Surat', 'સુરત', 21.1702, 72.8311, 'Surat', 'Gujarat', 'city', 'IMD'),
    ('Pune', 'पुणे', 18.5204, 73.8567, 'Pune', 'Maharashtra', 'city', 'IMD'),
    ('Jaipur', 'जयपुर', 26.9124, 75.7873, 'Jaipur', 'Rajasthan', 'city', 'IMD'),
    ('Lucknow', 'लखनऊ', 26.8467, 80.9462, 'Lucknow', 'Uttar Pradesh', 'city', 'IMD'),
    ('Kanpur', 'कानपुर', 26.4499, 80.3319, 'Kanpur Dehat', 'Uttar Pradesh', 'city', 'IMD'),
    ('Nagpur', 'नागपूर', 21.1458, 79.0882, 'Nagpur', 'Maharashtra', 'city', 'IMD'),
    ('Indore', 'इंदौर', 22.7196, 75.8577, 'Indore', 'Madhya Pradesh', 'city', 'IMD'),
    ('Thane', 'ठाणे', 19.2183, 72.9781, 'Thane', 'Maharashtra', 'city', 'IMD'),
    ('Bhopal', 'भोपाल', 23.2599, 77.4126, 'Bhopal', 'Madhya Pradesh', 'city', 'IMD'),
    ('Visakhapatnam', 'విశాఖపట్నం', 17.6868, 83.2185, 'Visakhapatnam', 'Andhra Pradesh', 'city', 'IMD'),
    ('Pimpri-Chinchwad', 'पिंपरी-चिंचवड', 18.6298, 77.0883, 'Pimpri-Chinchwad', 'Maharashtra', 'city', 'IMD'),
    ('Patna', 'पटना', 25.5941, 85.1376, 'Patna', 'Bihar', 'city', 'IMD'),
    ('Vadodara', 'વડોદરા', 22.3072, 73.1812, 'Vadodara', 'Gujarat', 'city', 'IMD');

-- Insert sample weather observation
INSERT INTO weather_observations (
    location_id,
    timestamp,
    temperature_2m,
    apparent_temperature,
    relative_humidity_2m,
    windspeed_10m,
    weather_code,
    precipitation_sum,
    data_source,
    quality_flag
)
SELECT
    location_id,
    NOW() - INTERVAL 'random' * INTERVAL '6 hours',
    25 + random() * 15, -- 25-40°C
    28 + random() * 10,
    40 + random() * 50,
    5 + random() * 20,
    0, -- Clear
    0,
    'IMD',
    'verified'
FROM locations
WHERE region_type = 'city';
