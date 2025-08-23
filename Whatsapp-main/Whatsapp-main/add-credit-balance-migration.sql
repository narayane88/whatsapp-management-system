-- Migration to add credit balance support and CREDIT payment method

-- Add creditBalance field to users if not exists (it's already available as message_balance)
-- The existing message_balance field will serve as the credit balance

-- Update enum to include CREDIT payment method
-- Note: In PostgreSQL, we need to use ALTER TYPE to add new enum values
DO $$ 
BEGIN
    -- Add CREDIT to PaymentMethod enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'PaymentMethod' AND e.enumlabel = 'CREDIT'
    ) THEN
        ALTER TYPE "PaymentMethod" ADD VALUE 'CREDIT';
        RAISE NOTICE 'Added CREDIT to PaymentMethod enum';
    ELSE
        RAISE NOTICE 'CREDIT already exists in PaymentMethod enum';
    END IF;
END $$;

-- Verify the update
SELECT enumlabel 
FROM pg_enum e 
JOIN pg_type t ON e.enumtypid = t.oid 
WHERE t.typname = 'PaymentMethod' 
ORDER BY e.enumsortorder;

-- Display updated schema info
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('message_balance', 'id', 'name');

RAISE NOTICE 'Credit payment system migration completed successfully!';
RAISE NOTICE 'Users can now use CREDIT as a payment method for subscriptions.';
RAISE NOTICE 'Level 3 (SUBDEALER) and Level 4 (EMPLOYEE) users can use their message_balance as credit.';