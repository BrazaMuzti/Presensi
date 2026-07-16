// Data Siswa Module
let siswaData = [];
let siswaCurrentPage = 1;
let siswaPerPage = 10;

function loadSiswaData() {
    // Simulasi data dari spreadsheet
    siswaData = [
        { nis: '001', nama: 'Ahmad Fauzi', kelas: 'XII RPL 1', jk: 'L', tglLahir: '2005-01-15', agama: 'Islam', ayah: 'Budi', ibu: 'Siti', hp: '081234567890', alamat: 'Jl. Merdeka No.1', keterangan: 'Aktif', password: 'siswa123' },
        { nis: '002', nama: 'Siti Aminah', kelas: 'XII RPL 1', jk: 'P', tglLahir: '2005-03-20', agama: 'Islam', ayah: 'Ahmad', ibu: 'Fatimah', hp: '081234567891', alamat: 'Jl. Sudirman No.2', keterangan: 'Aktif', password: 'siswa123' },
        { nis: '003', nama: 'Budi Santoso', kelas: 'XII RPL 2', jk: 'L', tglLahir: '2004-12-10', agama: 'Kristen', ayah: 'Johanes', ibu: 'Maria', hp: '081234567892', alamat: 'Jl. Diponegoro No.3', keterangan: 'Aktif', password: 'siswa123' },
    ];
    allSiswa = siswaData;
    updateSiswaTable();
    updateFilters();
}

function updateSiswaTable() {
    const search = document.getElementById('searchSiswa').value.toLowerCase();
    const kelasFilter = document.getElementById('filterSiswaKelas').value;
    siswaPerPage = parseInt(document.getElementById('showEntries').value);

    let filtered = siswaData.filter(s => {
        const matchSearch = s.nama.toLowerCase().includes(search) || s.nis.includes(search);
        const matchKelas = kelasFilter === 'all' || s.kelas === kelasFilter;
        return matchSearch && matchKelas;
    });

    const start = (siswaCurrentPage - 1) * siswaPerPage;
    const end = start + siswaPerPage;
    const pageData = filtered.slice(start, end);

    const tbody = document.getElementById('siswaTableBody');
    tbody.innerHTML = '';

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;">Tidak ada data</td></tr>';
        return;
    }

    pageData.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td>${start + i + 1}</td>
        <td>${s.nis}</td>
        <td>${s.nama}</td>
        <td>${s.kelas}</td>
        <td>${s.jk}</td>
        <td>${s.tglLahir}</td>
        <td>${s.agama}</td>
        <td>${s.ayah}</td>
        <td>${s.ibu}</td>
        <td>${s.hp}</td>
        <td>${s.alamat}</td>
        <td>${s.keterangan}</td>
        <td>${s.password}</td>
        <td>
        <button onclick="editSiswa('${s.nis}')" class="btn-warning" style="padding:4px 8px;">
        <i class="fas fa-edit"></i>
        </button>
        <button onclick="hapusSiswa('${s.nis}')" class="btn-danger" style="padding:4px 8px;">
        <i class="fas fa-trash"></i>
        </button>
        </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('siswaInfo').textContent =
    `Menampilkan ${start + 1} - ${Math.min(end, filtered.length)} dari ${filtered.length} data`;
    document.getElementById('siswaPageInfo').textContent =
    `${siswaCurrentPage} dari ${Math.ceil(filtered.length / siswaPerPage) || 1}`;
}

function filterSiswa() {
    siswaCurrentPage = 1;
    updateSiswaTable();
}

function refreshDataSiswa() {
    loadSiswaData();
    showToast('Data siswa berhasil diperbarui', 'success');
}

function tambahSiswa() {
    // Modal untuk tambah siswa
    showModal('Tambah Siswa', `
    <form id="formTambahSiswa">
    <div class="form-group">
    <label>NIS/NISN</label>
    <input type="text" id="tNis" required>
    </div>
    <div class="form-group">
    <label>Nama Lengkap</label>
    <input type="text" id="tNama" required>
    </div>
    <div class="form-group">
    <label>Kelas</label>
    <input type="text" id="tKelas" required>
    </div>
    <div class="form-group">
    <label>Jenis Kelamin</label>
    <select id="tJk">
    <option value="L">Laki-laki</option>
    <option value="P">Perempuan</option>
    </select>
    </div>
    <div class="form-group">
    <label>Tanggal Lahir</label>
    <input type="date" id="tTglLahir">
    </div>
    <div class="form-group">
    <label>Agama</label>
    <input type="text" id="tAgama">
    </div>
    <div class="form-group">
    <label>Nama Ayah</label>
    <input type="text" id="tAyah">
    </div>
    <div class="form-group">
    <label>Nama Ibu</label>
    <input type="text" id="tIbu">
    </div>
    <div class="form-group">
    <label>No.HP</label>
    <input type="text" id="tHp">
    </div>
    <div class="form-group">
    <label>Alamat</label>
    <textarea id="tAlamat"></textarea>
    </div>
    <div class="form-group">
    <label>Keterangan</label>
    <input type="text" id="tKeterangan">
    </div>
    <div class="form-group">
    <label>Password</label>
    <input type="password" id="tPassword" required>
    </div>
    <button type="submit" class="btn-primary">Simpan</button>
    </form>
    `);

    document.getElementById('formTambahSiswa').addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            nis: document.getElementById('tNis').value,
                                                                nama: document.getElementById('tNama').value,
                                                                kelas: document.getElementById('tKelas').value,
                                                                jk: document.getElementById('tJk').value,
                                                                tglLahir: document.getElementById('tTglLahir').value,
                                                                agama: document.getElementById('tAgama').value,
                                                                ayah: document.getElementById('tAyah').value,
                                                                ibu: document.getElementById('tIbu').value,
                                                                hp: document.getElementById('tHp').value,
                                                                alamat: document.getElementById('tAlamat').value,
                                                                keterangan: document.getElementById('tKeterangan').value,
                                                                password: document.getElementById('tPassword').value
        };

        // Simpan ke array (nanti ke spreadsheet)
        siswaData.push(data);
        allSiswa = siswaData;
        updateSiswaTable();
        updateFilters();
        closeModal();
        showToast('Siswa berhasil ditambahkan', 'success');
    });
}

function editSiswa(nis) {
    const siswa = siswaData.find(s => s.nis === nis);
    if (!siswa) {
        showToast('Siswa tidak ditemukan', 'error');
        return;
    }

    showModal('Edit Siswa', `
    <form id="formEditSiswa">
    <div class="form-group">
    <label>NIS/NISN</label>
    <input type="text" id="eNis" value="${siswa.nis}" readonly>
    </div>
    <div class="form-group">
    <label>Nama Lengkap</label>
    <input type="text" id="eNama" value="${siswa.nama}" required>
    </div>
    <div class="form-group">
    <label>Kelas</label>
    <input type="text" id="eKelas" value="${siswa.kelas}" required>
    </div>
    <div class="form-group">
    <label>Jenis Kelamin</label>
    <select id="eJk">
    <option value="L" ${siswa.jk === 'L' ? 'selected' : ''}>Laki-laki</option>
    <option value="P" ${siswa.jk === 'P' ? 'selected' : ''}>Perempuan</option>
    </select>
    </div>
    <div class="form-group">
    <label>Tanggal Lahir</label>
    <input type="date" id="eTglLahir" value="${siswa.tglLahir}">
    </div>
    <div class="form-group">
    <label>Agama</label>
    <input type="text" id="eAgama" value="${siswa.agama}">
    </div>
    <div class="form-group">
    <label>Nama Ayah</label>
    <input type="text" id="eAyah" value="${siswa.ayah}">
    </div>
    <div class="form-group">
    <label>Nama Ibu</label>
    <input type="text" id="eIbu" value="${siswa.ibu}">
    </div>
    <div class="form-group">
    <label>No.HP</label>
    <input type="text" id="eHp" value="${siswa.hp}">
    </div>
    <div class="form-group">
    <label>Alamat</label>
    <textarea id="eAlamat">${siswa.alamat}</textarea>
    </div>
    <div class="form-group">
    <label>Keterangan</label>
    <input type="text" id="eKeterangan" value="${siswa.keterangan}">
    </div>
    <div class="form-group">
    <label>Password</label>
    <input type="password" id="ePassword" value="${siswa.password}" required>
    </div>
    <button type="submit" class="btn-primary">Update</button>
    </form>
    `);

    document.getElementById('formEditSiswa').addEventListener('submit', function(e) {
        e.preventDefault();
        const index = siswaData.findIndex(s => s.nis === nis);
        if (index !== -1) {
            siswaData[index] = {
                nis: document.getElementById('eNis').value,
                                                              nama: document.getElementById('eNama').value,
                                                              kelas: document.getElementById('eKelas').value,
                                                              jk: document.getElementById('eJk').value,
                                                              tglLahir: document.getElementById('eTglLahir').value,
                                                              agama: document.getElementById('eAgama').value,
                                                              ayah: document.getElementById('eAyah').value,
                                                              ibu: document.getElementById('eIbu').value,
                                                              hp: document.getElementById('eHp').value,
                                                              alamat: document.getElementById('eAlamat').value,
                                                              keterangan: document.getElementById('eKeterangan').value,
                                                              password: document.getElementById('ePassword').value
            };
            allSiswa = siswaData;
            updateSiswaTable();
            updateFilters();
            closeModal();
            showToast('Data siswa berhasil diupdate', 'success');
        }
    });
}

function hapusSiswa(nis) {
    if (confirm(`Apakah Anda yakin ingin menghapus siswa dengan NIS ${nis}?`)) {
        siswaData = siswaData.filter(s => s.nis !== nis);
        allSiswa = siswaData;
        updateSiswaTable();
        updateFilters();
        showToast('Siswa berhasil dihapus', 'success');
    }
}

function prevSiswaPage() {
    if (siswaCurrentPage > 1) {
        siswaCurrentPage--;
        updateSiswaTable();
    }
}

function nextSiswaPage() {
    const totalPages = Math.ceil(siswaData.length / siswaPerPage);
    if (siswaCurrentPage < totalPages) {
        siswaCurrentPage++;
        updateSiswaTable();
    }
}

// Modal Helper
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customModal';
    modal.innerHTML = `
    <div class="modal-content">
    <div class="modal-header">
    <h3>${title}</h3>
    <button onclick="closeModal()" class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
    ${content}
    </div>
    </div>
    `;
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.remove();
}

// Tambahkan CSS untuk modal
const modalStyles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    padding: 20px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 15px;
    margin-bottom: 20px;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.modal-body .form-group {
    margin-bottom: 15px;
}

.modal-body .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.modal-body .form-group input,
.modal-body .form-group select,
.modal-body .form-group textarea {
    width: 100%;
    padding: 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
}

.modal-body .form-group textarea {
    min-height: 60px;
    resize: vertical;
}
`;
document.head.insertAdjacentHTML('beforeend', `<style>${modalStyles}</style>`);
