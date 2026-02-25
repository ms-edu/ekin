-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS table (profil guru)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  nama TEXT,
  nip TEXT,
  jabatan TEXT,
  unit_kerja TEXT,
  unit_organisasi TEXT,
  tanda_tangan_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCHOOL SETTINGS (kepala sekolah, stempel, dll)
CREATE TABLE IF NOT EXISTS public.school_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_sekolah TEXT,
  nama_kepala TEXT,
  nip_kepala TEXT,
  ttd_kepala_url TEXT,
  stempel_url TEXT,
  kota TEXT DEFAULT 'Singkawang',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default school settings
INSERT INTO public.school_settings (nama_sekolah, nama_kepala, nip_kepala, kota)
VALUES ('Nama Sekolah', 'Nama Kepala Sekolah', 'NIP. -', 'Singkawang')
ON CONFLICT DO NOTHING;

-- KEGIATAN table
CREATE TABLE IF NOT EXISTS public.kegiatan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  tupoksi TEXT NOT NULL,
  kegiatan TEXT NOT NULL,
  output TEXT NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL,
  fullday BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JADWAL MINGGUAN (template kegiatan per hari)
CREATE TABLE IF NOT EXISTS public.jadwal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hari INTEGER NOT NULL CHECK (hari BETWEEN 1 AND 7), -- 1=Senin, 7=Minggu
  tupoksi TEXT NOT NULL,
  kegiatan TEXT NOT NULL,
  output TEXT NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KALDIK (kalender akademik - hari libur)
CREATE TABLE IF NOT EXISTS public.kaldik (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tanggal DATE NOT NULL UNIQUE,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kaldik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_own_data" ON public.users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kegiatan: user can CRUD their own
CREATE POLICY "kegiatan_own" ON public.kegiatan
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Jadwal: user can CRUD their own
CREATE POLICY "jadwal_own" ON public.jadwal
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kaldik: everyone can read, only admin can write (simplified: allow all authenticated)
CREATE POLICY "kaldik_read_all" ON public.kaldik
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "kaldik_write_all" ON public.kaldik
  FOR ALL USING (auth.role() = 'authenticated');

-- School settings: everyone authenticated can read, all can update (simplified)
CREATE POLICY "school_settings_read" ON public.school_settings
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "school_settings_write" ON public.school_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stamps', 'stamps', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "signatures_upload" ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id IN ('signatures', 'stamps') AND auth.role() = 'authenticated');
CREATE POLICY "signatures_read" ON storage.objects FOR SELECT 
  USING (bucket_id IN ('signatures', 'stamps'));
CREATE POLICY "signatures_update" ON storage.objects FOR UPDATE 
  USING (bucket_id IN ('signatures', 'stamps') AND auth.role() = 'authenticated');
