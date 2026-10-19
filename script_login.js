// === 1. EFEK PARALLAX MOUSE ===
const floatingElements = document.querySelectorAll('.bubble, .sticker');
let mouseX = 0, mouseY = 0;
let currentX = 0, currentY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = (window.innerWidth / 2 - e.clientX) * 0.05;
  mouseY = (window.innerHeight / 2 - e.clientY) * 0.05;
});

function animateParallax() {
  currentX += (mouseX - currentX) * 0.05;
  currentY += (mouseY - currentY) * 0.05;

  floatingElements.forEach(el => {
    const depth = el.classList.contains('chip-right') || el.classList.contains('sticker') ? -1.5 : 1;
    el.style.transform = `translate3d(${currentX * depth}px, ${currentY * depth}px, 0)`;
  });

  requestAnimationFrame(animateParallax);
}
animateParallax();


// === 2. FUNGSI MENAMPILKAN LAYAR LOADING ===
function showLoadingAndRedirect() {
  const loader = document.getElementById('loadingScreen');
  
  // Tampilkan layar loading
  loader.style.display = 'flex';
  
  // Beri sedikit waktu agar browser merender (menampilkan) layar loading dengan opacity 0
  setTimeout(() => {
    loader.style.opacity = '1'; // Fade in layar loading
  }, 50);

  // Tunggu 2 detik (2000ms) agar animasi terlihat, lalu pindah halaman
  setTimeout(() => {
    window.location.href = 'chat.html';
  }, 2000);
}


// === 3. LOGIKA TOMBOL MASUK & ONBOARDING ===
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Mencegah halaman reload

  const usernameInput = document.getElementById('username').value.trim();

  if (usernameInput === '') {
    alert("Username tidak boleh kosong!");
    return;
  }

  // Cek apakah user sudah pernah setting profil sebelumnya
  const savedProfile = localStorage.getItem('inloop_profile');
  
  if (savedProfile) {
    // Jika profil sudah ada, simpan nama dan panggil layar loading
    localStorage.setItem('inloop_user', usernameInput);
    showLoadingAndRedirect();
  } else {
    // Jika profil belum ada, isi otomatis form onboarding dan tampilkan
    localStorage.setItem('inloop_user', usernameInput);
    
    document.getElementById('setupName').value = usernameInput;
    document.getElementById('setupHandle').value = usernameInput.toLowerCase().replace(/\s+/g, '');
    
    // Tampilkan modal onboarding
    document.getElementById('onboardingModal').style.display = 'flex';
  }
});


// === 4. LOGIKA SIMPAN PROFIL (ONBOARDING) ===
const btnSaveProfile = document.getElementById('btnSaveProfile');

btnSaveProfile.addEventListener('click', function() {
  const name = document.getElementById('setupName').value.trim();
  const handle = document.getElementById('setupHandle').value.trim().replace('@', '');
  const seed = document.getElementById('setupSeed').value || 1;

  if (name === '' || handle === '') {
    alert("Nama Tampilan dan Username wajib diisi!");
    return;
  }

  // Buat URL avatar berdasarkan angka yang dipilih
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=b6e3f4`;

  // Simpan data profil ke localStorage
  const profileData = { 
    name: name, 
    handle: handle, 
    avatar: avatarUrl 
  };
  localStorage.setItem('inloop_profile', JSON.stringify(profileData));
  
  // Panggil layar loading untuk pindah ke chat
  showLoadingAndRedirect();
});
