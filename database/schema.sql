-- Wartop MySQL/MariaDB schema for cPanel shared hosting.
-- Import this file once through phpMyAdmin after selecting the Wartop database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(40) NOT NULL,
  applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (version)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider VARCHAR(32) NOT NULL DEFAULT 'google',
  provider_user_id VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  avatar_url VARCHAR(500) NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_provider_identity (provider, provider_user_id),
  KEY idx_users_last_login (last_login_at),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Existing synchronized domains are stored as validated JSON rows. Keys cover
-- transactions, products, user activity, chat, wallet, blocks, and traffic.
CREATE TABLE IF NOT EXISTS app_state (
  state_key VARCHAR(80) NOT NULL,
  state_value LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (state_key),
  CONSTRAINT chk_app_state_json CHECK (JSON_VALID(state_value))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('2026-08-15-initial-cpanel-mysql');
