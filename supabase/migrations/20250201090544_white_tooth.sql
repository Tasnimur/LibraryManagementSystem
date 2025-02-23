/*
  # Initial Schema for Library Management System

  1. Tables
    - users
      - Custom fields for user profiles
    - books
      - Book catalog information
    - borrowings
      - Track book loans
    - reservations
      - Book reservation system
    - notifications
      - System notifications

  2. Security
    - Enable RLS on all tables
    - Policies for students and librarians
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'librarian');
CREATE TYPE borrowing_status AS ENUM ('borrowed', 'returned', 'overdue');
CREATE TYPE reservation_status AS ENUM ('pending', 'approved', 'cancelled');

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'student',
    full_name text,
    user_id text UNIQUE,  -- Changed from student_id
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    author text NOT NULL,
    isbn text UNIQUE,
    genre text,
    quantity integer DEFAULT 1,
    available_quantity integer DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.borrowings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
    borrow_date timestamptz DEFAULT now(),
    due_date timestamptz NOT NULL,
    return_date timestamptz,
    status borrowing_status DEFAULT 'borrowed',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reservations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
    reservation_date timestamptz DEFAULT now(),
    status reservation_status DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Books are viewable by everyone"
    ON public.books FOR SELECT
    USING (true);

CREATE POLICY "Librarians can manage books"
    ON public.books FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'librarian'
        )
    );

CREATE POLICY "Users can view own borrowings"
    ON public.borrowings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Librarians can view all borrowings"
    ON public.borrowings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'librarian'
        )
    );

CREATE POLICY "Librarians can manage borrowings"
    ON public.borrowings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'librarian'
        )
    );

CREATE POLICY "Users can view own reservations"
    ON public.reservations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create reservations"
    ON public.reservations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Librarians can manage reservations"
    ON public.reservations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'librarian'
        )
    );

CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS books_title_idx ON public.books USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS books_author_idx ON public.books USING GIN (to_tsvector('english', author));
CREATE INDEX IF NOT EXISTS borrowings_user_id_idx ON public.borrowings(user_id);
CREATE INDEX IF NOT EXISTS borrowings_book_id_idx ON public.borrowings(book_id);
CREATE INDEX IF NOT EXISTS reservations_user_id_idx ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS reservations_book_id_idx ON public.reservations(book_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);