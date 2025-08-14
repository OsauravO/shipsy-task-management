const { database } = require('../utils/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Unique user identifier
 *         username:
 *           type: string
 *           description: Unique username
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

class User {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user instance
   */
  static async create(userData) {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('Username, email, and password are required');
      }

      // Check if user already exists
      const existingUser = await User.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const existingEmail = await User.findByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await database.run(
        'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)',
        [user.id, user.username, user.email, user.password]
      );

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by username
   * @param {string} username - Username to search for
   * @returns {Promise<User|null>} User instance or null
   */
  static async findByUsername(username) {
    try {
      const userData = await database.get(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return userData ? new User(userData) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email to search for
   * @returns {Promise<User|null>} User instance or null
   */
  static async findByEmail(email) {
    try {
      const userData = await database.get(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return userData ? new User(userData) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User instance or null
   */
  static async findById(id) {
    try {
      const userData = await database.get(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return userData ? new User(userData) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users (with pagination)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Object with users and pagination info
   */
  static async findAll(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const users = await database.all(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );

      const totalCount = await database.get('SELECT COUNT(*) as count FROM users');

      return {
        users: users.map(user => new User(user)),
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user information
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User>} Updated user instance
   */
  static async update(id, updateData) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // Build update query
      const fields = Object.keys(updateData).filter(key => key !== 'id');
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = fields.map(field => updateData[field]);

      await database.run(
        `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );

      return await User.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const result = await database.run(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify password
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>} Password match status
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  /**
   * Get user data without sensitive information
   * @returns {Object} User data without password
   */
  toJSON() {
    const { password, ...userData } = this;
    return userData;
  }

  /**
   * Get user data for API response
   * @returns {Object} Formatted user data
   */
  toResponse() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = User;
