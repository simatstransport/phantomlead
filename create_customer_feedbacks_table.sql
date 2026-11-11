-- =========================================================================
-- PHANTOMLEAD FEEDBACK & STAR RATINGS TABLE
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.customer_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
    package_name TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_feedbacks ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read feedback (to showcase reviews & ratings)
CREATE POLICY "Public read customer_feedbacks"
    ON public.customer_feedbacks
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Authenticated customers can insert their feedback
CREATE POLICY "Customers insert their own feedback"
    ON public.customer_feedbacks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = customer_id);

-- Customers can update their own feedback
CREATE POLICY "Customers update their own feedback"
    ON public.customer_feedbacks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = customer_id);

-- Admin can manage feedbacks
CREATE POLICY "Admin manage all customer_feedbacks"
    ON public.customer_feedbacks
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE admin_users.id = auth.uid()
        )
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_customer_id ON public.customer_feedbacks(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedbacks_rating ON public.customer_feedbacks(rating);
