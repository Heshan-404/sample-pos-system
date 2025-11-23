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

  console.log('✅ Database tables created successfully');
};

// Insert sample data
const insertSampleData = () => {
  // First, create sample subcategories
  const subcategoryStmt = db.prepare(`
    INSERT INTO subcategories (name, mainCategory) VALUES (?, ?)
  `);

  const sampleSubcategories = [
    ['Soft Drinks', 'BOT'],
    ['Juices', 'BOT'],
    ['Burgers', 'KOT'],
    ['Sides', 'KOT'],
    ['Pizzas', 'KOT'],
    ['Main Course', 'KOT'],
  ];

  const insertSubcategories = db.transaction((subcats) => {
    for (const subcat of subcats) {
      subcategoryStmt.run(subcat);
    }
  });

  insertSubcategories(sampleSubcategories);
  console.log('✅ Sample subcategories inserted');

  // Get subcategory IDs
  const getSubcatId = (name) => {
    return db.prepare('SELECT id FROM subcategories WHERE name = ?').get(name).id;
  };

  const softDrinksId = getSubcatId('Soft Drinks');
  const juicesId = getSubcatId('Juices');
  const burgersId = getSubcatId('Burgers');
  const sidesId = getSubcatId('Sides');
  const pizzasId = getSubcatId('Pizzas');
  const mainCourseId = getSubcatId('Main Course');

  // Now insert items with subcategories
  const itemsStmt = db.prepare(`
    INSERT INTO items (name, price, category, subcategoryId) VALUES (?, ?, ?, ?)
  `);

  const sampleItems = [
    // BOT Items (Beverages)
    ['Coca Cola', 2.50, 'BOT', softDrinksId],
    ['Pepsi', 2.50, 'BOT', softDrinksId],
    ['Sprite', 2.50, 'BOT', softDrinksId],
    ['Water Bottle', 1.00, 'BOT', softDrinksId],
    ['Orange Juice', 3.50, 'BOT', juicesId],
    ['Lemonade', 3.00, 'BOT', juicesId],

    // KOT Items (Kitchen Orders)
    ['Chicken Burger', 8.99, 'KOT', burgersId],
    ['Beef Burger', 9.99, 'KOT', burgersId],
    ['Veggie Burger', 7.99, 'KOT', burgersId],
    ['French Fries', 3.99, 'KOT', sidesId],
    ['Onion Rings', 4.99, 'KOT', sidesId],
    ['Caesar Salad', 6.99, 'KOT', sidesId],
    ['Margherita Pizza', 12.99, 'KOT', pizzasId],
    ['Pepperoni Pizza', 14.99, 'KOT', pizzasId],
    ['Grilled Chicken', 11.99, 'KOT', mainCourseId],
    ['Fish and Chips', 13.99, 'KOT', mainCourseId],
    ['Spaghetti Carbonara', 10.99, 'KOT', mainCourseId],
    ['Chicken Wings', 8.99, 'KOT', mainCourseId],
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      itemsStmt.run(item);
    }
  });

  insertMany(sampleItems);
  console.log('✅ Sample items inserted successfully');
};

// Initialize database
try {
  createTables();

  // Run migrations
  const { migrateSubcategories } = require('./migrations');
  migrateSubcategories();

  // Check if items already exist
  const count = db.prepare('SELECT COUNT(*) as count FROM items').get();
  if (count.count === 0) {
    insertSampleData();
  } else {
    console.log('ℹ️  Database already contains data, skipping sample data insertion');
  }

  console.log('🎉 Database initialization complete!');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}
