// === AMBIL DATA DARI PROFIL ===
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

document.addEventListener("DOMContentLoaded", () => {
  if(document.getElementById('sidebarName')) {
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarHandle').textContent = `@${currentUser.handle}`;
    document.getElementById('sidebarAvatar').src = currentUser.avatar;
  }
});

const defaultChatData = {
  "Umum": [
    { type: "date", text: "Hari ini" },
    { user: "ZioHara", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=ZioHara&style=circle&backgroundColor=b6e3f4", text: "Halo semuanya! Selamat datang di inLOOP.", time: "10:00", isSelf: false, reactions: [] }
  ],
  "Teknologi": [],
  "Random": []
};

let chatData = {};
let replyTarget = null;
let unreadNotifications = 0;

// === SISTEM PENYIMPANAN ===
function loadChatFromStorage() {
  const savedData = localStorage.getItem('inloop_chat_data');
  if (savedData) {
    chatData = JSON.parse(savedData);
  } else {
    chatData = JSON.parse(JSON.stringify(defaultChatData));
    saveChatToStorage();
  }
}
function saveChatToStorage() { localStorage.setItem('inloop_chat_data', JSON.stringify(chatData)); }
loadChatFromStorage();

let currentRoom = "Umum";
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
  renderMessages(currentRoom); 
}

// === RENDER PESAN ===
function renderMessages(room) {
  chatBox.innerHTML = ''; 
  const messages = chatData[room] || [];
  
  messages.forEach((msg, index) => {
    if (msg.type === 'date') {
      const dateEl = document.createElement('div');
      dateEl.className = 'date-separator';
      dateEl.innerHTML = `<span>${msg.text}</span>`;
      chatBox.appendChild(dateEl);
      return;
    }

    const msgEl = document.createElement('div');
    msgEl.className = `message ${msg.isSelf ? 'self' : ''}`;
    
    let reactionsHTML = '';
    if (msg.reactions && msg.reactions.length > 0) {
      reactionsHTML = `<div class="msg-reactions">`;
      msg.reactions.forEach(r => { reactionsHTML += `<div class="reaction">${r.emoji} ${r.count}</div>`; });
      reactionsHTML += `</div>`;
    }

    let statusHTML = msg.isSelf ? `<i class="fas fa-check-double msg-status read"></i>` : '';
    let isEmojiOnly = /^[\p{Emoji}\s]+$/u.test(msg.text) && !/[a-zA-Z0-9]/.test(msg.text);
    let textClass = isEmojiOnly ? 'emoji-chat-text' : '';

    let textContent = msg.text;
    if (msg.isImage) {
      textContent = `<img src="${msg.text}" style="max-width: 200px; border-radius: 12px; margin-top: 5px; display: block;">`;
    }

    let replyHTML = '';
    if (msg.replyTo) {
      replyHTML = `
        <div class="quote-box">
          <b>${msg.replyTo.user}</b><br>
          ${msg.replyTo.text.length > 30 ? msg.replyTo.text.substring(0, 30) + '...' : msg.replyTo.text}
        </div>
      `;
    }

    let formattedText = textContent.replace(
      new RegExp(`@${currentUser.handle}`, 'gi'), 
      `<span style="color: #fbbf24; font-weight: bold; background: rgba(251, 191, 36, 0.2); padding: 0 4px; border-radius: 4px;">@${currentUser.handle}</span>`
    );

    msgEl.innerHTML = `
      <img src="${msg.avatar}" class="msg-avatar" alt="${msg.user}">
      <div class="msg-content-wrapper">
        <div class="msg-bubble">
          ${!msg.isSelf ? `<div class="msg-user">${msg.user} <span style="font-size:11px; font-weight:normal; color:#94a3b8;">${msg.time}</span></div>` : ''}
          ${replyHTML}
          <div class="${textClass}">${formattedText}</div>
          ${msg.isSelf ? `<div style="text-align:right; font-size:11px; margin-top:4px; opacity:0.8;">${msg.time} ${statusHTML}</div>` : ''}
          
          <div class="msg-actions" id="actions-${index}">
            <i class="fas fa-smile" title="Beri Reaksi" onclick="toggleEmojiPicker(${index})"></i>
            <i class="fas fa-reply" title="Balas" onclick="setReply(${index})"></i>
            ${msg.isSelf ? `<i class="fas fa-edit" title="Edit" onclick="editMessage('${room}', ${index})"></i>` : ''}
            ${msg.isSelf ? `<i class="fas fa-trash" title="Hapus" onclick="deleteMessage('${room}', ${index})"></i>` : ''}
          </div>
        </div>
        ${reactionsHTML}
      </div>
    `;
    chatBox.appendChild(msgEl);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === FITUR REPLY (BALAS) ===
function setReply(index) {
  const msg = chatData[currentRoom][index];
  replyTarget = { user: msg.user, text: msg.text };
  messageInput.placeholder = `Membalas ${msg.user}...`;
  messageInput.focus();
}
function cancelReply() {
  replyTarget = null;
  messageInput.placeholder = `Ketik pesan ke #${currentRoom}...`;
}

// === FITUR KIRIM GAMBAR ===
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Image = e.target.result;
    const time = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
    chatData[currentRoom].push({ user: currentUser.name, avatar: currentUser.avatar, text: base64Image, time: time, isSelf: true, reactions: [], isImage: true });
    saveChatToStorage();
    renderMessages(currentRoom);
    event.target.value = ''; 
  };
  reader.readAsDataURL(file);
}

// === REAKSI, EDIT, HAPUS ===
function toggleEmojiPicker(index) {
  const existing = document.querySelector('.emoji-picker');
  if (existing) existing.remove();
  const actionsDiv = document.getElementById(`actions-${index}`);
  const picker = document.createElement('div');
  picker.className = 'emoji-picker';
  picker.innerHTML = `
    <span onclick="addReaction(${index}, '❤️')">❤️</span>
    <span onclick="addReaction(${index}, '👍')">👍</span>
    <span onclick="addReaction(${index}, '😂')">😂</span>
    <span onclick="addReaction(${index}, '🔥')">🔥</span>
  `;
  actionsDiv.appendChild(picker);
}
function addReaction(index, emoji) {
  const msg = chatData[currentRoom][index];
  if (!msg.reactions) msg.reactions = [];
  const existing = msg.reactions.find(r => r.emoji === emoji);
  if (existing) existing.count++;
  else msg.reactions.push({ emoji: emoji, count: 1 });
  saveChatToStorage();
  renderMessages(currentRoom);
}
function editMessage(room, index) {
  const msg = chatData[room][index];
  if (msg.isImage) { alert("Gambar tidak bisa diedit!"); return; }
  const newText = prompt("Edit pesanmu:", msg.text);
  if (newText !== null && newText.trim() !== "") {
    msg.text = newText.trim();
    saveChatToStorage();
    renderMessages(room);
  }
}
function deleteMessage(room, index) {
  if (confirm("Yakin mau hapus pesan ini?")) {
    chatData[room].splice(index, 1);
    saveChatToStorage();
    renderMessages(room);
  }
}

// === GANTI ROOM & KIRIM PESAN ===
function switchRoom(room, desc, element) {
  currentRoom = room;
  cancelReply();
  document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
  element.classList.add('active');
  const badge = element.querySelector('.badge-unread');
  if (badge) badge.style.display = 'none';
  headerTitle.classList.remove('slide-down-fade');
  headerDescEl.classList.remove('slide-down-fade');
  void headerTitle.offsetWidth; 
  roomNameEl.textContent = room;
  headerDescEl.textContent = desc;
  headerTitle.classList.add('slide-down-fade');
  headerDescEl.classList.add('slide-down-fade');
  chatBox.style.opacity = '0';
  setTimeout(() => { renderMessages(room); chatBox.style.opacity = '1'; }, 150);
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text === '') return;
  const time = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
  const newMessage = { user: currentUser.name, avatar: currentUser.avatar, text: text, time: time, isSelf: true, reactions: [] };
  if (replyTarget) {
    newMessage.replyTo = replyTarget;
    cancelReply();
  }
  chatData[currentRoom].push(newMessage);
  saveChatToStorage();
  renderMessages(currentRoom);
  messageInput.value = '';
}

// === FITUR EMOJI TEKS ===
function sendAnimatedEmoji(emoji) {
  const time = new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
  chatData[currentRoom].push({ user: currentUser.name, avatar: currentUser.avatar, text: emoji, time: time, isSelf: true, reactions: [] });
  saveChatToStorage();
  renderMessages(currentRoom);
  document.getElementById('emojiPicker').classList.remove('active');
}

function toggleInputEmoji() {
  const picker = document.getElementById('emojiPicker');
  picker.classList.toggle('active');
}
function showAlert(message) { alert(message); }

// === FUNGSI LOGOUT ===
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

renderMessages(currentRoom);