// ============================================================
// db.js - localStorage Database Initialization & Helpers
// ============================================================

const DB = {
  // ---- helpers ----
  get(key) { return JSON.parse(localStorage.getItem(key) || 'null'); },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },
  genId() { return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36); },

  // ---- initialise default data (version-based) ----
  init() {
    const currentVersion = 5;
    const storedVersion = this.get('__db_version__');
    if (storedVersion >= currentVersion) return;

    // Clear old data for re-seeding
    ['users','categories','products','orders','carts','restaurants','ktvs','entertainment','laundryMachines','laundryModes','__db_init__'].forEach(k => localStorage.removeItem(k));

    // --- Users ---
    const users = [
      { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin', name: '超級管理員', email: 'admin@platform.com', phone: '0900-000-000', status: 'active', createdAt: '2025-01-01' },
      { id: 'u_merchant', username: 'merchant', password: 'merchant123', role: 'merchant', name: '示範商家', email: 'merchant@shop.com', phone: '0911-111-111', status: 'active', shopName: '示範商店', createdAt: '2025-02-01' },
      { id: 'u_merchant2', username: 'merchant2', password: 'merchant123', role: 'merchant', name: '食品商家', email: 'food@shop.com', phone: '0922-222-222', status: 'active', shopName: '亞洲雜貨', createdAt: '2025-03-01' },
      { id: 'u_user', username: 'user', password: 'user123', role: 'user', name: '測試用戶', email: 'user@mail.com', phone: '0933-333-333', status: 'active', createdAt: '2025-03-15' },
      { id: 'u_user2', username: 'user2', password: 'user123', role: 'user', name: 'Maria Santos', email: 'maria@mail.com', phone: '0944-444-444', status: 'active', createdAt: '2025-04-01' },
      { id: 'u_user3', username: 'user3', password: 'user123', role: 'user', name: 'Nguyen Van', email: 'nguyen@mail.com', phone: '0955-555-555', status: 'suspended', createdAt: '2025-04-10' },
    ];

    // --- Categories ---
    const categories = [
      { id: 'cat1', name: '食品零食', icon: '🍜' },
      { id: 'cat2', name: '日常用品', icon: '🧴' },
      { id: 'cat3', name: '電話卡 / SIM卡', icon: '📱' },
      { id: 'cat4', name: '服飾', icon: '👕' },
      { id: 'cat5', name: '電子產品', icon: '🔌' },
      { id: 'cat6', name: '醫藥保健', icon: '💊' },
    ];

    // --- Products ---
    const products = [
      { id: 'p1', merchantId: 'u_merchant', name: '泡麵（5入裝）', category: 'cat1', price: 89, stock: 200, sold: 45, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80', description: '正宗東南亞風味泡麵，5包裝。香辣美味！', status: 'active', createdAt: '2025-03-01' },
      { id: 'p2', merchantId: 'u_merchant', name: '30天預付SIM卡', category: 'cat3', price: 300, stock: 150, sold: 88, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', description: '30天吃到飽預付SIM卡，支援4G/5G網路。', status: 'active', createdAt: '2025-03-01' },
      { id: 'p3', merchantId: 'u_merchant', name: '行動電源 10000mAh', category: 'cat5', price: 499, stock: 30, sold: 12, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80', description: '輕巧行動電源，雙USB輸出，支援快充。', status: 'active', createdAt: '2025-03-05' },
      { id: 'p4', merchantId: 'u_merchant', name: '頭痛藥（10錠）', category: 'cat6', price: 65, stock: 100, sold: 33, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80', description: '常見頭痛止痛藥，每盒10錠。', status: 'active', createdAt: '2025-03-10' },
      { id: 'p5', merchantId: 'u_merchant', name: '純棉T恤（M號）', category: 'cat4', price: 199, stock: 50, sold: 20, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80', description: '100%純棉舒適T恤，尺寸M。', status: 'active', createdAt: '2025-03-12' },
      { id: 'p6', merchantId: 'u_merchant2', name: '魚露 500ml', category: 'cat1', price: 120, stock: 80, sold: 55, image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400&q=80', description: '正宗越南魚露，500ml瓶裝。', status: 'active', createdAt: '2025-03-15' },
      { id: 'p7', merchantId: 'u_merchant2', name: '茉莉香米 5kg', category: 'cat1', price: 250, stock: 60, sold: 40, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80', description: '優質泰國茉莉香米，5公斤裝。', status: 'active', createdAt: '2025-03-15' },
      { id: 'p8', merchantId: 'u_merchant2', name: '洗髮精 400ml', category: 'cat2', price: 149, stock: 45, sold: 18, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80', description: '去屑洗髮精，清涼薄荷香。', status: 'active', createdAt: '2025-03-20' },
      { id: 'p9', merchantId: 'u_merchant', name: 'USB-C 充電線', category: 'cat5', price: 129, stock: 0, sold: 60, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80', description: '1.5米編織USB-C充電線，支援快充。', status: 'active', createdAt: '2025-04-01' },
      { id: 'p10', merchantId: 'u_merchant2', name: '洗衣精 1L', category: 'cat2', price: 99, stock: 70, sold: 30, image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80', description: '濃縮洗衣精，清新香味。', status: 'active', createdAt: '2025-04-05' },
    ];

    // --- Orders ---
    const orders = [
      { id: 'ord1', userId: 'u_user', merchantId: 'u_merchant', items: [{ productId: 'p1', name: '泡麵（5入裝）', qty: 2, price: 89 }, { productId: 'p2', name: '30天預付SIM卡', qty: 1, price: 300 }], total: 478, status: 'completed', createdAt: '2025-03-20', address: '桃園市中壢區' },
      { id: 'ord2', userId: 'u_user', merchantId: 'u_merchant', items: [{ productId: 'p3', name: '行動電源 10000mAh', qty: 1, price: 499 }], total: 499, status: 'shipped', createdAt: '2025-04-01', address: '桃園市中壢區' },
      { id: 'ord3', userId: 'u_user2', merchantId: 'u_merchant2', items: [{ productId: 'p6', name: '魚露 500ml', qty: 3, price: 120 }, { productId: 'p7', name: '茉莉香米 5kg', qty: 1, price: 250 }], total: 610, status: 'pending', createdAt: '2025-04-03', address: '台北市萬華區' },
      { id: 'ord4', userId: 'u_user2', merchantId: 'u_merchant', items: [{ productId: 'p5', name: '純棉T恤（M號）', qty: 2, price: 199 }], total: 398, status: 'processing', createdAt: '2025-04-04', address: '台北市萬華區' },
      { id: 'ord5', userId: 'u_user', merchantId: 'u_merchant2', items: [{ productId: 'p8', name: '洗髮精 400ml', qty: 1, price: 149 }, { productId: 'p10', name: '洗衣精 1L', qty: 2, price: 99 }], total: 347, status: 'completed', createdAt: '2025-03-25', address: '桃園市中壢區' },
    ];

    // --- Cart (user) ---
    const carts = {
      u_user: [
        { productId: 'p4', qty: 1 },
        { productId: 'p9', qty: 2 },
      ],
      u_user2: [],
    };

    // --- Restaurants ---
    const restaurants = [
      { id: 'r1', name: 'Pho Saigon', cuisine: '越南料理', rating: 4.5, discount: '移工專屬8折優惠', address: '中壢區中山路12號', phone: '03-422-1234', hours: '10:00-22:00', description: '正宗越南河粉與越式法國麵包，每日提供移工專屬折扣！', image: '' },
      { id: 'r2', name: 'Manila Kitchen', cuisine: '菲律賓料理', rating: 4.3, discount: '週日買一送一', address: '中壢區中正路88號', phone: '03-425-5678', hours: '11:00-21:00', description: '道地菲律賓家常菜，Adobo、Sinigang 等經典美食！', image: '' },
      { id: 'r3', name: 'Thai Smile', cuisine: '泰國料理', rating: 4.7, discount: '套餐只要 NT$99', address: '中壢區新明路55號', phone: '03-426-9012', hours: '10:30-22:30', description: '最道地的泰式料理，綠咖哩、泰式炒河粉、芒果糯米飯。', image: '' },
      { id: 'r4', name: 'Indo Rasa', cuisine: '印尼料理', rating: 4.2, discount: '平日午餐85折', address: '中壢區元化路33號', phone: '03-427-3456', hours: '09:00-21:00', description: '印尼炒飯、沙嗲、仁當牛肉等印尼經典美食。', image: '' },
      { id: 'r5', name: '台北便當', cuisine: '台灣料理', rating: 4.0, discount: 'NT$80 超值便當', address: '中壢區中央路100號', phone: '03-428-7890', hours: '06:00-20:00', description: '平價台式便當，滷肉飯、雞腿飯應有盡有。', image: '' },
      { id: 'r6', name: 'Curry House', cuisine: '印度料理', rating: 4.6, discount: '點咖哩送烤餅', address: '中壢區復興路15號', phone: '03-429-1111', hours: '11:00-22:00', description: '北印度咖哩、坦都里烤雞、印度香飯，清真認證。', image: '' },
    ];

    // --- KTV ---
    const ktvs = [
      { id: 'k1', name: 'Star KTV', rating: 4.4, address: '中壢區中山路200號', phone: '03-430-1234', hours: '14:00-02:00', rooms: [{ type: '小包廂（2-4人）', price: 250 }, { type: '中包廂（4-8人）', price: 450 }, { type: '大包廂（8-15人）', price: 700 }], features: ['多語歌曲', '免費WiFi', '飲料吧'], description: '頂級KTV，提供越南語、泰語、菲律賓語、印尼語等多國歌曲！', image: '' },
      { id: 'k2', name: 'Happy Voice', rating: 4.1, address: '中壢區環北路66號', phone: '03-431-5678', hours: '12:00-03:00', rooms: [{ type: '小包廂（2-4人）', price: 200 }, { type: '中包廂（4-8人）', price: 380 }, { type: '大包廂（8-15人）', price: 600 }], features: ['歌唱評分', '點心菜單', '生日派對'], description: '平價KTV，音響設備優質。平日移工專屬優惠！', image: '' },
      { id: 'k3', name: 'Golden Mic KTV', rating: 4.6, address: '中壢區延平路150號', phone: '03-432-9012', hours: '13:00-01:00', rooms: [{ type: '小包廂（2-4人）', price: 300 }, { type: '中包廂（4-8人）', price: 500 }, { type: '大包廂（8-15人）', price: 800 }, { type: 'VIP包廂（10-20人）', price: 1200 }], features: ['VIP包廂', '餐飲服務', '派對模式', 'LED燈光'], description: '頂級KTV體驗，VIP包廂適合特殊場合使用。', image: '' },
      { id: 'k4', name: 'Melody Box', rating: 3.9, address: '中壢區中正路80號', phone: '03-433-3456', hours: '15:00-00:00', rooms: [{ type: '迷你包廂（1-2人）', price: 120 }, { type: '小包廂（2-4人）', price: 220 }, { type: '中包廂（4-8人）', price: 400 }], features: ['個人包廂', '錄音功能', '飲料優惠'], description: '平價KTV，適合個人練歌或小型聚會。', image: '' },
    ];

    // --- Laundry machines ---
    const laundryMachines = [
      { id: 'lm1', name: '洗衣機 #1', type: 'washer', status: 'idle', remainingMin: 0, mode: '', price: 0 },
      { id: 'lm2', name: '洗衣機 #2', type: 'washer', status: 'running', remainingMin: 18, mode: '標準', price: 40, startedBy: 'u_user' },
      { id: 'lm3', name: '洗衣機 #3', type: 'washer', status: 'idle', remainingMin: 0, mode: '', price: 0 },
      { id: 'lm4', name: '洗衣機 #4', type: 'washer', status: 'done', remainingMin: 0, mode: '強力', price: 60, startedBy: 'u_user2' },
      { id: 'lm5', name: '烘乾機 #1', type: 'dryer', status: 'idle', remainingMin: 0, mode: '', price: 0 },
      { id: 'lm6', name: '烘乾機 #2', type: 'dryer', status: 'running', remainingMin: 35, mode: '高溫', price: 50, startedBy: 'u_user' },
      { id: 'lm7', name: '烘乾機 #3', type: 'dryer', status: 'idle', remainingMin: 0, mode: '', price: 0 },
      { id: 'lm8', name: '洗衣機 #5', type: 'washer', status: 'idle', remainingMin: 0, mode: '', price: 0 },
    ];

    const laundryModes = {
      washer: [
        { name: '快洗', duration: 15, price: 30 },
        { name: '標準', duration: 35, price: 40 },
        { name: '強力', duration: 50, price: 60 },
        { name: '柔洗', duration: 30, price: 45 },
      ],
      dryer: [
        { name: '低溫', duration: 30, price: 30 },
        { name: '中溫', duration: 40, price: 40 },
        { name: '高溫', duration: 50, price: 50 },
      ],
    };

    // --- Entertainment (Massage & Gym) ---
    const entertainment = [
      { id: 'ent1', name: '泰舒適養生會館', type: '按摩', rating: 4.7, discount: '移工平日7折優惠', address: '中壢區中山路168號2樓', phone: '03-434-1234', hours: '10:00-23:00', description: '正宗泰式按摩、精油SPA、腳底按摩。擁有專業泰籍按摩師，讓您放鬆身心、消除疲勞。', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80', services: ['泰式全身按摩 60min NT$600', '腳底按摩 40min NT$400', '精油SPA 90min NT$900', '肩頸舒壓 30min NT$300'], features: ['專業泰籍按摩師', '獨立包廂', '免費茶飲', '可預約'] },
      { id: 'ent2', name: 'Golden Hands 按摩', type: '按摩', rating: 4.4, discount: '首次消費9折', address: '中壢區環北路120號', phone: '03-435-5678', hours: '11:00-22:00', description: '結合越式與中式推拿手法，針對勞動族群常見的肌肉痠痛提供專業緩解服務。', image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&q=80', services: ['越式全身按摩 60min NT$500', '中式推拿 60min NT$550', '刮痧+拔罐 40min NT$450', '熱石按摩 90min NT$850'], features: ['越南籍按摩師', '針對勞動痠痛', '無需預約', '團體優惠'] },
      { id: 'ent3', name: '悅來養生館', type: '按摩', rating: 4.2, discount: '週末加送15分鐘', address: '中壢區新明路77號', phone: '03-436-9012', hours: '09:00-22:00', description: '平價養生按摩館，提供全身按摩、腳底按摩及刮痧服務。環境乾淨舒適，適合下班後放鬆。', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&q=80', services: ['全身按摩 60min NT$450', '腳底按摩 40min NT$350', '刮痧 30min NT$250', '全套養生 120min NT$800'], features: ['平價實惠', '環境乾淨', '多語服務', '停車方便'] },
      { id: 'ent4', name: 'PowerFit 健身房', type: '健身房', rating: 4.5, discount: '移工月費只要 NT$499', address: '中壢區中正路200號3樓', phone: '03-437-3456', hours: '06:00-23:00', description: '24小時自助健身房，配備齊全的重訓器材、有氧設備及淋浴間。特別推出移工專屬超值月費方案！', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80', services: ['月費方案 NT$499/月', '單次入場 NT$80', '私人教練 NT$600/堂', '團體課程 免費參加'], features: ['24小時營業', '重訓+有氧', '免費淋浴', '置物櫃'] },
      { id: 'ent5', name: 'Muscle Factory', type: '健身房', rating: 4.3, discount: '揪團3人同行每人月費 NT$399', address: '中壢區延平路88號2樓', phone: '03-438-7890', hours: '07:00-22:00', description: '專業健身空間，提供自由重量區、機械式器材、跑步機及飛輪教室。每週有免費團體課程。', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&q=80', services: ['月費方案 NT$450/月', '季費方案 NT$1,200/季', '單次入場 NT$70', '團體飛輪課 免費'], features: ['專業器材', '團體課程', '飛輪教室', '團報優惠'] },
      { id: 'ent6', name: '舒活按摩工坊', type: '按摩', rating: 4.6, discount: '消費滿NT$500送足浴', address: '中壢區復興路50號', phone: '03-439-1111', hours: '10:00-22:00', description: '溫馨的按摩工坊，主打印尼傳統按摩手法。舒適的環境搭配輕音樂，讓您徹底放鬆。', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&q=80', services: ['印尼傳統按摩 60min NT$550', '香氛精油按摩 90min NT$800', '足浴+腳底 50min NT$400', '情侶雙人套餐 120min NT$1,400'], features: ['印尼傳統手法', '香氛精油', '輕音樂放鬆', '情侶包廂'] },
    ];

    // --- Save all ---
    this.set('users', users);
    this.set('categories', categories);
    this.set('products', products);
    this.set('orders', orders);
    this.set('carts', carts);
    this.set('restaurants', restaurants);
    this.set('ktvs', ktvs);
    this.set('entertainment', entertainment);
    this.set('laundryMachines', laundryMachines);
    this.set('laundryModes', laundryModes);
    this.set('__db_version__', currentVersion);
  },

  // ---- CRUD helpers ----
  getAll(key) { return this.get(key) || []; },

  findById(key, id) {
    return this.getAll(key).find(item => item.id === id);
  },

  add(key, item) {
    const arr = this.getAll(key);
    if (!item.id) item.id = this.genId();
    arr.push(item);
    this.set(key, arr);
    return item;
  },

  update(key, id, updates) {
    const arr = this.getAll(key);
    const idx = arr.findIndex(item => item.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates };
    this.set(key, arr);
    return arr[idx];
  },

  remove(key, id) {
    const arr = this.getAll(key).filter(item => item.id !== id);
    this.set(key, arr);
  },

  // cart helpers
  getCart(userId) {
    const carts = this.get('carts') || {};
    return carts[userId] || [];
  },
  setCart(userId, cart) {
    const carts = this.get('carts') || {};
    carts[userId] = cart;
    this.set('carts', carts);
  },
};

DB.init();
