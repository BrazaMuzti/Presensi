// ==========================================================================
// KONFIGURASI API
// ==========================================================================
// ⚠️ GANTI DENGAN URL WEB APP GAS ANDA
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbywAi1K3DMBdSKCUYDdw9sKn71Np2EUTdWCoef8RHs565bVhL9BF-Gh5U_D9coU5wpB/exec';

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
    
    // Tambahkan params tambahan
    if (data.params) {
      for (const [key, value] of Object.entries(data.params)) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    }
    
    // Kirim request dengan FormData
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
      },
      body: formData
    });
    
    // Cek response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    // Parse response JSON
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
// TEST KONEKSI
// ==========================================================================
async function testConnection() {
  try {
    console.log('🔗 Testing connection to:', API_BASE_URL);
    console.log('📋 Sending test request...');
    
    const result = await callApi('getKelasList');
    console.log('📥 Test connection result:', result);
    
    if (result.success) {
      console.log('✅ Koneksi berhasil! Data kelas:', result.data);
      return true;
    } else {
      console.log('❌ Koneksi gagal:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

// ==========================================================================
// GLOBAL STATE
// ==========================================================================
let currentUser = null;
let html5QrCode = null;
let isScanning = false;
let isSidebarOpen = true;
let existingClasses = [];
let guruChartInstance = null;
let adminChartInstance = null;

// Table State
const tableState = {
  siswa: { fullData: [], filtered: [], limit: 10, page: 1, search: '', classFilter: '' },
  guru: { fullData: [], filtered: [], limit: 10, page: 1, search: '', classFilter: '' },
  libur: { fullData: [], filtered: [], limit: 10, page: 1, search: '' },
  rekap: { fullData: [], filtered: [], limit: 10, page: 1, search: '' },
  monitoring: { fullData: [], filtered: [], limit: 10, page: 1, search: '', statusFilter: '' }
};

// ==========================================================================
// SESSION MANAGEMENT
// ==========================================================================
function checkSession() {
  const storedSession = localStorage.getItem('absensiAppSession');
  if (storedSession) {
    try {
      const sessionData = JSON.parse(storedSession);
      if (sessionData && sessionData.success) {
        currentUser = sessionData;
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('dashboardContainer').classList.remove('hidden');

        if (window.innerWidth < 768) {
          document.getElementById('sidebar').classList.add('-translate-x-full');
        }

        initDashboard();
        return true;
      }
    } catch (e) {
      localStorage.removeItem('absensiAppSession');
    }
  }
  return false;
}

// ==========================================================================
// UI NAVIGATION
// ==========================================================================
function showView(viewId) {
  document.querySelectorAll('.view-section').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
    target.classList.add('animate-fade-in');
  }

  let title = "Dashboard";
  const titles = {
    'view-data-siswa': 'Direktori Siswa',
    'view-data-guru': 'Manajemen Guru',
    'view-kelola-absen': 'Kelola Hari Libur',
    'view-scanner': 'Scan Absensi',
    'view-monitoring': 'Monitoring Realtime',
    'view-rekap-absensi': 'Laporan Kehadiran',
    'view-kartu-siswa': 'Kartu Pelajar Digital'
  };
  title = titles[viewId] || "Dashboard";
  
  document.getElementById('pageTitle').textContent = title;
  closeSidebarMobile();
}

function setActiveMenu(targetName) {
  const allLinks = document.querySelectorAll('#sidebarMenu a');
  const centerClass = !isSidebarOpen ? 'justify-center px-0' : 'space-x-3 px-4';
  const baseStyle = `flex items-center ${centerClass} py-3 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap cursor-pointer `;
  const activeStyle = "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50";
  const inactiveStyle = "text-gray-400 hover:bg-gray-800 hover:text-white";

  allLinks.forEach(link => {
    const menuName = link.getAttribute('data-name');
    if (menuName === targetName) {
      link.className = baseStyle + activeStyle;
    } else {
      link.className = baseStyle + inactiveStyle;
    }
  });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainContent');
  const overlay = document.getElementById('mobileOverlay');
  const labels = document.querySelectorAll('.sidebar-label');
  const header = document.getElementById('sidebarHeader');
  const userCard = document.getElementById('userProfileCard');
  const logoutBtn = document.getElementById('btnLogout');
  const menuLinks = document.querySelectorAll('#sidebarMenu a');

  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    if (sidebar.classList.contains('-translate-x-full')) {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
      setTimeout(() => overlay.classList.remove('opacity-0'), 10);
    } else {
      sidebar.classList.add('-translate-x-full');
      overlay.classList.add('opacity-0');
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
  } else {
    if (isSidebarOpen) {
      // Collapse
      sidebar.classList.remove('w-64');
      sidebar.classList.add('w-20');
      main.classList.remove('md:ml-64');
      main.classList.add('md:ml-20');

      header.classList.remove('px-6', 'justify-start');
      header.classList.add('px-0', 'justify-center');
      userCard.classList.remove('space-x-3', 'p-3', 'bg-black/20', 'border');
      userCard.classList.add('justify-center', 'p-0', 'bg-transparent', 'border-transparent');
      logoutBtn.classList.remove('space-x-3', 'justify-start', 'px-4');
      logoutBtn.classList.add('justify-center', 'px-0');
      menuLinks.forEach(link => {
        link.classList.remove('space-x-3', 'px-4');
        link.classList.add('justify-center', 'px-0');
      });
      labels.forEach(el => { el.classList.add('hidden'); });

      isSidebarOpen = false;
    } else {
      // Expand
      sidebar.classList.remove('w-20');
      sidebar.classList.add('w-64');
      main.classList.remove('md:ml-20');
      main.classList.add('md:ml-64');

      header.classList.add('px-6', 'justify-start');
      header.classList.remove('px-0', 'justify-center');
      userCard.classList.add('space-x-3', 'p-3', 'bg-black/20', 'border');
      userCard.classList.remove('justify-center', 'p-0', 'bg-transparent', 'border-transparent');
      logoutBtn.classList.add('space-x-3', 'justify-start', 'px-4');
      logoutBtn.classList.remove('justify-center', 'px-0');
      menuLinks.forEach(link => {
        link.classList.add('space-x-3', 'px-4');
        link.classList.remove('justify-center', 'px-0');
      });
      labels.forEach(el => { el.classList.remove('hidden'); });

      isSidebarOpen = true;
    }
  }
}

function closeSidebarMobile() {
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    const overlay = document.getElementById('mobileOverlay');
    overlay.classList.add('opacity-0');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
}

// ==========================================================================
// LOGIN HANDLER
// ==========================================================================
function switchLoginTab(tab) {
  document.getElementById('loginError').classList.add('hidden');
  const btnSiswa = document.getElementById('btnSiswaTab');
  const btnAdmin = document.getElementById('btnAdminTab');

  const activeClass = "bg-white text-indigo-600 shadow-sm";
  const inactiveClass = "text-gray-500 hover:text-gray-700 hover:bg-gray-200";

  btnSiswa.className = `flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === 'siswa' ? activeClass : inactiveClass}`;
  btnAdmin.className = `flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === 'admin' ? activeClass : inactiveClass}`;

  if (tab === 'admin') {
    document.getElementById('formAdminLogin').classList.remove('hidden');
    document.getElementById('formSiswaLogin').classList.add('hidden');
  } else {
    document.getElementById('formAdminLogin').classList.add('hidden');
    document.getElementById('formSiswaLogin').classList.remove('hidden');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  showLoading();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const nisn = document.getElementById('nisn').value;

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

function onLoginSuccess(result) {
  hideLoading();

  if (result.success) {
    currentUser = result;
    localStorage.setItem('absensiAppSession', JSON.stringify(result));

    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('dashboardContainer').classList.remove('hidden');

    initDashboard();
  }
}

function logout() {
  stopAndBack(false);
  localStorage.removeItem('absensiAppSession');
  currentUser = null;
  document.getElementById('dashboardContainer').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');

  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('nisn').value = '';
  document.getElementById('sidebar').classList.add('-translate-x-full');
}

// ==========================================================================
// DASHBOARD & MENU
// ==========================================================================
function initDashboard() {
  const name = currentUser.nama || currentUser.username;
  document.getElementById('navUserName').textContent = name;
  document.getElementById('navUserRole').textContent = currentUser.role.toUpperCase();
  document.getElementById('navUserInitial').textContent = name.charAt(0).toUpperCase();

  const menuContainer = document.getElementById('sidebarMenu');
  let menuHTML = '';

  const createItem = (label, icon, onclick, isDefaultActive = false) => {
    const hideText = !isSidebarOpen ? 'hidden' : '';
    const centerClass = !isSidebarOpen ? 'justify-center px-0' : 'space-x-3 px-4';

    const baseStyle = `flex items-center ${centerClass} py-3 rounded-xl transition-all duration-200 group overflow-hidden whitespace-nowrap cursor-pointer `;
    const activeStyle = "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50";
    const inactiveStyle = "text-gray-400 hover:bg-gray-800 hover:text-white";
    const currentStyle = isDefaultActive ? (baseStyle + activeStyle) : (baseStyle + inactiveStyle);

    return `
      <a data-name="${label}" onclick="${onclick}" class="${currentStyle}">
        <i class="fas ${icon} w-6 text-center flex-shrink-0 group-hover:scale-110 transition-transform"></i>
        <span class="sidebar-label font-medium transition-opacity duration-300 ${hideText}">${label}</span>
      </a>`;
  };

  if (currentUser.role === 'admin') {
    menuHTML += createItem('Dashboard', 'fa-home', 'loadAdminDashboard()', true);
    menuHTML += createItem('Data Siswa', 'fa-user-graduate', 'loadDataSiswa()');
    menuHTML += createItem('Data Guru', 'fa-chalkboard-teacher', 'loadDataGuru()');
    menuHTML += createItem('Laporan', 'fa-clipboard-list', 'loadRekapAbsensi()');
    menuHTML += createItem('Kelola Absen', 'fa-calendar-times', 'loadKelolaAbsen()');
    menuHTML += createItem('Scan Absensi', 'fa-qrcode', 'loadScanAbsensi()');
    loadAdminDashboard();
  } else if (currentUser.role === 'guru') {
    menuHTML += createItem('Dashboard', 'fa-home', 'loadGuruDashboard()', true);
    menuHTML += createItem('Monitoring', 'fa-eye', 'loadMonitoringAbsensi()');
    menuHTML += createItem('Scan Absensi', 'fa-qrcode', 'loadScanAbsensi()');
    loadGuruDashboard();
  } else if (currentUser.role === 'siswa') {
    menuHTML += createItem('Dashboard', 'fa-home', 'loadSiswaDashboard()', true);
    menuHTML += createItem('Kartu Saya', 'fa-id-card', 'loadQRCodeSiswa()');
    loadSiswaDashboard();
  }

  menuContainer.innerHTML = menuHTML;
  loadKelasSuggestions();
}

async function loadKelasSuggestions() {
  try {
    const result = await callApi('getKelasList');
    if (result.success) {
      existingClasses = result.data;
    }
  } catch (error) {
    console.error('Error loading kelas:', error);
  }
}

// ==========================================================================
// FUNGSI REFRESH DATA
// ==========================================================================
function refreshData(type) {
  const btnIcon = event ? event.currentTarget.querySelector('i') : null;
  if (btnIcon) btnIcon.classList.add('fa-spin');

  if (type === 'siswa') {
    tableState.siswa.fullData = [];
    loadDataSiswa();
    showAlert('success', 'Data siswa diperbarui.');
  } else if (type === 'guru') {
    tableState.guru.fullData = [];
    loadDataGuru();
    showAlert('success', 'Data guru diperbarui.');
  } else if (type === 'dashboard') {
    if (currentUser.role === 'admin') loadAdminDashboard();
    else if (currentUser.role === 'guru') loadGuruDashboard();
    else loadSiswaDashboard();
    showAlert('success', 'Statistik Dashboard diperbarui.');
  } else if (type === 'monitoring') {
    tableState.monitoring.fullData = [];
    loadMonitoringAbsensi();
    showAlert('success', 'Data monitoring diperbarui.');
  }

  if (btnIcon) setTimeout(() => btnIcon.classList.remove('fa-spin'), 1000);
}

// ==========================================================================
// FUNGSI UTAMA (DASHBOARD, DATA, DLL) - HARUS DITAMBAHKAN
// ==========================================================================
// [Semua fungsi yang sudah ada sebelumnya: loadAdminDashboard, 
//  loadGuruDashboard, loadSiswaDashboard, loadDataSiswa, 
//  loadDataGuru, loadKelolaAbsen, loadRekapAbsensi, 
//  loadMonitoringAbsensi, loadQRCodeSiswa, loadScanAbsensi, 
//  startCamera, initCamera, onScanSuccess, stopAndBack, 
//  showModal, closeModal, showAlert, renderSiswaRows, 
//  renderGuruRows, renderLiburRows, renderRekapRows, 
//  renderMonitoringRows, handleTableSearch, handleTableLimit, 
//  changePage, processTableData, updatePaginationUI, 
//  saveSiswa, saveGuru, deleteSiswaConfirm, deleteGuruConfirm, 
//  handleAddLibur, deleteLiburConfirm, changeStatus, 
//  showAddSiswaModal, showAddGuruModal, editSiswa, editGuru, 
//  viewSiswa, generateQRForSiswa, exportMonitoringExcel, 
//  exportToExcel, applyFilter, saveGlobalConfig, 
//  loadGlobalConfig, handleTableClassFilter, handleTableStatusFilter]
// 
// [Masukkan semua fungsi yang sudah dibuat sebelumnya di sini]
// ==========================================================================

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
function showLoading() { 
  document.getElementById('loadingOverlay').classList.remove('hidden'); 
}

function hideLoading() { 
  document.getElementById('loadingOverlay').classList.add('hidden'); 
}

function showAlert(type, message) {
  const bg = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const div = document.createElement('div');
  div.className = `fixed top-6 right-6 ${bg} text-white px-6 py-4 rounded-xl shadow-2xl z-[80] flex items-center font-medium animate-fade-in transform translate-y-2`;
  div.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-3 text-xl"></i> ${message}`;
  document.body.appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3000);
}

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// ==========================================================================
// START APP
// ==========================================================================
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 App loaded, testing connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.warn('⚠️ Connection test failed, but will still try to login');
  }
  
  checkSession();
});

// Export functions yang diperlukan secara global
window.handleLogin = handleLogin;
window.switchLoginTab = switchLoginTab;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.refreshData = refreshData;
window.showAddSiswaModal = showAddSiswaModal;
window.showAddGuruModal = showAddGuruModal;
window.editSiswa = editSiswa;
window.editGuru = editGuru;
window.viewSiswa = viewSiswa;
window.loadScanAbsensi = loadScanAbsensi;
window.loadDataSiswa = loadDataSiswa;
window.loadDataGuru = loadDataGuru;
window.loadRekapAbsensi = loadRekapAbsensi;
window.loadKelolaAbsen = loadKelolaAbsen;
window.loadMonitoringAbsensi = loadMonitoringAbsensi;
window.loadQRCodeSiswa = loadQRCodeSiswa;
window.generateQRForSiswa = generateQRForSiswa;
window.applyFilter = applyFilter;
window.exportToExcel = exportToExcel;
window.exportMonitoringExcel = exportMonitoringExcel;
window.saveGlobalConfig = saveGlobalConfig;
window.handleAddLibur = handleAddLibur;
window.deleteLiburConfirm = deleteLiburConfirm;
window.handleTableSearch = handleTableSearch;
window.handleTableLimit = handleTableLimit;
window.handleTableClassFilter = handleTableClassFilter;
window.handleTableStatusFilter = handleTableStatusFilter;
window.changePage = changePage;
window.startCamera = startCamera;
window.stopAndBack = stopAndBack;
window.closePermissionModal = closePermissionModal;
window.requestCameraAccess = requestCameraAccess;
