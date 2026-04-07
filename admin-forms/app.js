// ===== Auth =====
const TOKEN = sessionStorage.getItem('admin_token');

function authHeaders() {
    return { 'Authorization': 'Bearer ' + TOKEN };
}

function authJsonHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN };
}

function redirectToLogin() {
    sessionStorage.removeItem('admin_token');
    window.location.replace('/admin-forms/login.html');
}

// Double-check: no token → leave immediately
if (!TOKEN) { redirectToLogin(); }

// Verify token with server before showing anything
(async function gate() {
    try {
        const res = await fetch('/api/auth/verify', { method: 'POST', headers: authHeaders() });
        const data = await res.json();
        if (!data.valid) { redirectToLogin(); return; }
    } catch {
        // Network error — allow page if token exists (offline tolerance)
    }
    // Auth passed — reveal the page
    document.body.style.visibility = 'visible';
    init();
})();

// ===== Elements =====
const API = '/api/submissions';
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const detailModal = document.getElementById('detailModal');
const deleteModal = document.getElementById('deleteModal');
const noteModal = document.getElementById('noteModal');
const modalBody = document.getElementById('modalBody');
const noteTextarea = document.getElementById('noteTextarea');

let submissions = [];
let pendingDeleteId = null;
let pendingNoteId = null;
let currentFilter = 'all';
let duplicateIds = new Set();

// ===== Duplicate Detection =====
function detectDuplicates() {
    duplicateIds.clear();
    const phoneMap = {};
    const lineMap = {};

    submissions.forEach(s => {
        const phone = s.phone.trim().toLowerCase();
        const line = s.line.trim().toLowerCase();

        if (phone) {
            if (!phoneMap[phone]) phoneMap[phone] = [];
            phoneMap[phone].push(s.id);
        }
        if (line) {
            if (!lineMap[line]) lineMap[line] = [];
            lineMap[line].push(s.id);
        }
    });

    Object.values(phoneMap).forEach(ids => {
        if (ids.length > 1) {
            ids.slice(0, -1).forEach(id => duplicateIds.add(id));
        }
    });
    Object.values(lineMap).forEach(ids => {
        if (ids.length > 1) {
            ids.slice(0, -1).forEach(id => duplicateIds.add(id));
        }
    });
}

function isDuplicate(id) {
    return duplicateIds.has(id);
}

function getEffectiveStatus(s) {
    if (isDuplicate(s.id)) return '重複';
    return s.contactStatus || '未聯絡';
}

// ===== Handle 401 =====
function handle401(res) {
    if (res.status === 401) {
        sessionStorage.removeItem('admin_token');
        window.location.href = '/admin-forms/login.html';
        return true;
    }
    return false;
}

// ===== Fetch & Render =====
async function loadData() {
    tableBody.innerHTML = '<tr class="empty-row"><td colspan="8">載入中...</td></tr>';
    try {
        const res = await fetch(API, { headers: authHeaders() });
        if (handle401(res)) return;
        submissions = await res.json();
        detectDuplicates();
        updateStats();
        applyFilters();
    } catch {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="8">載入失敗，請稍後再試</td></tr>';
    }
}

function updateStats() {
    document.getElementById('totalCount').textContent = submissions.length;
    document.getElementById('uncontactedCount').textContent =
        submissions.filter(s => !isDuplicate(s.id) && (!s.contactStatus || s.contactStatus === '未聯絡')).length;
    document.getElementById('contactedCount').textContent =
        submissions.filter(s => s.contactStatus === '已聯絡').length;
    document.getElementById('duplicateCount').textContent = duplicateIds.size;
}

function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    let filtered = submissions;

    if (currentFilter !== 'all') {
        if (currentFilter === '重複') {
            filtered = filtered.filter(s => isDuplicate(s.id));
        } else {
            filtered = filtered.filter(s => !isDuplicate(s.id) && getEffectiveStatus(s) === currentFilter);
        }
    }

    if (q) {
        filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q) ||
            s.line.toLowerCase().includes(q)
        );
    }

    renderTable(filtered);
}

function renderTable(data) {
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-icon">&#128203;</div>
                        <p>尚無符合條件的紀錄</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = data.map(s => {
        const dup = isDuplicate(s.id);
        const status = getEffectiveStatus(s);
        const rowClass = dup ? 'row-duplicate' : (s.read ? '' : 'unread');
        const noteVal = s.note || '';
        const noteDisplay = noteVal ? escapeHtml(noteVal) : '點擊新增';
        const noteClass = noteVal ? 'has-note' : '';

        let statusCell;
        if (dup) {
            statusCell = `<span class="status-badge-duplicate">重複</span>`;
        } else {
            statusCell = `
                <select class="status-select s-${status}" data-id="${s.id}" onchange="changeStatus(this)">
                    <option value="未聯絡" ${status === '未聯絡' ? 'selected' : ''}>未聯絡</option>
                    <option value="已聯絡" ${status === '已聯絡' ? 'selected' : ''}>已聯絡</option>
                    <option value="未接" ${status === '未接' ? 'selected' : ''}>未接</option>
                    <option value="假資料" ${status === '假資料' ? 'selected' : ''}>假資料</option>
                </select>`;
        }

        return `
        <tr class="${rowClass}" data-id="${s.id}">
            <td><span class="status-dot ${s.read ? 'read' : 'unread'}"></span></td>
            <td class="name-cell">${escapeHtml(s.name)}</td>
            <td class="phone-cell">${escapeHtml(s.phone)}</td>
            <td class="line-cell">${escapeHtml(s.line)}</td>
            <td>${statusCell}</td>
            <td class="note-cell">
                <div class="note-preview" onclick="editNote('${s.id}')">
                    <span class="note-text ${noteClass}">${noteDisplay}</span>
                    <span class="note-edit-icon">&#9998;</span>
                </div>
            </td>
            <td class="time-cell">${formatTime(s.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-action view" title="查看詳情" onclick="viewDetail('${s.id}')">&#128065;</button>
                    <button class="btn-action delete" title="刪除" onclick="confirmDelete('${s.id}')">&#128465;</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

// ===== Filter Buttons =====
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyFilters();
    });
});

// ===== Search =====
searchInput.addEventListener('input', applyFilters);

// ===== Change Contact Status =====
async function changeStatus(selectEl) {
    const id = selectEl.dataset.id;
    const newStatus = selectEl.value;
    try {
        const res = await fetch(`${API}/${id}`, {
            method: 'PATCH',
            headers: authJsonHeaders(),
            body: JSON.stringify({ contactStatus: newStatus }),
        });
        if (handle401(res)) return;
        const s = submissions.find(x => x.id === id);
        if (s) s.contactStatus = newStatus;
        selectEl.className = `status-select s-${newStatus}`;
        updateStats();
    } catch {
        alert('狀態更新失敗，請稍後再試');
    }
}

// ===== Edit Note =====
function editNote(id) {
    const s = submissions.find(x => x.id === id);
    if (!s) return;
    pendingNoteId = id;
    noteTextarea.value = s.note || '';
    noteModal.classList.add('active');
    noteTextarea.focus();
}

document.getElementById('noteSaveBtn').addEventListener('click', async () => {
    if (!pendingNoteId) return;
    const note = noteTextarea.value.trim();
    try {
        const res = await fetch(`${API}/${pendingNoteId}`, {
            method: 'PATCH',
            headers: authJsonHeaders(),
            body: JSON.stringify({ note }),
        });
        if (handle401(res)) return;
        const s = submissions.find(x => x.id === pendingNoteId);
        if (s) s.note = note;
        applyFilters();
    } catch {
        alert('備註儲存失敗，請稍後再試');
    }
    pendingNoteId = null;
    noteModal.classList.remove('active');
});

// ===== View Detail =====
async function viewDetail(id) {
    const s = submissions.find(x => x.id === id);
    if (!s) return;

    if (!s.read) {
        const res = await fetch(`${API}/${id}/read`, { method: 'PATCH', headers: authHeaders() });
        if (handle401(res)) return;
        s.read = true;
        updateStats();
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.remove('unread');
            const dot = row.querySelector('.status-dot');
            if (dot) dot.classList.replace('unread', 'read');
        }
    }

    const status = getEffectiveStatus(s);
    const statusClass = `status-${status}`;

    modalBody.innerHTML = `
        <div class="detail-field">
            <div class="detail-label">姓名</div>
            <div class="detail-value">${escapeHtml(s.name)}</div>
        </div>
        <div class="detail-field">
            <div class="detail-label">電話</div>
            <div class="detail-value">${escapeHtml(s.phone)}</div>
        </div>
        <div class="detail-field">
            <div class="detail-label">LINE ID</div>
            <div class="detail-value gold">${escapeHtml(s.line)}</div>
        </div>
        <div class="detail-field">
            <div class="detail-label">聯絡狀態</div>
            <div class="detail-value ${statusClass}">${status}</div>
        </div>
        <div class="detail-field">
            <div class="detail-label">備註</div>
            <div class="detail-value">${s.note ? escapeHtml(s.note) : '<span style="color:var(--gray-600)">無備註</span>'}</div>
        </div>
        <div class="detail-field">
            <div class="detail-label">送出時間</div>
            <div class="detail-value">${formatTimeFull(s.createdAt)}</div>
        </div>
    `;
    detailModal.classList.add('active');
}

// ===== Delete =====
function confirmDelete(id) {
    pendingDeleteId = id;
    deleteModal.classList.add('active');
}

document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    try {
        const res = await fetch(`${API}/${pendingDeleteId}`, { method: 'DELETE', headers: authHeaders() });
        if (handle401(res)) return;
        submissions = submissions.filter(s => s.id !== pendingDeleteId);
        detectDuplicates();
        updateStats();
        applyFilters();
    } catch {
        alert('刪除失敗，請稍後再試');
    }
    pendingDeleteId = null;
    deleteModal.classList.remove('active');
});

// ===== Modal Close =====
document.getElementById('modalClose').addEventListener('click', () => detailModal.classList.remove('active'));
document.getElementById('deleteModalClose').addEventListener('click', () => deleteModal.classList.remove('active'));
document.getElementById('deleteCancelBtn').addEventListener('click', () => deleteModal.classList.remove('active'));
document.getElementById('noteModalClose').addEventListener('click', () => noteModal.classList.remove('active'));
document.getElementById('noteCancelBtn').addEventListener('click', () => noteModal.classList.remove('active'));

detailModal.addEventListener('click', (e) => { if (e.target === detailModal) detailModal.classList.remove('active'); });
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.remove('active'); });
noteModal.addEventListener('click', (e) => { if (e.target === noteModal) noteModal.classList.remove('active'); });

// ===== Logout =====
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: authHeaders() });
    sessionStorage.removeItem('admin_token');
    window.location.href = '/admin-forms/login.html';
});

// ===== Refresh =====
refreshBtn.addEventListener('click', loadData);

// ===== Helpers =====
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTime(iso) {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
}

function formatTimeFull(iso) {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// ===== Init (called after auth gate passes) =====
function init() {
    loadData();
}
