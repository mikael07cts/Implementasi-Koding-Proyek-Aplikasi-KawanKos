# Laporan Kerusakan — Implementasi Komponen Dasar

Tugas 2 mata kuliah Pemrograman Front-End (IF210), Institut Teknologi Tangerang Selatan.

Halaman ini adalah implementasi **halaman "Laporan Kerusakan"** dari wireframe Tugas 1, yaitu fitur bagi penghuni kos untuk melaporkan kerusakan fasilitas dan memantau status laporannya. Dibuat dengan **HTML, CSS, dan JavaScript murni** tanpa framework atau library.

## Fitur

- **Tab** "Buat Laporan" dan "Status Laporan" (bisa dipindah dengan klik atau tombol panah).
- **Form laporan** dengan validasi: jenis fasilitas (kolom bebas + saran daftar), deskripsi masalah (min. 10 karakter, penghitung karakter).
- **Unggah foto bukti** (opsional): klik atau drag & drop, pratinjau gambar, validasi tipe file dan ukuran maks. 2 MB.
- **Daftar status laporan** berbentuk kartu, disimpan di `localStorage` sehingga tidak hilang saat halaman dimuat ulang.
- **Navigasi bawah** dengan 5 menu; menu selain "Laporan Kerusakan" menampilkan notifikasi karena halamannya belum dibuat.
- **Toast** notifikasi untuk umpan balik ke pengguna.

## Komponen yang Diimplementasikan

| No | Komponen | Lokasi di kode |
|----|----------|----------------|
| 1 | Header halaman | `index.html` → `header.app-header` |
| 2 | Tab Buat/Status Laporan | `index.html` → `.tabs`; `script.js` → `aktifkanTab()` |
| 3 | Form laporan + validasi | `index.html` → `#form-laporan`; `script.js` → `validasiFasilitas()`, `validasiDeskripsi()`, `tanganiKirim()` |
| 4 | Unggah foto + pratinjau | `index.html` → `#area-foto`, `#preview-foto`; `script.js` → `tanganiFileFoto()`, `hapusFotoTerpilih()` |
| 5 | Kartu daftar status laporan | `index.html` → `#daftar-laporan`; `script.js` → `renderDaftar()`, `buatKartu()` |
| 6 | Navigasi bawah | `index.html` → `nav.bottom-nav`; `script.js` → `tanganiNavigasi()` |

## Struktur Proyek

```
.
├── index.html    # Struktur halaman (HTML semantik)
├── styles.css    # Tampilan, memakai custom property di :root
├── script.js     # Interaktivitas (tab, validasi, foto, daftar laporan, navigasi)
└── README.md     # Dokumentasi
```

## Cara Menjalankan

1. Unduh atau clone repositori ini:
   ```bash
   git clone https://github.com/nama-pengguna/nama-repo.git
   ```
2. Buka berkas `index.html` langsung di peramban (double-click), **tidak perlu instalasi apa pun**.
3. Opsional: jalankan server lokal, misalnya dengan ekstensi *Live Server* di VS Code.

### Mengaktifkan GitHub Pages (opsional)

1. Buka repositori di GitHub → **Settings** → **Pages**.
2. Pada *Source*, pilih **Deploy from a branch**, lalu branch `main` dan folder `/ (root)`.
3. Simpan. Situs akan tersedia di `https://nama-pengguna.github.io/nama-repo/`.

## Keputusan Desain

- **Mobile-first**: lebar maksimal 420 px, mengikuti ukuran wireframe; di layar lebar tampil di tengah.
- **Custom property** di `:root` untuk warna (`--warna-utama`, `--warna-border`, dst.) dan spasi (`--spasi-sm`, `--spasi-md`, dst.) agar tampilan konsisten dan mudah diubah.
- **HTML semantik dan aksesibel**: `header`, `main`, `nav`, `section`, `form`, `label`, peran ARIA pada tab (`role="tablist"`, `aria-selected`), dan `role="alert"` pada pesan error.
- **Aman dari XSS**: isi laporan ditampilkan dengan `textContent`, bukan `innerHTML`.
- Foto bukti hanya dipakai untuk pratinjau; yang disimpan hanya penanda "ada foto" karena batas kapasitas `localStorage`.

## Catatan

Proyek ini hanya sisi *front-end*: laporan tersimpan di peramban pengguna dan tidak dikirim ke server. Status laporan selalu "Menunggu" karena belum ada sisi admin.
