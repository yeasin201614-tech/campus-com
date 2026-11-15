-- =============================================================================
-- Campus.com Seed Data (Idempotent)
-- Populates Subscription Plans, Marketplace Categories, Platform Settings,
-- Website CMS Pages, Sample Universities, Departments, and Academic Programs.
-- =============================================================================

-- 1. Subscription Plans (Free, Standard, Premium, Enterprise)
INSERT INTO public.subscription_plans (
  id, name, slug, description, price_monthly, price_yearly, currency,
  max_students, max_departments, storage_limit_gb, features, enabled_modules, is_popular, is_active, sort_order
)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'Free',
    'free',
    'Essential digital campus starter for emerging clubs and pilot institutions.',
    0.00, 0.00, 'USD',
    500, 5, 5,
    '["Basic campus profile", "Limited community feed", "Basic announcements", "Up to 500 students", "5 GB media storage"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": false, "messaging": true, "analytics": false, "custom_branding": false}'::jsonb,
    false, true, 1
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Standard',
    'standard',
    'Complete campus community, events with QR check-in, and department workflows.',
    99.00, 990.00, 'USD',
    5000, 25, 50,
    '["Full community & clubs", "Events & QR check-in", "Campus marketplace", "Enhanced analytics", "50 GB storage", "Email support"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": false}'::jsonb,
    false, true, 2
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'Premium',
    'premium',
    'Multi-department governance, advanced analytics, custom campus branding, and priority SLA.',
    249.00, 2490.00, 'USD',
    25000, 100, 250,
    '["Advanced analytics & exports", "Extended management tools", "Custom university branding", "Priority 24/7 support", "250 GB storage", "Role-based verification workflows"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": true}'::jsonb,
    true, true, 3
  ),
  (
    '11111111-1111-4111-8111-111111111104',
    'Enterprise',
    'enterprise',
    'Unlimited multi-campus architecture, SSO, dedicated support engineer, and custom SLAs.',
    599.00, 5990.00, 'USD',
    NULL, NULL, 1024,
    '["Unlimited students & departments", "Custom institutional features", "Dedicated account manager", "Advanced compliance & audit exports", "1 TB+ storage", "Custom domain & SSO"]'::jsonb,
    '{"community": true, "events": true, "notices": true, "marketplace": true, "messaging": true, "analytics": true, "custom_branding": true}'::jsonb,
    false, true, 4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  enabled_modules = EXCLUDED.enabled_modules,
  is_popular = EXCLUDED.is_popular;

-- 2. Marketplace Categories
INSERT INTO public.marketplace_categories (id, name, slug, description, icon, sort_order)
VALUES
  ('22222222-2222-4222-8222-222222222201', 'Used Books', 'used-books', 'Textbooks, reference manuals, and semester course packs.', 'BookOpen', 1),
  ('22222222-2222-4222-8222-222222222202', 'Study Materials', 'study-materials', 'Lab kits, calculators, lecture notes, and project hardware.', 'FileText', 2),
  ('22222222-2222-4222-8222-222222222203', 'Student Services', 'student-services', 'Tutoring, design help, coding mentorship, and proofreading.', 'Briefcase', 3),
  ('22222222-2222-4222-8222-222222222204', 'Electronics & Gear', 'electronics-gear', 'Laptops, monitors, dorm accessories, and campus essentials.', 'Laptop', 4)
ON CONFLICT (slug) DO NOTHING;

-- 3. Platform Settings (Public CMS, Branding, Theme, Navigation, Footer, Maintenance, Feature Flags)
INSERT INTO public.platform_settings (setting_key, setting_value, category, description, is_public)
VALUES
  (
    'branding',
    '{
      "name": "Campus.com",
      "tagline": "Connect • Collaborate • Grow",
      "logo_url": null,
      "support_email": "support@campus.com",
      "copyright": "© 2026 Campus.com Inc. All rights reserved."
    }'::jsonb,
    'branding', 'Global platform name, tagline, and brand assets', true
  ),
  (
    'theme',
    '{
      "primary": "#101B62",
      "secondary": "#6038ED",
      "accent": "#19B99A",
      "background": "#F7F8FC",
      "surface": "#FFFFFF"
    }'::jsonb,
    'theme', 'Global Campus.com palette tokens', true
  ),
  (
    'navigation',
    '{
      "items": [
        {"label": "Home", "href": "/"},
        {"label": "Features", "href": "/features"},
        {"label": "Universities", "href": "/universities"},
        {"label": "Events", "href": "/events"},
        {"label": "Community", "href": "/community"},
        {"label": "Marketplace", "href": "/marketplace"},
        {"label": "Pricing", "href": "/pricing"}
      ]
    }'::jsonb,
    'navigation', 'Public header navigation links', true
  ),
  (
    'footer',
    '{
      "description": "A unified multi-university digital campus connecting students, faculty, clubs, and institutional administrators.",
      "columns": [
        {"title": "Platform", "links": [{"label": "About Campus.com", "href": "/about"}, {"label": "Features", "href": "/features"}, {"label": "Universities", "href": "/universities"}, {"label": "Pricing", "href": "/pricing"}]},
        {"title": "Community", "links": [{"label": "Campus Community", "href": "/community"}, {"label": "Upcoming Events", "href": "/events"}, {"label": "Marketplace", "href": "/marketplace"}, {"label": "Help Center", "href": "/help"}]},
        {"title": "Legal & Support", "links": [{"label": "Contact Us", "href": "/contact"}, {"label": "Privacy Policy", "href": "/privacy"}, {"label": "Terms & Conditions", "href": "/terms"}]}
      ]
    }'::jsonb,
    'footer', 'Dynamic footer columns and links', true
  ),
  (
    'contact',
    '{
      "email": "hello@campus.com",
      "phone": "+1 (800) 555-0199",
      "address": "420 University Innovation Way, Cambridge, MA 02139",
      "office_hours": "Mon–Fri, 9:00 AM – 6:00 PM EST"
    }'::jsonb,
    'contact', 'Public contact details', true
  ),
  (
    'social',
    '{
      "twitter": "https://x.com/campuscom",
      "linkedin": "https://linkedin.com/company/campuscom",
      "github": "https://github.com/campuscom",
      "youtube": "https://youtube.com/@campuscom"
    }'::jsonb,
    'social', 'Official social links', true
  ),
  (
    'seo',
    '{
      "title": "Campus.com — Connect • Collaborate • Grow",
      "description": "Your Complete Multi-University Campus Community and Institutional Management Platform."
    }'::jsonb,
    'seo', 'Default SEO title and meta description', true
  ),
  (
    'feature_flags',
    '{
      "marketplace_enabled": true,
      "realtime_chat_enabled": true,
      "qr_checkin_enabled": true,
      "public_university_signup": true,
      "mobile_offline_cache": true
    }'::jsonb,
    'features', 'Platform-wide feature availability toggles', true
  ),
  (
    'maintenance_mode',
    '{
      "enabled": false,
      "message": "Campus.com is undergoing scheduled maintenance to upgrade your campus experience. We will be back shortly."
    }'::jsonb,
    'maintenance', 'Global maintenance mode switch', true
  )
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Website Pages (Dynamic CMS Content for Public Website)
INSERT INTO public.website_pages (
  slug, title, subtitle, hero_title, hero_description, hero_cta_text, hero_cta_url, sections, seo_title, seo_description, is_published, show_in_nav, nav_order
)
VALUES
  (
    'home',
    'Home',
    'Your Complete Campus Community Platform',
    'Your Complete Campus Community Platform',
    'A unified platform for students, faculty, clubs, and institutions to connect, collaborate, and grow together.',
    'Join Campus.com',
    '/register',
    '[
      {"id": "highlights", "heading": "A Smarter Campus Life Together!", "items": ["Stay Updated with verified notices", "Make Connections across clubs & peers", "Manage Campus Life & QR events", "Build Your Future with faculty & resources"]},
      {"id": "testimonials", "heading": "Trusted by Leading Universities", "items": [
        {"quote": "Campus.com replaced four disconnected tools and lifted student event attendance by 42% in one semester.", "author": "Dr. Elena Vance", "role": "Dean of Student Life, Northbridge University"},
        {"quote": "Finding study groups, buying semester textbooks, and checking department notices in one app changed everything.", "author": "Rahat Karim", "role": "Computer Science Senior, Metropolitan Tech"},
        {"quote": "Our club approvals and QR event check-ins went from spreadsheets to instant mobile workflows.", "author": "Sofia Mendoza", "role": "President, Robotics Society"}
      ]},
      {"id": "faq", "heading": "Frequently Asked Questions", "items": [
        {"q": "How does multi-university data isolation work?", "a": "Every university operates inside strict PostgreSQL Row Level Security boundaries so student records, private notices, and admin reports stay completely isolated."},
        {"q": "Can students use both web and iOS/Android apps?", "a": "Yes. Campus.com shares a real-time Supabase backend across Next.js web and Expo React Native mobile apps."},
        {"q": "How does QR event check-in work?", "a": "When a student registers for an event, a unique cryptographically random QR ticket token is generated and verified at the door by event organizers."},
        {"q": "Can our university customize branding and domains?", "a": "Premium and Enterprise plans support custom university logos, accent colors, and dedicated institutional settings."}
      ]}
    ]'::jsonb,
    'Campus.com — Connect • Collaborate • Grow',
    'Unified multi-university campus community, notice board, events, marketplace, and institutional management platform.',
    true, true, 1
  ),
  (
    'about',
    'About Campus.com',
    'Built for modern universities and thriving student ecosystems',
    'Reimagining the Connected Digital Campus',
    'Campus.com brings together institutional administration, academic communication, and vibrant student communities under one secure roof.',
    'Explore Universities',
    '/universities',
    '[{"id": "mission", "heading": "Our Mission", "body": "Higher education thrives when students, faculty, and administrators collaborate effortlessly without fragmented tools."}]'::jsonb,
    'About Campus.com',
    'Learn how Campus.com connects universities, faculty, and students.',
    true, false, 2
  ),
  (
    'features',
    'Features',
    'Everything your campus needs across Web, Mobile, and Super Admin',
    'Built for Every Role on Campus',
    'From Super Admin institutional governance and Department academic boards to real-time student chat and QR event check-ins.',
    'Get Started',
    '/register',
    '[]'::jsonb,
    'Features — Campus.com',
    'Explore mobile app, web portal, university management, and Super Admin features.',
    true, true, 2
  ),
  (
    'privacy',
    'Privacy Policy',
    'How Campus.com safeguards institutional and student data',
    'Privacy & Multi-Tenant Data Protection',
    'We enforce strict database-level tenant isolation, encrypted transport, and never store raw payment card numbers.',
    'Contact Privacy Team',
    '/contact',
    '[{"id": "policy", "heading": "Data Governance", "body": "All university records are isolated using PostgreSQL Row Level Security. Private chats and student academic details are visible only to authorized members within the same institution."}]'::jsonb,
    'Privacy Policy — Campus.com',
    'Campus.com privacy policy and security commitments.',
    true, false, 98
  ),
  (
    'terms',
    'Terms & Conditions',
    'Platform terms for institutions, faculty, and students',
    'Terms of Service',
    'Guidelines for respectful campus collaboration, marketplace safety, and institutional subscription terms.',
    'Contact Support',
    '/contact',
    '[{"id": "terms", "heading": "Acceptable Campus Use", "body": "All members must uphold academic integrity, university community standards, and lawful marketplace conduct."}]'::jsonb,
    'Terms & Conditions — Campus.com',
    'Terms of service for Campus.com.',
    true, false, 99
  )
ON CONFLICT (slug) DO NOTHING;

-- 5. Verified Sample Universities (Public Showcase & Onboarding Selection)
INSERT INTO public.universities (
  id, name, slug, short_code, domain, description, brand_color, secondary_color,
  city, country, website_url, contact_email, established_year, student_capacity, status, is_verified, is_featured, current_academic_year
)
VALUES
  (
    '33333333-3333-4333-8333-333333333301',
    'Northbridge University',
    'northbridge-university',
    'NBU',
    'northbridge.edu',
    'A premier research institution uniting engineering, liberal arts, and vibrant student innovation labs.',
    '#101B62', '#6038ED',
    'Cambridge', 'United States', 'https://northbridge.edu', 'admissions@northbridge.edu',
    1964, 18000, 'verified', true, true, '2026-2027'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'Metropolitan Institute of Technology',
    'metropolitan-tech',
    'MITX',
    'metrotech.edu',
    'Leading STEM and digital entrepreneurship university empowering hands-on builders and clubs.',
    '#101B62', '#19B99A',
    'Toronto', 'Canada', 'https://metrotech.edu', 'campus@metrotech.edu',
    1982, 12500, 'verified', true, true, '2026-2027'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    'Pacific Crest University',
    'pacific-crest-university',
    'PCU',
    'pacificcrest.edu',
    'Coastal multidisciplinary campus known for marine sciences, design, and global exchange communities.',
    '#172554', '#7C3AED',
    'Seattle', 'United States', 'https://pacificcrest.edu', 'hello@pacificcrest.edu',
    1975, 9500, 'verified', true, true, '2026-2027'
  )
ON CONFLICT (slug) DO NOTHING;

-- 6. Sample Departments & Academic Programs
INSERT INTO public.departments (id, university_id, name, code, slug, description, building, contact_email)
VALUES
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', 'Computer Science & AI', 'CSE', 'computer-science-ai', 'Software engineering, artificial intelligence, and distributed systems.', 'Turing Hall', 'cse@northbridge.edu'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333301', 'Business & Economics', 'BBA', 'business-economics', 'Finance, management science, and startup incubation.', 'Keynes Center', 'business@northbridge.edu'),
  ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333302', 'Electrical & Robotics Engineering', 'EEE', 'electrical-robotics', 'Embedded systems, autonomous robotics, and clean energy.', 'Tesla Wing', 'eee@metrotech.edu'),
  ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333303', 'Interactive Media & Design', 'IMD', 'interactive-media-design', 'Human-computer interaction, product design, and digital storytelling.', 'Studio North', 'design@pacificcrest.edu')
ON CONFLICT (university_id, code) DO NOTHING;

INSERT INTO public.academic_programs (id, university_id, department_id, name, code, degree_level, duration_years, academic_year, total_credits)
VALUES
  ('55555555-5555-4555-8555-555555555501', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', 'B.Sc. in Computer Science', 'BSC-CSE', 'bachelor', 4.0, '2026-2027', 124),
  ('55555555-5555-4555-8555-555555555502', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444402', 'MBA in Technology Leadership', 'MBA-TL', 'master', 2.0, '2026-2027', 60),
  ('55555555-5555-4555-8555-555555555503', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444403', 'B.Eng. in Robotics & Embedded AI', 'BENG-ROB', 'bachelor', 4.0, '2026-2027', 130)
ON CONFLICT (university_id, code) DO NOTHING;

-- 7. Sample Subscriptions for Seeded Universities
INSERT INTO public.subscriptions (id, university_id, plan_id, billing_cycle, status, provider)
VALUES
  ('66666666-6666-4666-8666-666666666601', '33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111103', 'yearly', 'active', 'manual'),
  ('66666666-6666-4666-8666-666666666602', '33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111102', 'monthly', 'active', 'manual'),
  ('66666666-6666-4666-8666-666666666603', '33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111101', 'monthly', 'trialing', 'manual')
ON CONFLICT (university_id) DO NOTHING;
