-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' NOT NULL, -- 'student', 'teacher', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour la table users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teachers and Admins can view all users." ON users FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
);
CREATE POLICY "Admins can insert users." ON users FOR INSERT WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update users." ON users FOR UPDATE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can delete users." ON users FOR DELETE USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);


-- Table des contenus (audio/vidéo)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'audio', 'video'
  url TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  levels TEXT[], -- ex: ['CP', 'CE1', 'CM1']
  subjects TEXT[], -- ex: ['Mathématiques', 'Sciences']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour la table content
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view content." ON content FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers can insert content." ON content FOR INSERT WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'teacher'
);
CREATE POLICY "Teachers can update their own content." ON content FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Teachers can delete their own content." ON content FOR DELETE USING (auth.uid() = created_by);


-- Table des quiz
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour la table quizzes
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view quizzes." ON quizzes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers can insert quizzes." ON quizzes FOR INSERT WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) = 'teacher'
);
CREATE POLICY "Teachers can update their own quizzes." ON quizzes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM content WHERE content.id = quizzes.content_id AND content.created_by = auth.uid())
);
CREATE POLICY "Teachers can delete their own quizzes." ON quizzes FOR DELETE USING (
  EXISTS (SELECT 1 FROM content WHERE content.id = quizzes.content_id AND content.created_by = auth.uid())
);


-- Table des questions de quiz
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  type TEXT NOT NULL, -- 'qcm', 'drag_drop', 'dropdown' (pour l'instant, nous nous concentrerons sur 'qcm')
  options JSONB, -- Pour QCM: ['Option A', 'Option B'], pour dropdown: ['Item 1', 'Item 2']
  correct_answer JSONB, -- Pour QCM: 'Option A', pour drag_drop: {'item1': 'target1'}, pour dropdown: 'Item 1'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour la table questions
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view questions." ON questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers can insert questions." ON questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM quizzes JOIN content ON quizzes.content_id = content.id WHERE quizzes.id = questions.quiz_id AND content.created_by = auth.uid())
);
CREATE POLICY "Teachers can update their own questions." ON questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM quizzes JOIN content ON quizzes.content_id = content.id WHERE quizzes.id = questions.quiz_id AND content.created_by = auth.uid())
);
CREATE POLICY "Teachers can delete their own questions." ON questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM quizzes JOIN content ON quizzes.content_id = content.id WHERE quizzes.id = content.id AND content.created_by = auth.uid())
);


-- Table de progression des élèves
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, content_id, quiz_id) -- Un élève ne peut compléter un quiz pour un contenu qu'une seule fois
);

-- RLS pour la table student_progress
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress." ON student_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own progress." ON student_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can update their own progress." ON student_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Teachers and Admins can view all student progress." ON student_progress FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
);


-- Table des badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour la table badges
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view badges." ON badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage badges." ON badges FOR ALL USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);


-- Table des badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- RLS pour la table user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own awarded badges." ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can insert their own awarded badges." ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers and Admins can view all user badges." ON user_badges FOR SELECT USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('teacher', 'admin')
);

-- Fonction pour créer un profil utilisateur après l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'student'); -- Par défaut, le rôle est 'student'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction handle_new_user après l'insertion dans auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set up permissions for the trigger function
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
