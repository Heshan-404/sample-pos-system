const db = require('./database');

// Create tables
const createTables = () => {
  // Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('BOT', 'KOT')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  console.log('✅ Database tables created successfully');
};

// Insert sample data
const insertSampleData = () => {
  const itemsStmt = db.prepare(`
    INSERT INTO items (name, price, category) VALUES (?, ?, ?)
  `);

  const sampleItems = [
    // BOT Items (Beverages)
    ['Coca Cola', 2.50, 'BOT'],
    ['Pepsi', 2.50, 'BOT'],
    ['Sprite', 2.50, 'BOT'],
    ['Water Bottle', 1.00, 'BOT'],
    ['Orange Juice', 3.50, 'BOT'],
    ['Lemonade', 3.00, 'BOT'],

    // KOT Items (Kitchen Orders)
    ['Chicken Burger', 8.99, 'KOT'],
    ['Beef Burger', 9.99, 'KOT'],
    ['Veggie Burger', 7.99, 'KOT'],
    ['French Fries', 3.99, 'KOT'],
    ['Onion Rings', 4.99, 'KOT'],
    ['Caesar Salad', 6.99, 'KOT'],
    ['Margherita Pizza', 12.99, 'KOT'],
    ['Pepperoni Pizza', 14.99, 'KOT'],
    ['Grilled Chicken', 11.99, 'KOT'],
    ['Fish and Chips', 13.99, 'KOT'],
    ['Spaghetti Carbonara', 10.99, 'KOT'],
    ['Chicken Wings', 8.99, 'KOT'],
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      itemsStmt.run(item);
    }
  });

  insertMany(sampleItems);
  console.log('✅ Sample data inserted successfully');
};

// Initialize database
try {
  createTables();

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
