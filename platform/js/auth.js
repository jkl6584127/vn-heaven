// ============================================================
// auth.js - Authentication & Role-based Access Control
// ============================================================

const Auth = {
  login(username, password) {
    const users = DB.getAll('users');
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return null;
    if (user.status === 'suspended') return { error: '帳號已被停用' };
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('currentUser');
    // Detect context: are we in a subfolder?
    const path = window.location.pathname;
    if (path.includes('/admin/') || path.includes('/merchant/')) {
      window.location.href = '../login.html';
    } else if (path.includes('/user/')) {
      window.location.href = '../index.html';
    } else {
      window.location.href = 'index.html';
    }
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  // For admin/merchant pages — redirects if not logged in or wrong role
  requireRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = '../login.html';
      return null;
    }
    if (user.role === 'admin') return user;
    if (!allowedRoles.includes(user.role)) {
      window.location.href = '../login.html';
      return null;
    }
    return user;
  },

  // For user pages — shows login modal instead of redirecting
  requireLogin() {
    const user = this.getCurrentUser();
    if (!user) {
      showLoginModal();
      return null;
    }
    return user;
  },

  getRedirectUrl(role) {
    switch (role) {
      case 'admin': return 'admin/dashboard.html';
      case 'merchant': return 'merchant/dashboard.html';
      case 'user': return 'index.html';
      default: return 'index.html';
    }
  }
};

// ---- Login Modal ----
function showLoginModal() {
  if (document.getElementById('loginModalOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'loginModalOverlay';
  overlay.className = 'login-modal-overlay show';
  overlay.innerHTML = `
    <div class="login-modal">
      <div class="modal-header">
        <h2>登入</h2>
        <button class="modal-close" onclick="closeLoginModal()">&times;</button>
      </div>
      <div class="login-modal-error" id="modalLoginError" style="display:none"></div>
      <form id="modalLoginForm">
        <div class="form-group">
          <label>帳號</label>
          <input type="text" class="form-control" id="modalUsername" placeholder="請輸入帳號" required>
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input type="password" class="form-control" id="modalPassword" placeholder="請輸入密碼" required>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="padding:12px;font-size:1rem;">登入</button>
      </form>
      <div class="login-modal-hint">
        <strong>測試帳號：</strong><br>
        用戶：user / user123
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('modalLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('modalUsername').value.trim();
    const password = document.getElementById('modalPassword').value;
    const result = Auth.login(username, password);
    const errEl = document.getElementById('modalLoginError');
    if (!result) {
      errEl.textContent = '帳號或密碼錯誤。';
      errEl.style.display = 'block';
    } else if (result.error) {
      errEl.textContent = result.error;
      errEl.style.display = 'block';
    } else {
      location.reload();
    }
  });
}

function closeLoginModal() {
  const overlay = document.getElementById('loginModalOverlay');
  if (overlay) overlay.remove();
}

// ---- Top Navbar for public-facing pages ----
function buildTopNav(activePage) {
  const user = Auth.getCurrentUser();
  // Detect if we're in user/ subfolder or root
  const inSubfolder = window.location.pathname.includes('/user/');
  const prefix = inSubfolder ? '../' : '';
  const userPrefix = inSubfolder ? '' : 'user/';

  const menuItems = [
    { href: prefix + 'index.html', label: '首頁', id: 'home' },
    { href: userPrefix + 'index.html', label: '購物商城', id: 'shop' },
    { href: userPrefix + 'restaurants.html', label: '合作餐廳', id: 'restaurants' },
    { href: userPrefix + 'ktv.html', label: 'KTV', id: 'ktv' },
    { href: userPrefix + 'entertainment.html', label: '娛樂', id: 'entertainment' },
    { href: userPrefix + 'laundry.html', label: '自助洗衣', id: 'laundry' },
  ];

  let rightHtml = '';
  if (user) {
    const cartHref = userPrefix + 'cart.html';
    const ordersHref = userPrefix + 'orders.html';
    const profileHref = userPrefix + 'profile.html';
    rightHtml = `
      <a href="${cartHref}" class="topnav-icon" title="購物車">🛒</a>
      <div class="topnav-user" onclick="this.querySelector('.topnav-dropdown').classList.toggle('show')">
        <div class="topnav-avatar">${(user.name || '?')[0]}</div>
        <span class="topnav-uname">${user.name}</span>
        <div class="topnav-dropdown">
          <a href="${ordersHref}">📦 我的訂單</a>
          <a href="${profileHref}">👤 個人檔案</a>
          <div class="topnav-dd-divider"></div>
          <a href="#" onclick="Auth.logout();return false;" class="topnav-dd-danger">🚪 登出</a>
        </div>
      </div>
    `;
  } else {
    rightHtml = `
      <button class="topnav-login-btn" onclick="showLoginModal()">登入 / 註冊</button>
    `;
  }

  const nav = document.createElement('nav');
  nav.className = 'topnav';
  nav.id = 'topnav';
  nav.innerHTML = `
    <div class="topnav-inner">
      <a href="${prefix}index.html" class="topnav-logo"><span class="logo-vn">VN</span><span class="logo-heaven">Heaven</span></a>
      <div class="topnav-links" id="topnavLinks">
        ${menuItems.map(m => `<a href="${m.href}" class="topnav-link${activePage === m.id ? ' active' : ''}">${m.label}</a>`).join('')}
      </div>
      <div class="topnav-right">
        ${rightHtml}
      </div>
      <button class="topnav-hamburger" onclick="document.getElementById('topnavLinks').classList.toggle('open')">☰</button>
    </div>
  `;
  document.body.prepend(nav);

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    document.querySelectorAll('.topnav-dropdown').forEach(dd => {
      if (!dd.parentElement.contains(e.target)) dd.classList.remove('show');
    });
  });
}

// ---- Sidebar builder (for admin/merchant only) ----
function buildSidebar(role, activePage) {
  const user = Auth.getCurrentUser();
  const menus = {
    admin: [
      { href: 'dashboard.html', icon: '📊', label: '儀表板' },
      { href: 'users.html', icon: '👥', label: '用戶管理' },
      { href: 'merchants.html', icon: '🏪', label: '商家管理' },
      { href: 'orders.html', icon: '📦', label: '訂單管理' },
      { href: 'settings.html', icon: '⚙️', label: '系統設定' },
    ],
    merchant: [
      { href: 'dashboard.html', icon: '📊', label: '儀表板' },
      { href: 'products.html', icon: '📦', label: '商品管理' },
      { href: 'orders.html', icon: '🛒', label: '訂單管理' },
      { href: 'inventory.html', icon: '📋', label: '庫存管理' },
      { href: 'reports.html', icon: '📈', label: '營收報表' },
    ],
  };

  const items = menus[role] || [];
  const titleMap = { admin: '管理後台', merchant: '商家後台' };
  const roleLabel = { admin: '管理員', merchant: '商家' };

  const displayName = user?.name || '未知用戶';
  const displayRole = roleLabel[user?.role] || user?.role || '';
  const avatarLetter = (user?.name || 'U')[0];

  let html = `
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">${titleMap[role] || ''}</div>
        <button class="sidebar-close" onclick="document.getElementById('sidebar').classList.remove('open')">&times;</button>
      </div>
      <div class="sidebar-user">
        <div class="avatar">${avatarLetter}</div>
        <div class="user-info">
          <div class="user-name">${displayName}</div>
          <div class="user-role">${displayRole}</div>
        </div>
      </div>
      <nav class="sidebar-nav">`;

  items.forEach(item => {
    const isActive = activePage === item.href ? ' active' : '';
    html += `<a href="${item.href}" class="nav-item${isActive}"><span class="nav-icon">${item.icon}</span>${item.label}</a>`;
  });

  html += `
      </nav>
      <div class="sidebar-footer">
        <button class="btn-logout" onclick="Auth.logout()">🚪 登出</button>
      </div>
    </div>
    <button class="hamburger" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>`;

  return html;
}

function initSidebar(role, activePage) {
  const container = document.getElementById('app');
  if (!container) return;
  container.insertAdjacentHTML('afterbegin', buildSidebar(role, activePage));
}
