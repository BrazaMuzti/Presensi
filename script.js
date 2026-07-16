// ==========================================================================
// KONFIGURASI
// ==========================================================================
// Ganti dengan URL Web App GAS Anda setelah deploy
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwHOjugX_RHcVMDSjs5s72zcX3jjDimo0aWMQxpBuJHQQgZCF2xzO7r5Gb59nqxRgXQ/exec';

// ==========================================================================
// FUNGSI PEMBANTU API
// ==========================================================================
async function callApi(action, data = {}) {
  try {
    // Siapkan FormData
    const formData = new FormData();
    formData.append('action', action);
    
    // Tambahkan semua data ke FormData
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'method' && key !== 'params') {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }
    
    // Jika ada params tambahan
    if (data.params) {
      for (const [key, value] of Object.entries(data.params)) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }
    
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit', // Jangan kirim cookie
      headers: {
        'Accept': 'application/json',
      },
      body: formData
    });
    
    // Cek response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    return { 
      success: false, 
      message: 'Gagal terhubung ke server: ' + error.message 
    };
  }
}

// ==========================================================================
// TEST KONEKSI (Panggil saat halaman dimuat)
// ==========================================================================
async function testConnection() {
  try {
    console.log('Testing connection to:', API_BASE_URL);
    
    const result = await callApi('getKelasList');
    console.log('Test connection result:', result);
    
    if (result.success) {
      console.log('✅ Koneksi berhasil!');
    } else {
      console.log('❌ Koneksi gagal:', result.message);
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
  }
}

// ==========================================================================
// LOGIN HANDLER (DENGAN ERROR HANDLING LEBIH BAIK)
// ==========================================================================
async function handleLogin(event) {
  event.preventDefault();
  showLoading();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const nisn = document.getElementById('nisn').value;

  // Debug: Log data yang dikirim
  console.log('📤 Sending login data:', { 
    username: username || '(empty)', 
    password: password ? '****' : '(empty)', 
    nisn: nisn || '(empty)' 
  });

  try {
    const result = await callApi('login', {
      username: username,
      password: password,
      nisn: nisn
    });
    
    console.log('📥 Login response:', result);
    
    if (result.success) {
      onLoginSuccess(result);
    } else {
      hideLoading();
      const errorDiv = document.getElementById('loginError');
      document.getElementById('errorText').textContent = result.message || 'Login gagal';
      errorDiv.classList.remove('hidden');
      setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    hideLoading();
    const errorDiv = document.getElementById('loginError');
    document.getElementById('errorText').textContent = 'Gagal terhubung ke server: ' + error.message;
    errorDiv.classList.remove('hidden');
    setTimeout(() => errorDiv.classList.add('hidden'), 5000);
  }
}

// ==========================================================================
// PANGGIL TEST KONEKSI SAAT HALAMAN DIMUAT
// ==========================================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 App loaded, testing connection...');
  testConnection();
  checkSession();
});
