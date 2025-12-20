-- Add payment gateway configuration to system_settings
ALTER TABLE system_settings
ADD COLUMN IF NOT EXISTS use_real_payment_gateway boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_mock_webhook_simulation boolean DEFAULT true;

COMMENT ON COLUMN system_settings.use_real_payment_gateway IS 'When false, use mock payment provider for testing. When true, use real Razorpay with keys from secrets.';

COMMENT ON COLUMN system_settings.allow_mock_webhook_simulation IS 'Allow simulating payment webhooks via admin test UI for development/testing.';