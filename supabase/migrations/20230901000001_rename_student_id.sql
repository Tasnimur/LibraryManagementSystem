BEGIN;

-- Rename column
ALTER TABLE profiles 
RENAME COLUMN student_id TO user_id;

-- Update unique constraint
ALTER TABLE profiles 
DROP CONSTRAINT profiles_student_id_key;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Update policies
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

COMMIT;