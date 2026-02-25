# E-Kinerja Guru 📚

Aplikasi **Laporan Kinerja Harian Guru** berbasis web (PWA) yang dibangun dengan Next.js + Supabase + Vercel. Konversi lengkap dari Google Apps Script.

## ✨ Fitur Lengkap

- 🔐 **Autentikasi** — Login/Register/Lupa Password via email
- 📋 **Kegiatan Harian** — CRUD kegiatan dengan filter & pencarian
- 📅 **Jadwal Mingguan** — Template kegiatan per hari (Senin–Jumat)
- 📆 **Kalender Akademik** — Input hari libur/khusus yang dilewati saat laporan
- 📊 **Cetak Laporan** — Laporan Harian + Bulanan dengan lembar pengesahan
- ⚙️ **Pengaturan Lengkap**:
  - Identitas diri (nama, NIP, jabatan, unit kerja, TTD pribadi)
  - Data sekolah (nama sekolah, kepala, NIP kepala, TTD kepala, stempel)
- 📱 **PWA** — Bisa diinstall di HP seperti aplikasi native
- 📄 **Cetak PDF** — Print ke PDF langsung dari browser

---

## 🚀 Setup & Deploy

### 1. Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** dan jalankan file `supabase/migrations/001_init.sql`
3. Di **Storage** → pastikan bucket `signatures` dan `stamps` sudah dibuat (atau akan dibuat otomatis via SQL)
4. Catat **Project URL** dan **Anon Key** dari Settings → API

### 2. GitHub

```bash
git init
git add .
git commit -m "initial: E-Kinerja Guru App"
git remote add origin https://github.com/USERNAME/ekin-app.git
git push -u origin main
```

### 3. Vercel

1. Buka [vercel.com](https://vercel.com) → Import dari GitHub
2. Tambahkan **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
   ```
3. Deploy!

### 4. Supabase Auth Redirect URL

Di Supabase → **Authentication** → **URL Configuration**:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/reset-password`

---

## 🔧 Development Lokal

```bash
npm install
cp .env.example .env.local
# Edit .env.local dengan kredensial Supabase Anda
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## 📱 Cara Pakai

### Pertama kali:
1. Register akun dengan email
2. Masuk ke **Pengaturan** → isi identitas diri lengkap + upload TTD
3. Masuk ke **Pengaturan** → isi data sekolah + upload TTD Kepala + Stempel
4. Masuk ke **Jadwal** → tambahkan template jadwal per hari
5. Masuk ke **Kaldik** → tambahkan hari libur

### Sehari-hari:
1. Buka **Kegiatan** → tap **+** untuk tambah kegiatan
2. Isi tanggal, tupoksi, uraian kegiatan, output, volume, satuan
3. Centang **Fullday** jika kegiatan menggantikan jadwal reguler

### Akhir bulan:
1. Buka **Laporan** → pilih bulan & tahun
2. Tap **Cetak Laporan** → akan terbuka halaman print
3. Print ke printer atau simpan sebagai PDF

---

## 🏗️ Struktur Proyek

```
ekin-app/
├── app/
│   ├── (auth)/login/         # Halaman login
│   ├── (dashboard)/
│   │   ├── kegiatan/         # CRUD kegiatan harian
│   │   ├── jadwal/           # Template jadwal mingguan
│   │   ├── kaldik/           # Kalender akademik
│   │   ├── laporan/          # Cetak laporan
│   │   └── pengaturan/       # Settings identitas & sekolah
│   └── reset-password/       # Reset password page
├── components/
│   ├── BottomNav.tsx          # Navigasi bawah mobile
│   ├── BottomSheet.tsx        # Modal sheet mobile-friendly
│   ├── TopBar.tsx             # Header dengan logout
│   ├── EmptyState.tsx         # Empty state component
│   └── forms/
│       └── KegiatanForm.tsx   # Form input kegiatan
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── utils.ts               # Helper functions
├── types/index.ts             # TypeScript types & constants
├── public/
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
└── supabase/migrations/       # Database schema SQL
```

---

## 📊 Database Schema

| Table | Deskripsi |
|-------|-----------|
| `users` | Profil guru (nama, NIP, jabatan, TTD) |
| `school_settings` | Data sekolah (kepala, stempel, kota) |
| `kegiatan` | Kegiatan harian per user |
| `jadwal` | Template jadwal mingguan per user |
| `kaldik` | Kalender akademik / hari libur |

---

## 🔒 Keamanan

- Row Level Security (RLS) aktif di semua tabel
- Setiap user hanya bisa akses data miliknya sendiri
- File upload tersimpan di Supabase Storage dengan akses public URL
- Password auth via Supabase Auth (bcrypt hashed)

---

## 📄 Laporan yang Dihasilkan

1. **Laporan Capaian Kinerja Harian** — Rincian per hari kerja
2. **Laporan Kinerja Bulanan** — Rekap per tupoksi + bukti dukung
3. **Lembar Pengesahan** — TTD guru + TTD kepala + stempel

---

Built with ❤️ using Next.js 14 + Supabase + Vercel
