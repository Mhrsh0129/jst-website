-- Update admin and CA user profiles with proper names

-- Update admin profile (assuming email admin@jayshreetraders.com)
UPDATE public.profiles
SET
    full_name = 'Lalit Doshi Sir'
WHERE
    user_id IN (
        SELECT user_id
        FROM public.user_roles
        WHERE
            role = 'admin'
        LIMIT 1
    );

-- Update CA profile (assuming email ca@jayshreetraders.com)
UPDATE public.profiles
SET
    full_name = 'Prakash Sharma'
WHERE
    user_id IN (
        SELECT user_id
        FROM public.user_roles
        WHERE
            role = 'ca'
        LIMIT 1
    );