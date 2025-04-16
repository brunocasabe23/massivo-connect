-- Migration to create the user_settings table

CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
    theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    app_notifications_enabled BOOLEAN DEFAULT TRUE,
    email_order_status_enabled BOOLEAN DEFAULT TRUE
);

-- Optional: Add comments to the table and columns for better documentation
COMMENT ON TABLE user_settings IS 'Stores user-specific profile settings.';
COMMENT ON COLUMN user_settings.user_id IS 'Foreign key referencing the user this setting belongs to.';
COMMENT ON COLUMN user_settings.theme IS 'User preferred theme (light or dark).';
COMMENT ON COLUMN user_settings.app_notifications_enabled IS 'Whether the user wants to receive in-app notifications.';
COMMENT ON COLUMN user_settings.email_order_status_enabled IS 'Whether the user wants to receive email notifications about order status changes.';