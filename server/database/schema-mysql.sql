CREATE DATABASE IF NOT EXISTS telemetry_db;
USE telemetry_db;

CREATE TABLE IF NOT EXISTS telemetry_sample (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sample_time TIMESTAMP(6) NOT NULL,
  velocity DOUBLE NOT NULL,
  pressure DOUBLE NOT NULL,
  temperature DOUBLE NOT NULL,
  INDEX idx_sample_time (sample_time)
);
