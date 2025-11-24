const db = require('./database');

// Create tables
const createTables = () => {
  // Subcategories table - stores subcategories for KOT and BOT
  db.exec(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mainCategory TEXT NOT NULL CHECK(mainCategory IN ('BOT', 'KOT')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, mainCategory)
    )
  `);

  // Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('BOT', 'KOT')),
      subcategoryId INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subcategoryId) REFERENCES subcategories(id) ON DELETE RESTRICT
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableNumber INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open', 'closed')) DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    )
  `);

  // Order items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE
    )
  `);

  // Orders history table - stores completed bills
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER NOT NULL,
      tableNumber INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      serviceCharge BOOLEAN DEFAULT 0,
      serviceChargeAmount REAL DEFAULT 0,
      finalAmount REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME NOT NULL
    )
  `);

  // Orders history items table - stores items in completed bills
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders_history_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      historyId INTEGER NOT NULL,
      itemName TEXT NOT NULL,
      itemPrice REAL NOT NULL,
      itemCategory TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (historyId) REFERENCES orders_history(id) ON DELETE CASCADE
    )
  `);

  // Printers table - stores registered printers
  db.exec(`
    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ip TEXT NOT NULL,
      port INTEGER NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // console.log('✅ Database tables created successfully');
};

// Insert sample data
const insertSampleData = () => {
  // First, create sample subcategories
  const subcategoryStmt = db.prepare(`
    INSERT INTO subcategories (name, mainCategory) VALUES (?, ?)
  `);

  const sampleSubcategories = [
    ['Starters', 'KOT'],
    ['Mains', 'KOT'],
    ['Desserts', 'KOT'],
    ['Drinks', 'KOT'],
    ['Shots', 'BOT'],
    ['Wine', 'BOT'],
    ['Soft Drink', 'BOT'],
    ['Cocktails', 'BOT'],
    ['Beers', 'BOT'],
  ];

  const insertSubcategories = db.transaction((subcats) => {
    for (const subcat of subcats) {
      subcategoryStmt.run(subcat);
    }
  });

  insertSubcategories(sampleSubcategories);

  // Get subcategory IDs
  const getSubcatId = (name) => {
    return db.prepare('SELECT id FROM subcategories WHERE name = ?').get(name).id;
  };

  const startersId = getSubcatId('Starters');
  const mainsId = getSubcatId('Mains');
  const dessertsId = getSubcatId('Desserts');
  const drinksId = getSubcatId('Drinks');
  const shortsId = getSubcatId('Shots');
  const wineId = getSubcatId('Wine');
  const softDrinksId = getSubcatId('Soft Drink');
  const cocktailsId = getSubcatId('Cocktails');
  const beersId = getSubcatId('Beers');

  // Now insert items with subcategories
  const itemsStmt = db.prepare(`
    INSERT INTO items (name, price, category, subcategoryId) VALUES (?, ?, ?, ?)
  `);

  const sampleItems = [
    // 🔥 SHOTS (BOT)
    ['Arrack', 1500, 'BOT', shortsId],
    ['Red Rum', 1800, 'BOT', shortsId],
    ['White Rum', 1800, 'BOT', shortsId],
    ['Vodka', 2000, 'BOT', shortsId],
    ['Gin', 2000, 'BOT', shortsId],
    ['VAT 69', 2800, 'BOT', shortsId],
    ['Tequila', 3000, 'BOT', shortsId],

    // 🍷 WINE (BOT)
    ['Red Wine Glass', 3000, 'BOT', wineId],
    ['White Wine Glass', 3000, 'BOT', wineId],

    // 🥤 SOFT DRINKS (BOT)
    ['Coca Cola', 500, 'BOT', softDrinksId],
    ['Coca Cola Zero', 600, 'BOT', softDrinksId],
    ['Sprite', 500, 'BOT', softDrinksId],
    ['Ginger Beer', 500, 'BOT', softDrinksId],
    ['Soda', 500, 'BOT', softDrinksId],
    ['Redbull', 2000, 'BOT', softDrinksId],
    ['Water Bottle', 300, 'BOT', softDrinksId],
    ['Water Bottle Large', 500, 'BOT', softDrinksId],

    // 🍹 COCKTAILS (BOT)
    ['Jungle Kasiya', 3800, 'BOT', cocktailsId],
    ['Coconut Kurumbatti', 3200, 'BOT', cocktailsId],
    ['Green Robana', 2400, 'BOT', cocktailsId],
    ['Tropical Nirvana', 2500, 'BOT', cocktailsId],
    ['Honey Heaven', 3000, 'BOT', cocktailsId],
    ['Karapincha', 2500, 'BOT', cocktailsId],

    // 🍺 BEERS (BOT)
    ['Lion Lager', 800, 'BOT', beersId],
    ['Lion Ice', 1000, 'BOT', beersId],
    ['Somersby Apple', 1100, 'BOT', beersId],
    ['Somersby Blackberry', 1100, 'BOT', beersId],
    ['Somersby Mango', 1100, 'BOT', beersId],

    // ⭐ STARTERS (KOT)
    ['French Fries', 1000, 'KOT', startersId],
    ['Garlic Bread', 1000, 'KOT', startersId],
    ['Bruschetta', 1000, 'KOT', startersId],

    // 🍛 MAINS (KOT)
    ['Jackfruit Burger', 1600, 'KOT', mainsId],
    ['Eggplant Taco', 2000, 'KOT', mainsId],
    ['Chicken Taco', 2000, 'KOT', mainsId],
    ['Beef Taco / Burger', 2500, 'KOT', mainsId],
    ['Seafood Spaghetti', 2000, 'KOT', mainsId],
    ['Robana Kiri Malu Curry', 1800, 'KOT', mainsId],
    ['Roti Kottu', 2000, 'KOT', mainsId],

    // 🍰 DESSERTS (KOT)
    ['Chocolate Pancake', 1000, 'KOT', dessertsId],
    ['Chocolate Banana Pancake', 1000, 'KOT', dessertsId],
    ['Fried Banana', 1000, 'KOT', dessertsId],

    // 🥤 DRINKS (KOT)
    ['Watermelon Juice', 800, 'KOT', drinksId],
    ['Papaya Juice', 800, 'KOT', drinksId],
    ['Lemon Tea', 1000, 'KOT', drinksId],
    ['Ginger Tea', 1000, 'KOT', drinksId],
    ['Virgin Mojito', 1000, 'KOT', drinksId],
    ['Virgin Passion Mojito', 1200, 'KOT', drinksId],
    ['Pineapple Juice', 1500, 'KOT', drinksId],
    ['Ginger Juice', 1500, 'KOT', drinksId],
    ['Papaya Lassi', 1000, 'KOT', drinksId],
    ['Banana Lassi', 1000, 'KOT', drinksId],
    ['Chocolate Milkshake', 1200, 'KOT', drinksId],
    ['Vanilla Milkshake', 1200, 'KOT', drinksId],
    ['Strawberry Milkshake', 1200, 'KOT', drinksId],
    ['Iced Robana', 1000, 'KOT', drinksId],
  ];


  const insertMany = db.transaction((items) => {
    for (const item of items) {
      itemsStmt.run(item);
    }
  });

  insertMany(sampleItems);
};

// Initialize database
try {
  createTables();

  // Run migrations
  const { migrateSubcategories, migratePaymentFields } = require('./migrations');
  migrateSubcategories();
  migratePaymentFields();

  // Check if items already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (count.count === 0) {
    insertSampleData();
  } else {
  }

} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
