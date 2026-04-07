const API = '/api/submissions';
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const detailModal = document.getElementById('detailModal');
const deleteModal = document.getElementById('deleteModal');
const modalBody = document.getElementById('modalBody');

let submissions = [];
let pendingDeleteId = null;

// ===== Fetch & Render =====
async function loadData() {
    tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">載入中...</td></tr>';
    try {
        const res = await fetch(API);
        submissions = await res.json();
        updateStats();
        renderTable(submissions);
    } catch {
        tableBody.innerHTML = '<tr class="empty-row"><td colspan="6">載入失敗，請稍後再試</td></tr>';
    }
}

function updateStats() {
    document.getElementById('totalCount').textContent = submissions.length;
    document.getElementById('unreadCount').textContent = submissions.filter(s => !s.read).length;

    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('todayCount').textContent =
        submissions.filter(s => s.createdAt.slice(0, 10) === today).length;
}

function renderTable(data) {
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">&#128203;</div>
                        <p>尚無諮詢表單紀錄</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = data.map(s => `
        <tr class="${s.read ? '' : 'unread'}" data-id="${s.id}">
            <td><span class="status-dot ${s.read ? 'read' : 'unread'}"></span></td>
            <td class="name-cell">${escapeHtml(s.name)}</td>
            <td class="phone-cell">${escapeHtml(s.phone)}</td>
            <td class="line-cell">${escapeHtml(s.line)}</td>
            <td class="time-cell">${formatTime(s.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-action view" title="查看詳情" onclick="viewDetail('${s.id}')">&#128065;</button>
                    <button class="btn-action delete" title="刪除" onclick="confirmDelete('${s.id}')">&#128465;</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===== Search =====
searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
        renderTable(submissions);
        return;
    }
    const filtered = submissions.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.line.toLowerCase().includes(q)
    );
    renderTable(filtered);
});

// ===== View Detail =====
async function viewDetail(id) {
    const s = submissions.find(x => x.id === id);
    if (!s) return;

    // Mark as read
    if (!s.read) {
        await fetch(`${API}/${id}/read`, { method: 'PATCH' });
        s.read = true;
        updateStats();
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.classList.remove('unread');
            row.querySelector('.status-dot').classList.replace('unread', 'read');
        }
    }

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
        await fetch(`${API}/${pendingDeleteId}`, { method: 'DELETE' });
        submissions = submissions.filter(s => s.id !== pendingDeleteId);
        updateStats();
        renderTable(submissions);
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

detailModal.addEventListener('click', (e) => { if (e.target === detailModal) detailModal.classList.remove('active'); });
deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) deleteModal.classList.remove('active'); });

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

// ===== Init =====
loadData();
