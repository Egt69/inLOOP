// === AMBIL DATA DARI PROFIL (ONBOARDING) ===
const savedProfile = localStorage.getItem('inloop_profile');
let currentUser = {};

if (savedProfile) {
  currentUser = JSON.parse(savedProfile);
} else {
  const savedUser = localStorage.getItem('inloop_user') || "Tamu";
  currentUser = {
    name: savedUser,
    handle: savedUser.toLowerCase().replace(/\s+/g, ''),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${savedUser}&style=circle&backgroundColor=b6e3f4`
  };
}

// Set nama di sidebar saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  if(document.getElementById('sidebarName')) {
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarHandle').textContent = `@${currentUser.handle}`;
    document.getElementById('sidebarAvatar').src = currentUser.avatar;
  }
});

// === INISIALISASI SUPABASE (DARI CHAT.HTML) ===
const db = window.supabaseClient;

let currentRoom = "Umum";
let unreadNotifications = 0;

const chatBox = document.getElementById('chatBox');
const messageInput = document.getElementById('messageInput');
const roomNameEl = document.getElementById('roomName');
const headerDescEl = document.getElementById('headerDesc');
const headerTitle = document.getElementById('headerTitle');

// === FUNGSI NOTIFIKASI ===
function addNotification() {
  unreadNotifications++;
  const badge = document.getElementById('profileNotif');
  if(badge) {
    badge.textContent = unreadNotifications;
    badge.style.display = 'flex';
  }
}

function clearNotification() {
  unreadNotifications = 0;
  const badge = document.getElementById('profileNotif');
  if(badge) badge.style.display = 'none';
  openProfileModal();
}

// === FITUR PROFIL ===
function openProfileModal() {
  document.getElementById('profileModal').classList.add('active');
  document.getElementById('inputName').value = currentUser.name;
  document.getElementById('inputHandle').value = currentUser.handle;
  const seedMatch = currentUser.avatar.match(/seed=([^&]+)/);
  document.getElementById('inputSeed').value = seedMatch ? seedMatch[1] : currentUser.name;
  document.getElementById('modalAvatar').src = currentUser.avatar;
}
function closeProfileModal() { document.getElementById('profileModal').classList.remove('active'); }
function updateAvatarPreview() {
  const seed = document.getElementById('inputSeed').value || 1;
  document.getElementById('modalAvatar').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle&backgroundColor=b6e3f4`;
}
function saveProfile() {
  const newName = document.getElementById('inputName').value.trim();
  const newHandle = document.getElementById('inputHandle').value.trim().replace('@', '');
  const newSeed = document.getElementById('inputSeed').value || 1;
  
  if (newName === '' || newHandle === '') { alert("Nama dan Username tidak boleh kosong!"); return; }
  
  currentUser.name = newName;
  currentUser.handle = newHandle;
  currentUser.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}&style=circle&backgroundColor=b6e3f4`;
  
  localStorage.setItem('inloop_user', newName);
  localStorage.setItem('inloop_profile', JSON.stringify(currentUser));

  document.getElementById('sidebarName').textContent = currentUser.name;
  document.getElementById('sidebarHandle').textContent = `@${currentUser.handle}`;
  document.getElementById('sidebarAvatar').src = currentUser.avatar;
  
  closeProfileModal();
  showAlert("Profil berhasil diperbarui!");
}

// === RENDER PESAN KE LAYAR ===
function renderMessages(messages) {
  chatBox.innerHTML = ''; 
  
  const dateEl = document.createElement('div');
  dateEl.className = 'date-separator';
  dateEl.innerHTML = `<span>Hari ini</span>`;
  chatBox.appendChild(dateEl);

  if (messages.length === 0) {
    chatBox.innerHTML += `<div style="text-align:center; color:#94a3b8; margin-top:20px; font-size:14px;">Belum ada pesan. Jadilah yang pertama!</div>`;
    return;
  }
  
  messages.forEach((msg) => {
    const date = new Date(msg.created_at);
    const time = date.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    
    const isSelf = (msg.user_name === currentUser.name);
    
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isSelf ? 'self' : ''}`;
    
    let statusHTML = isSelf ? `<i class="fas fa-check-double msg-status read"></i>` : '';

    msgEl.innerHTML = `
      <img src="${msg.user_avatar}" class="msg-avatar" alt="${msg.user_name}">
      <div class="msg-content-wrapper">
        <div class="msg-bubble">
          ${!isSelf ? `<div class="msg-user">${msg.user_name} <span style="font-size:11px; font-weight:normal; color:#94a3b8;">${time}</span></div>` : ''}
          <div>${msg.text}</div>
          ${isSelf ? `<div style="text-align:right; font-size:11px; margin-top:4px; opacity:0.8;">${time} ${statusHTML}</div>` : ''}
        </div>
      </div>
    `;
    chatBox.appendChild(msgEl);
  });
  
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === FUNGSI AMBIL PESAN DARI DATABASE ===
async function loadMessages(room) {
  // Jangan tampilkan loading jika sedang realtime update
  if (chatBox.innerHTML === '' || chatBox.innerHTML.includes('Memuat pesan')) {
      chatBox.innerHTML = '<div style="text-align:center; color:#94a3b8; margin-top:20px;">Memuat pesan...</div>';
  }
  
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('room', room)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Gagal memuat pesan:", error);
    chatBox.innerHTML = `<div style="text-align:center; color:#ef4444; margin-top:20px;">Gagal memuat pesan. Cek koneksi internet.</div>`;
    return;
  }

  renderMessages(data);
}

// === REALTIME LISTENER (PESAN MASUK OTOMATIS) ===
// Kita dengarkan perubahan di tabel 'messages'
db.channel('schema-db-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => {
      // Jika pesan baru masuk di room yang sedang aktif
      if (payload.new.room === currentRoom) {
        loadMessages(currentRoom); // Muat ulang pesan di layar
      } else {
        // Jika di room lain, beri notifikasi
        addNotification();
      }
    }
  )
  .subscribe();

// === GANTI ROOM ===
function switchRoom(room, desc, element) {
  currentRoom = room;
  messageInput.placeholder = `Ketik pesan ke #${room}...`;
  
  document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  
  const badge = element.querySelector('.badge-unread');
  if (badge) badge.style.display = 'none';
  unreadNotifications = 0;
  const notifBadge = document.getElementById('profileNotif');
  if(notifBadge) notifBadge.style.display = 'none';

  headerTitle.classList.remove('slide-down-fade');
  headerDescEl.classList.remove('slide-down-fade');
  void headerTitle.offsetWidth; 
  
  roomNameEl.textContent = room;
  headerDescEl.textContent = desc;
  
  headerTitle.classList.add('slide-down-fade');
  headerDescEl.classList.add('slide-down-fade');

  chatBox.style.opacity = '0';
  setTimeout(() => { 
    loadMessages(room); 
    chatBox.style.opacity = '1'; 
  }, 150);
}

// === KIRIM PESAN KE DATABASE ===
async function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  
  messageInput.value = ''; // Kosongkan input langsung

  const { error } = await db
    .from('messages')
    .insert([
      { 
        user_name: currentUser.name, 
        user_avatar: currentUser.avatar, 
        text: text, 
        room: currentRoom 
      }
    ]);

  if (error) {
    console.error("Gagal mengirim:", error);
    alert("Pesan gagal terkirim. Coba lagi.");
  }
}

// === KIRIM EMOJI ===
async function sendAnimatedEmoji(emoji) {
  const { error } = await db
    .from('messages')
    .insert([
      { 
        user_name: currentUser.name, 
        user_avatar: currentUser.avatar, 
        text: emoji, 
        room: currentRoom 
      }
    ]);
    
  if (error) console.error(error);
  document.getElementById('emojiPicker').classList.remove('active');
}

// === FITUR LAINNYA ===
function toggleInputEmoji() {
  const picker = document.getElementById('emojiPicker');
  picker.classList.toggle('active');
}
function showAlert(message) { alert(message); }

function logout() {
  if (confirm('Yakin mau keluar dari inLOOP?')) {
    localStorage.removeItem('inloop_user');
    localStorage.removeItem('inloop_profile');
    window.location.href = 'index.html';
  }
}

// === EVENT LISTENERS ===
document.getElementById('sendBtn').addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
document.getElementById('profileModal').addEventListener('click', function(e) { if (e.target === this) closeProfileModal(); });
document.addEventListener('click', function(event) {
  const picker = document.getElementById('emojiPicker');
  const btn = document.getElementById('emojiBtn');
  if (picker.classList.contains('active') && !picker.contains(event.target) && event.target !== btn) {
    picker.classList.remove('active');
  }
});

// Muat pesan pertama kali halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadMessages(currentRoom);
});
