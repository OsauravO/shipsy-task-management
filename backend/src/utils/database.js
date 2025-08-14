const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/tasks.db');
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error running sql:', sql);
          console.error(err);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          console.error('Error running sql:', sql);
          console.error(err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error running sql:', sql);
          console.error(err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
        } else {
          console.log('Database connection closed');
          resolve();
        }
      });
    });
  }
}

const database = new Database();

async function initializeDatabase() {
  try {
    await database.connect();

    // Create users table
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await database.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'TODO',
        priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
        is_urgent BOOLEAN DEFAULT 0,
        due_date DATETIME,
        completion_percentage REAL DEFAULT 0,
        priority_score REAL DEFAULT 0,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await database.run('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

    // Insert default admin user if not exists
    const adminExists = await database.get('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await database.run(
        'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
        ['admin-001', 'admin', 'admin@example.com', hashedPassword]
      );
      console.log('Default admin user created');
    }

    // Insert sample tasks if none exist
    const taskCount = await database.get('SELECT COUNT(*) as count FROM tasks');
    if (taskCount.count === 0) {
      const sampleTasks = [
        {
          id: 'task-001',
          title: 'Complete Project Setup',
          description: 'Set up the development environment and install dependencies',
          status: 'COMPLETED',
          priority: 'HIGH',
          is_urgent: 1,
          due_date: new Date(Date.now() + 86400000).toISOString(),
          user_id: 'admin-001'
        },
        {
          id: 'task-002',
          title: 'Design Database Schema',
          description: 'Create the database structure for the task management system',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          is_urgent: 0,
          due_date: new Date(Date.now() + 172800000).toISOString(),
          user_id: 'admin-001'
        },
        {
          id: 'task-003',
          title: 'Implement Authentication',
          description: 'Build user registration and login functionality',
          status: 'TODO',
          priority: 'URGENT',
          is_urgent: 1,
          due_date: new Date(Date.now() + 43200000).toISOString(),
          user_id: 'admin-001'
        }
      ];

      for (const task of sampleTasks) {
        // Calculate derived fields
        const statusPercentages = {
          'TODO': 0,
          'IN_PROGRESS': 50,
          'COMPLETED': 100,
          'CANCELLED': 0
        };
        const completion_percentage = statusPercentages[task.status] || 0;
        
        let priority_score = 0;
        const priorityWeights = { 'LOW': 10, 'MEDIUM': 25, 'HIGH': 40, 'URGENT': 60 };
        priority_score += priorityWeights[task.priority] || 25;
        if (task.is_urgent) { priority_score += 20; }
        if (task.due_date) {
          const now = new Date();
          const dueDate = new Date(task.due_date);
          const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          if (daysUntilDue < 0) { priority_score += 40; }
          else if (daysUntilDue <= 1) { priority_score += 35; }
          else if (daysUntilDue <= 3) { priority_score += 25; }
          else if (daysUntilDue <= 7) { priority_score += 15; }
          else { priority_score += 5; }
        }
        priority_score = Math.min(priority_score, 100);

        await database.run(`
          INSERT INTO tasks (id, title, description, status, priority, is_urgent, due_date, completion_percentage, priority_score, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [task.id, task.title, task.description, task.status, task.priority, task.is_urgent, task.due_date, completion_percentage, priority_score, task.user_id]);
      }
      console.log('Sample tasks created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  database,
  initializeDatabase
};
