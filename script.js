/* ==========================================================
   script.js — Halaman Laporan Kerusakan
   Isi:
   1. Konstanta & referensi elemen
   2. Notifikasi (toast)
   3. Komponen 2: Tab
   4. Komponen 3: Validasi form
   5. Komponen 4: Unggah foto + pratinjau
   6. Komponen 5: Daftar status laporan (localStorage)
   7. Komponen 6: Navigasi bawah
   8. Inisialisasi
   ========================================================== */

'use strict';

/* ---------- 1. Konstanta & referensi elemen ---------- */
const KUNCI_STORAGE = 'laporanKerusakan';
const MAKS_UKURAN_FOTO = 2 * 1024 * 1024; // 2 MB
const MIN_DESKRIPSI = 10;                 // minimal karakter deskripsi
const MIN_FASILITAS = 3;                  // minimal karakter jenis fasilitas

const el = {
  // tab
  tabs: document.querySelectorAll('.tab'),
  panelBuat: document.getElementById('panel-buat'),
  panelStatus: document.getElementById('panel-status'),
  badge: document.getElementById('badge-jumlah'),
  // form
  form: document.getElementById('form-laporan'),
  fasilitas: document.getElementById('fasilitas'),
  deskripsi: document.getElementById('deskripsi'),
  hitung: document.getElementById('hitung-deskripsi'),
  tombolKirim: document.getElementById('tombol-kirim'),
  // foto
  areaFoto: document.getElementById('area-foto'),
  inputFoto: document.getElementById('input-foto'),
  teksDropzone: document.getElementById('teks-dropzone'),
  preview: document.getElementById('preview-foto'),
  gambarPreview: document.getElementById('gambar-preview'),
  hapusFoto: document.getElementById('hapus-foto'),
  errFoto: document.getElementById('err-foto'),
  // daftar laporan
  daftar: document.getElementById('daftar-laporan'),
  pesanKosong: document.getElementById('pesan-kosong'),
  hapusSemua: document.getElementById('hapus-semua'),
  // navigasi & toast
  navItems: document.querySelectorAll('.nav-item'),
  toast: document.getElementById('toast'),
};

// Foto yang sedang dipilih (null jika belum ada)
let fotoTerpilih = null;
let timerToast = null;

/* ---------- 2. Notifikasi (toast) ---------- */
/**
 * Menampilkan pesan singkat di atas navigasi bawah.
 * @param {string} pesan - teks yang ditampilkan
 * @param {boolean} sukses - true = warna hijau
 */
function tampilkanToast(pesan, sukses = false) {
  el.toast.textContent = pesan;
  el.toast.classList.toggle('is-sukses', sukses);
  el.toast.classList.add('is-show');

  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.toast.classList.remove('is-show'), 2500);
}

/* ---------- 3. Komponen 2: Tab ---------- */
/**
 * Mengaktifkan tab "buat" atau "status" dan menampilkan panelnya.
 * @param {'buat'|'status'} nama
 */
function aktifkanTab(nama) {
  el.tabs.forEach((tab) => {
    const aktif = tab.dataset.tab === nama;
    tab.classList.toggle('is-active', aktif);
    tab.setAttribute('aria-selected', String(aktif));
    tab.tabIndex = aktif ? 0 : -1; // hanya tab aktif yang bisa difokus dengan Tab
  });

  el.panelBuat.hidden = nama !== 'buat';
  el.panelStatus.hidden = nama !== 'status';

  if (nama === 'status') renderDaftar();
}

/** Navigasi tab memakai tombol panah kiri/kanan (aksesibilitas). */
function tanganiKeyboardTab(event) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  const berikut = event.currentTarget.dataset.tab === 'buat' ? 'status' : 'buat';
  aktifkanTab(berikut);
  document.getElementById('tab-' + berikut).focus();
}

/* ---------- 4. Komponen 3: Validasi form ---------- */
/**
 * Menampilkan / menghapus pesan error pada satu kolom.
 * @param {HTMLElement} input - kolom yang diperiksa
 * @param {string} pesan - isi error; string kosong = tidak error
 */
function setError(input, pesan) {
  const field = input.closest('.field');
  const penampung = field.querySelector('.error');
  penampung.textContent = pesan;
  field.classList.toggle('has-error', pesan !== '');
  input.setAttribute('aria-invalid', pesan !== '' ? 'true' : 'false');
}

/** @returns {boolean} true jika jenis fasilitas valid */
function validasiFasilitas() {
  const nilai = el.fasilitas.value.trim();
  if (nilai === '') {
    setError(el.fasilitas, 'Jenis fasilitas wajib diisi.');
    return false;
  }
  if (nilai.length < MIN_FASILITAS) {
    setError(el.fasilitas, `Minimal ${MIN_FASILITAS} karakter.`);
    return false;
  }
  setError(el.fasilitas, '');
  return true;
}

/** @returns {boolean} true jika deskripsi valid */
function validasiDeskripsi() {
  const nilai = el.deskripsi.value.trim();
  if (nilai === '') {
    setError(el.deskripsi, 'Deskripsi masalah wajib diisi.');
    return false;
  }
  if (nilai.length < MIN_DESKRIPSI) {
    setError(el.deskripsi, `Jelaskan lebih detail (minimal ${MIN_DESKRIPSI} karakter).`);
    return false;
  }
  setError(el.deskripsi, '');
  return true;
}

/** Memperbarui penghitung karakter deskripsi. */
function perbaruiHitung() {
  el.hitung.textContent = `${el.deskripsi.value.length}/${el.deskripsi.maxLength}`;
}

/** Dijalankan saat form dikirim: validasi semua kolom, lalu simpan. */
function tanganiKirim(event) {
  event.preventDefault();

  // Jalankan semua validasi (tanpa berhenti di yang pertama gagal)
  const fasilitasOk = validasiFasilitas();
  const deskripsiOk = validasiDeskripsi();

  if (!fasilitasOk || !deskripsiOk) {
    (fasilitasOk ? el.deskripsi : el.fasilitas).focus();
    tampilkanToast('Periksa kembali isian yang masih salah.');
    return;
  }

  // Simulasi proses kirim singkat agar terasa seperti aplikasi sungguhan
  el.tombolKirim.disabled = true;
  el.tombolKirim.textContent = 'Mengirim...';

  setTimeout(() => {
    simpanLaporan({
      id: Date.now(),
      fasilitas: el.fasilitas.value.trim(),
      deskripsi: el.deskripsi.value.trim(),
      adaFoto: fotoTerpilih !== null,
      tanggal: new Date().toISOString(),
      status: 'Menunggu',
    });

    resetForm();
    el.tombolKirim.disabled = false;
    el.tombolKirim.textContent = 'Kirim Laporan';
    tampilkanToast('Laporan berhasil dikirim!', true);
    aktifkanTab('status');
  }, 600);
}

/** Mengosongkan form beserta error, foto, dan penghitung. */
function resetForm() {
  el.form.reset();
  setError(el.fasilitas, '');
  setError(el.deskripsi, '');
  hapusFotoTerpilih();
  perbaruiHitung();
}

/* ---------- 5. Komponen 4: Unggah foto + pratinjau ---------- */
/**
 * Memeriksa file foto: harus gambar dan maksimal 2 MB.
 * @param {File} file
 * @returns {string} pesan error, atau '' jika valid
 */
function periksaFoto(file) {
  if (!file.type.startsWith('image/')) return 'File harus berupa gambar (JPG, PNG, dst).';
  if (file.size > MAKS_UKURAN_FOTO) return 'Ukuran foto maksimal 2 MB.';
  return '';
}

/** Menangani file yang dipilih (dari dialog atau drag & drop). */
function tanganiFileFoto(file) {
  if (!file) return;

  const pesan = periksaFoto(file);
  el.errFoto.textContent = pesan;
  el.areaFoto.closest('.field').classList.toggle('has-error', pesan !== '');
  if (pesan) {
    hapusFotoTerpilih(false); // pertahankan pesan error
    return;
  }

  fotoTerpilih = file;

  // Tampilkan pratinjau memakai URL sementara
  if (el.gambarPreview.src) URL.revokeObjectURL(el.gambarPreview.src);
  el.gambarPreview.src = URL.createObjectURL(file);
  el.preview.hidden = false;
  el.teksDropzone.textContent = 'Ketuk untuk ganti foto';
}

/**
 * Menghapus foto terpilih.
 * @param {boolean} bersihkanError - true = hapus juga pesan error foto
 */
function hapusFotoTerpilih(bersihkanError = true) {
  fotoTerpilih = null;
  el.inputFoto.value = '';
  if (el.gambarPreview.src) URL.revokeObjectURL(el.gambarPreview.src);
  el.gambarPreview.removeAttribute('src');
  el.preview.hidden = true;
  el.teksDropzone.textContent = 'Ketuk untuk unggah foto';
  if (bersihkanError) {
    el.errFoto.textContent = '';
    el.areaFoto.closest('.field').classList.remove('has-error');
  }
}

/* ---------- 6. Komponen 5: Daftar status laporan ---------- */
/** @returns {Array} daftar laporan dari localStorage */
function ambilLaporan() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_STORAGE)) || [];
  } catch (e) {
    return []; // data rusak atau localStorage tidak tersedia
  }
}

/** Menambahkan satu laporan ke paling atas daftar. */
function simpanLaporan(laporan) {
  const semua = ambilLaporan();
  semua.unshift(laporan);
  try {
    localStorage.setItem(KUNCI_STORAGE, JSON.stringify(semua));
  } catch (e) {
    tampilkanToast('Penyimpanan peramban tidak tersedia.');
  }
  perbaruiBadge();
}

/** Mengubah ISO date menjadi teks tanggal Indonesia. */
function formatTanggal(iso) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Membuat satu kartu laporan (memakai textContent agar aman dari XSS). */
function buatKartu(laporan) {
  const li = document.createElement('li');
  li.className = 'kartu';

  const atas = document.createElement('div');
  atas.className = 'kartu-atas';

  const judul = document.createElement('h2');
  judul.className = 'kartu-judul';
  judul.textContent = laporan.fasilitas;

  const lencana = document.createElement('span');
  lencana.className = 'lencana';
  lencana.textContent = laporan.status;

  atas.append(judul, lencana);

  const deskripsi = document.createElement('p');
  deskripsi.className = 'kartu-deskripsi';
  deskripsi.textContent = laporan.deskripsi;

  const meta = document.createElement('div');
  meta.className = 'kartu-meta';
  meta.textContent = formatTanggal(laporan.tanggal) + (laporan.adaFoto ? ' · Ada foto bukti' : '');

  li.append(atas, deskripsi, meta);
  return li;
}

/** Menggambar ulang seluruh daftar laporan. */
function renderDaftar() {
  const semua = ambilLaporan();
  el.daftar.replaceChildren(...semua.map(buatKartu));
  el.pesanKosong.hidden = semua.length > 0;
  el.hapusSemua.hidden = semua.length === 0;
  perbaruiBadge();
}

/** Memperbarui angka lencana pada tab "Status Laporan". */
function perbaruiBadge() {
  const jumlah = ambilLaporan().length;
  el.badge.textContent = jumlah;
  el.badge.hidden = jumlah === 0;
}

/** Menghapus semua laporan setelah konfirmasi. */
function hapusSemuaLaporan() {
  if (!confirm('Hapus semua laporan?')) return;
  localStorage.removeItem(KUNCI_STORAGE);
  renderDaftar();
  tampilkanToast('Semua laporan dihapus.');
}

/* ---------- 7. Komponen 6: Navigasi bawah ---------- */
/**
 * Halaman lain belum dibuat, jadi hanya menampilkan toast.
 * Menu aktif ("Laporan Kerusakan") tetap berada di halaman ini.
 */
function tanganiNavigasi(event) {
  event.preventDefault();
  const halaman = event.currentTarget.dataset.halaman;
  if (event.currentTarget.classList.contains('is-active')) return;
  tampilkanToast(`Halaman "${halaman}" belum tersedia di demo ini.`);
}

/* ---------- 8. Inisialisasi: pasang event listener ---------- */
function init() {
  // Tab
  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => aktifkanTab(tab.dataset.tab));
    tab.addEventListener('keydown', tanganiKeyboardTab);
  });

  // Form: validasi saat kolom ditinggalkan (blur) dan diperbaiki saat mengetik
  el.fasilitas.addEventListener('blur', validasiFasilitas);
  el.fasilitas.addEventListener('input', () => {
    if (el.fasilitas.closest('.field').classList.contains('has-error')) validasiFasilitas();
  });
  el.deskripsi.addEventListener('blur', validasiDeskripsi);
  el.deskripsi.addEventListener('input', () => {
    perbaruiHitung();
    if (el.deskripsi.closest('.field').classList.contains('has-error')) validasiDeskripsi();
  });
  el.form.addEventListener('submit', tanganiKirim);

  // Foto: klik area, pilih file, hapus, dan drag & drop
  el.areaFoto.addEventListener('click', () => el.inputFoto.click());
  el.inputFoto.addEventListener('change', () => tanganiFileFoto(el.inputFoto.files[0]));
  el.hapusFoto.addEventListener('click', () => hapusFotoTerpilih());

  el.areaFoto.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.areaFoto.classList.add('is-dragover');
  });
  el.areaFoto.addEventListener('dragleave', () => el.areaFoto.classList.remove('is-dragover'));
  el.areaFoto.addEventListener('drop', (e) => {
    e.preventDefault();
    el.areaFoto.classList.remove('is-dragover');
    tanganiFileFoto(e.dataTransfer.files[0]);
  });

  // Daftar laporan & navigasi
  el.hapusSemua.addEventListener('click', hapusSemuaLaporan);
  el.navItems.forEach((item) => item.addEventListener('click', tanganiNavigasi));

  // Keadaan awal
  perbaruiHitung();
  perbaruiBadge();
}

init();
