-- Criação das tabelas para o sistema escolar

-- Tabela de perfis (para administradores e professores)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'professor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Tabela de turmas
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  period TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Tabela de estudantes
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  registration TEXT NOT NULL UNIQUE,
  phone TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Tabela de disciplinas
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  workload INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Tabela de presenças
CREATE TABLE IF NOT EXISTS public.attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  present BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, subject_id, date)
);

CREATE TRIGGER update_attendances_updated_at
BEFORE UPDATE ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Tabela de notas
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  value NUMERIC(4,2) NOT NULL CHECK (value BETWEEN 0 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(student_id, subject_id, quarter)
);

CREATE TRIGGER update_grades_updated_at
BEFORE UPDATE ON public.grades
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Configurações de segurança e políticas RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Políticas para perfis
-- Administradores podem ver e gerenciar todos os perfis
CREATE POLICY "Admins can do anything with profiles" ON public.profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver seus próprios perfis
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Políticas para turmas
-- Administradores podem gerenciar todas as turmas
CREATE POLICY "Admins can do anything with classes" ON public.classes
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver todas as turmas
CREATE POLICY "Professors can view all classes" ON public.classes
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'professor'));

-- Políticas para estudantes
-- Administradores podem gerenciar todos os estudantes
CREATE POLICY "Admins can do anything with students" ON public.students
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver todos os estudantes
CREATE POLICY "Professors can view all students" ON public.students
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'professor'));

-- Políticas para disciplinas
-- Administradores podem gerenciar todas as disciplinas
CREATE POLICY "Admins can do anything with subjects" ON public.subjects
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver todas as disciplinas
CREATE POLICY "Professors can view all subjects" ON public.subjects
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'professor'));

-- Professores podem atualizar disciplinas que lecionam
CREATE POLICY "Professors can update their subjects" ON public.subjects
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Políticas para presenças
-- Administradores podem gerenciar todas as presenças
CREATE POLICY "Admins can do anything with attendances" ON public.attendances
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver todas as presenças
CREATE POLICY "Professors can view all attendances" ON public.attendances
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'professor'));

-- Professores podem gerenciar presenças das disciplinas que lecionam
CREATE POLICY "Professors can manage attendances for their subjects" ON public.attendances
  FOR ALL USING (
    auth.uid() IN (
      SELECT teacher_id FROM public.subjects WHERE id = subject_id
    )
  );

-- Políticas para notas
-- Administradores podem gerenciar todas as notas
CREATE POLICY "Admins can do anything with grades" ON public.grades
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Professores podem ver todas as notas
CREATE POLICY "Professors can view all grades" ON public.grades
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'professor'));

-- Professores podem gerenciar notas das disciplinas que lecionam
CREATE POLICY "Professors can manage grades for their subjects" ON public.grades
  FOR ALL USING (
    auth.uid() IN (
      SELECT teacher_id FROM public.subjects WHERE id = subject_id
    )
  );

-- Trigger para criar perfil após registro de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'professor'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();