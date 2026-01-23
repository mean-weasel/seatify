-- =============================================================================
-- SEATIFY DEMO EVENT - PRODUCTION SEED SCRIPT
-- =============================================================================
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard -> Authentication -> Users
-- 2. Click "Add User" and create a user with:
--    - Email: demo@seatify.app
--    - Password: (any password, won't be used)
--    - Check "Auto Confirm User"
-- 3. Copy the UUID of the created user
-- 4. Replace YOUR_DEMO_USER_UUID_HERE below with that UUID
-- 5. Run this entire script in the SQL Editor
--
-- =============================================================================

-- IMPORTANT: Replace this with the actual UUID from step 3
-- Example: '12345678-1234-1234-1234-123456789abc'
DO $$
DECLARE
    demo_user_id UUID := '648495cb-0dd5-48e2-9ad9-0c3a36a3a0aa';  -- Demo user created in Supabase Auth
    demo_event_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Validate that the user ID was replaced
    IF demo_user_id = 'YOUR_DEMO_USER_UUID_HERE'::UUID THEN
        RAISE EXCEPTION 'Please replace YOUR_DEMO_USER_UUID_HERE with the actual demo user UUID from Supabase Auth';
    END IF;

    -- =====================================================
    -- STEP 1: Create demo profile (if not exists)
    -- =====================================================
    INSERT INTO public.profiles (id, email, display_name, created_at, updated_at)
    VALUES (demo_user_id, 'demo@seatify.app', 'Demo User', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- =====================================================
    -- STEP 2: Clean up existing demo data
    -- =====================================================
    DELETE FROM public.constraint_guests WHERE constraint_id IN (
        SELECT id FROM public.constraints WHERE event_id = demo_event_id
    );
    DELETE FROM public.constraints WHERE event_id = demo_event_id;
    DELETE FROM public.guest_profiles WHERE guest_id IN (
        SELECT id FROM public.guests WHERE event_id = demo_event_id
    );
    DELETE FROM public.guest_relationships WHERE event_id = demo_event_id;
    DELETE FROM public.guests WHERE event_id = demo_event_id;
    DELETE FROM public.tables WHERE event_id = demo_event_id;
    DELETE FROM public.venue_elements WHERE event_id = demo_event_id;
    DELETE FROM public.events WHERE id = demo_event_id;

    -- =====================================================
    -- STEP 3: Create the demo event
    -- =====================================================
    INSERT INTO public.events (id, user_id, name, event_type, date, venue_name, created_at, updated_at)
    VALUES (demo_event_id, demo_user_id, 'Demo Event', 'wedding', '2025-06-15', 'Grand Ballroom', NOW(), NOW());

    RAISE NOTICE 'Demo event created successfully!';
END $$;

-- =====================================================
-- STEP 4: Create tables for the demo event
-- =====================================================

INSERT INTO public.tables (id, event_id, name, shape, capacity, x, y, width, height, rotation) VALUES
    ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Table 1', 'round', 8, 150, 150, 120, 120, 0),
    ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Table 2', 'rectangle', 10, 450, 120, 200, 80, 0),
    ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Table 3', 'square', 8, 350, 350, 100, 100, 0);

-- =====================================================
-- STEP 5: Create guests for the demo event
-- =====================================================

INSERT INTO public.guests (id, event_id, first_name, last_name, email, company, job_title, industry, group_name, rsvp_status, table_id) VALUES
    ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Emma', 'Wilson', 'emma@wilson-law.com', 'Wilson & Associates', 'Partner', 'Legal', 'Family', 'confirmed', '00000000-0000-0000-0000-000000000101'),
    ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'James', 'Wilson', 'james.wilson@cityhospital.org', 'City Hospital', 'Surgeon', 'Healthcare', 'Family', 'confirmed', '00000000-0000-0000-0000-000000000102'),
    ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000001', 'Mia', 'Thompson', 'mia.t@spotify.com', 'Spotify', 'Data Scientist', 'Technology', 'Friends', 'confirmed', '00000000-0000-0000-0000-000000000103'),
    ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000001', 'Daniel', 'Thompson', 'daniel.t@google.com', 'Google', 'Product Manager', 'Technology', 'Friends', 'confirmed', '00000000-0000-0000-0000-000000000101');

INSERT INTO public.guests (id, event_id, first_name, last_name, email, company, job_title, industry, group_name, rsvp_status) VALUES
    ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000001', 'Olivia', 'Chen', 'olivia.chen@figma.com', 'Figma', 'Product Designer', 'Technology', 'Friends', 'confirmed'),
    ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000001', 'Liam', 'Chen', 'liam@stripe.com', 'Stripe', 'Software Engineer', 'Technology', 'Friends', 'confirmed'),
    ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000001', 'Sophia', 'Martinez', 'sophia.m@acme.com', 'Acme Corp', 'Marketing Director', 'Consumer Goods', 'Work', 'confirmed'),
    ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000001', 'Noah', 'Martinez', 'noah@martinezconsulting.com', 'Martinez Consulting', 'Founder', 'Consulting', 'Work', 'confirmed'),
    ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000001', 'Ava', 'Johnson', 'ava.johnson@netflix.com', 'Netflix', 'Content Strategist', 'Entertainment', 'Friends', 'confirmed'),
    ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000001', 'Mason', 'Lee', 'mason.lee@gs.com', 'Goldman Sachs', 'Vice President', 'Finance', 'Friends', 'confirmed'),
    ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000001', 'Isabella', 'Brown', 'isabella@brownarch.com', 'Brown Architecture', 'Principal Architect', 'Architecture', 'pending'),
    ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000001', 'Ethan', 'Davis', 'edavis@stanford.edu', 'Stanford University', 'Professor', 'Education', 'Family', 'confirmed'),
    ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000001', 'Lucas', 'Garcia', 'lgarcia@tesla.com', 'Tesla', 'Mechanical Engineer', 'Automotive', 'Work', 'confirmed'),
    ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000001', 'Charlotte', 'White', 'charlotte@whitemedia.com', 'White Media Group', 'CEO', 'Media', 'Family', 'confirmed'),
    ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000001', 'Benjamin', 'Taylor', 'ben@taylorvc.com', 'Taylor Ventures', 'Managing Partner', 'Venture Capital', 'confirmed'),
    ('00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000001', 'Sofia', 'Garcia', 'sofia.g@apple.com', 'Apple', 'UX Designer', 'Technology', 'Work', 'confirmed'),
    ('00000000-0000-0000-0000-000000000217', '00000000-0000-0000-0000-000000000001', 'Ryan', 'Mitchell', 'ryan.m@airbnb.com', 'Airbnb', 'Engineering Lead', 'Technology', 'Friends', 'confirmed'),
    ('00000000-0000-0000-0000-000000000218', '00000000-0000-0000-0000-000000000001', 'Harper', 'Reed', 'harper.r@shopify.com', 'Shopify', 'Solutions Architect', 'Technology', 'Friends', 'confirmed');

-- =====================================================
-- STEP 6: Create guest relationships
-- =====================================================

INSERT INTO public.guest_relationships (event_id, guest_id, related_guest_id, relationship_type, strength) VALUES
    -- Emma & James Wilson (partners - separated for demo)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000202', 'partner', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000201', 'partner', 5),
    -- Emma & Charlotte (family)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000213', 'family', 4),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000201', 'family', 4),
    -- Olivia & Liam Chen (partners)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000204', 'partner', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000203', 'partner', 5),
    -- Sophia & Noah Martinez (partners)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000206', 'partner', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000205', 'partner', 5),
    -- Mia & Daniel Thompson (partners - separated for demo)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000215', 'partner', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000211', 'partner', 5),
    -- Lucas & Sofia Garcia (partners)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000216', 'partner', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000216', '00000000-0000-0000-0000-000000000212', 'partner', 5),
    -- Mason & Benjamin (AVOID)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000214', 'avoid', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000208', 'avoid', 5),
    -- Isabella & Ethan (AVOID)
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000210', 'avoid', 5),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000209', 'avoid', 5),
    -- Friends connections
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000207', 'friend', 3),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000203', 'friend', 3),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000208', 'friend', 3),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000207', 'friend', 3),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000217', '00000000-0000-0000-0000-000000000218', 'friend', 3),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000218', '00000000-0000-0000-0000-000000000217', 'friend', 3);

-- =====================================================
-- STEP 7: Create constraints
-- =====================================================

-- Constraint 1: Emma & James must sit together
INSERT INTO public.constraints (id, event_id, constraint_type, priority, description)
VALUES ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000001', 'must_sit_together', 'required', 'Emma and James Wilson are married');

INSERT INTO public.constraint_guests (constraint_id, guest_id) VALUES
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201'),
    ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000202');

-- Constraint 2: Mia & Daniel should sit at same table
INSERT INTO public.constraints (id, event_id, constraint_type, priority, description)
VALUES ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000001', 'same_table', 'preferred', 'Mia and Daniel Thompson are partners');

INSERT INTO public.constraint_guests (constraint_id, guest_id) VALUES
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000211'),
    ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000215');

-- =====================================================
-- STEP 8: Create guest profiles with interests
-- =====================================================

INSERT INTO public.guest_profiles (guest_id, interests) VALUES
    ('00000000-0000-0000-0000-000000000201', ARRAY['golf', 'wine tasting', 'travel']),
    ('00000000-0000-0000-0000-000000000202', ARRAY['sailing', 'classical music']),
    ('00000000-0000-0000-0000-000000000203', ARRAY['photography', 'hiking', 'cooking']),
    ('00000000-0000-0000-0000-000000000204', ARRAY['cycling', 'board games', 'coffee']),
    ('00000000-0000-0000-0000-000000000205', ARRAY['yoga', 'reading', 'podcasts']),
    ('00000000-0000-0000-0000-000000000206', ARRAY['tennis', 'investing']),
    ('00000000-0000-0000-0000-000000000207', ARRAY['film', 'theater', 'writing']),
    ('00000000-0000-0000-0000-000000000208', ARRAY['running', 'art collecting']),
    ('00000000-0000-0000-0000-000000000209', ARRAY['design', 'sustainable living', 'gardening']),
    ('00000000-0000-0000-0000-000000000210', ARRAY['research', 'chess', 'history']),
    ('00000000-0000-0000-0000-000000000211', ARRAY['music', 'machine learning', 'skiing']),
    ('00000000-0000-0000-0000-000000000212', ARRAY['electric vehicles', 'robotics', 'camping']),
    ('00000000-0000-0000-0000-000000000213', ARRAY['philanthropy', 'art', 'travel']),
    ('00000000-0000-0000-0000-000000000214', ARRAY['startups', 'golf', 'wine']),
    ('00000000-0000-0000-0000-000000000215', ARRAY['hiking', 'photography', 'cooking']),
    ('00000000-0000-0000-0000-000000000216', ARRAY['design', 'yoga', 'painting']),
    ('00000000-0000-0000-0000-000000000217', ARRAY['travel', 'rock climbing', 'craft beer']),
    ('00000000-0000-0000-0000-000000000218', ARRAY['gaming', 'sci-fi books', 'running']);

-- =====================================================
-- STEP 9: Add public read policies for demo event
-- =====================================================

-- Drop existing demo policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can view demo event" ON public.events;
DROP POLICY IF EXISTS "Anyone can view demo event tables" ON public.tables;
DROP POLICY IF EXISTS "Anyone can view demo event guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can view demo event relationships" ON public.guest_relationships;
DROP POLICY IF EXISTS "Anyone can view demo event constraints" ON public.constraints;
DROP POLICY IF EXISTS "Anyone can view demo event constraint_guests" ON public.constraint_guests;
DROP POLICY IF EXISTS "Anyone can view demo event venue_elements" ON public.venue_elements;
DROP POLICY IF EXISTS "Anyone can view demo event guest_profiles" ON public.guest_profiles;

-- Events: Allow public read of demo event
CREATE POLICY "Anyone can view demo event" ON public.events
    FOR SELECT USING (id = '00000000-0000-0000-0000-000000000001');

-- Tables: Allow public read of demo event tables
CREATE POLICY "Anyone can view demo event tables" ON public.tables
    FOR SELECT USING (event_id = '00000000-0000-0000-0000-000000000001');

-- Guests: Allow public read of demo event guests
CREATE POLICY "Anyone can view demo event guests" ON public.guests
    FOR SELECT USING (event_id = '00000000-0000-0000-0000-000000000001');

-- Guest relationships: Allow public read of demo event relationships
CREATE POLICY "Anyone can view demo event relationships" ON public.guest_relationships
    FOR SELECT USING (event_id = '00000000-0000-0000-0000-000000000001');

-- Constraints: Allow public read of demo event constraints
CREATE POLICY "Anyone can view demo event constraints" ON public.constraints
    FOR SELECT USING (event_id = '00000000-0000-0000-0000-000000000001');

-- Constraint guests: Allow public read of demo event constraint guests
CREATE POLICY "Anyone can view demo event constraint_guests" ON public.constraint_guests
    FOR SELECT USING (
        constraint_id IN (
            SELECT id FROM public.constraints
            WHERE event_id = '00000000-0000-0000-0000-000000000001'
        )
    );

-- Venue elements: Allow public read of demo event venue elements
CREATE POLICY "Anyone can view demo event venue_elements" ON public.venue_elements
    FOR SELECT USING (event_id = '00000000-0000-0000-0000-000000000001');

-- Guest profiles: Allow public read of demo event guest profiles
CREATE POLICY "Anyone can view demo event guest_profiles" ON public.guest_profiles
    FOR SELECT USING (
        guest_id IN (
            SELECT id FROM public.guests
            WHERE event_id = '00000000-0000-0000-0000-000000000001'
        )
    );

-- =====================================================
-- DONE! Your demo event is now ready.
-- =====================================================
SELECT 'Demo event seeded successfully!' AS status;
