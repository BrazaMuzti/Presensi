// Konfigurasi
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsNqsRinaQEvRNSvLCgpIpuO9MkOsu7rpxsokAYqA-J1VKEdFjiBt62dyZC7mBa4RN/exec'; // Ganti dengan URL Apps Script Anda

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Fungsi untuk memuat data presensi
async function loadPresensiData() {
    const tableBody = document.getElementById('tableBody');
    const loadingData = document.getElementById('loadingData');

    try {
        loadingData.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await fetch(`${SCRIPT_URL}?action=getData`);
        const data = await response.json();

        loadingData.style.display = 'none';

        if (data.status === 'success' && data.data.length > 0) {
            data.data.forEach((row, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${row.nama}</td>
                <td>${row.kelas}</td>
                <td>${row.status}</td>
                <td>${row.keterangan || '-'}</td>
                <td>${row.waktu}</td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = `
            <tr>
            <td colspan="6" class="text-center">Belum ada data presensi</td>
            </tr>
            `;
        }
    } catch (error) {
        loadingData.style.display = 'none';
        tableBody.innerHTML = `
        <tr>
        <td colspan="6" class="text-center" style="color: red;">Gagal memuat data</td>
        </tr>
        `;
        console.error('Error:', error);
    }
}

// Fungsi untuk menyimpan presensi
async function savePresensi(data) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=saveData`, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });

        // Karena mode no-cors, kita tidak bisa mendapatkan response
        // Jadi kita asumsikan berhasil
        showNotification('Presensi berhasil disimpan!', 'success');
        document.getElementById('presensiForm').reset();
        setTimeout(loadPresensiData, 1000);

    } catch (error) {
        showNotification('Gagal menyimpan presensi!', 'error');
        console.error('Error:', error);
    }
}

// Event listener untuk form
document.getElementById('presensiForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const nama = document.getElementById('nama').value.trim();
    const kelas = document.getElementById('kelas').value;
    const status = document.getElementById('status').value;
    const keterangan = document.getElementById('keterangan').value.trim();

    if (!nama || !kelas || !status) {
        showNotification('Mohon lengkapi semua field yang wajib!', 'error');
        return;
    }

    const data = {
        nama: nama,
        kelas: kelas,
        status: status,
        keterangan: keterangan || '-'
    };

    savePresensi(data);
});

// Event listener untuk refresh data
document.getElementById('refreshData').addEventListener('click', function() {
    loadPresensiData();
    showNotification('Data berhasil di-refresh', 'success');
});

// Load data saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    loadPresensiData();
});
