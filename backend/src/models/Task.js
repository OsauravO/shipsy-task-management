const { database } = require('../utils/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - user_id
 *       properties:
 *         id:
 *           type: string
 *           description: Unique task identifier
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         status:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *           default: TODO
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *           default: MEDIUM
 *         is_urgent:
 *           type: boolean
 *           default: false
 *         due_date:
 *           type: string
 *           format: date-time
 *         completion_percentage:
 *           type: number
 *           description: Calculated field based on status
 *         priority_score:
 *           type: number
 *           description: Calculated field based on priority, urgency, and due date
 *         user_id:
 *           type: string
 *           description: User who owns the task
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

class Task {
  constructor(data = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title;
    this.description = data.description;
    this.status = data.status || 'TODO';
    this.priority = data.priority || 'MEDIUM';
    this.is_urgent = data.is_urgent || false;
    this.due_date = data.due_date;
    this.completion_percentage = data.completion_percentage || 0;
    this.priority_score = data.priority_score || 0;
    this.user_id = data.user_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Calculate completion percentage based on status
   * @returns {number} Completion percentage (0-100)
   */
  calculateCompletionPercentage() {
    const statusPercentages = {
      'TODO': 0,
      'IN_PROGRESS': 50,
      'COMPLETED': 100,
      'CANCELLED': 0
    };
    return statusPercentages[this.status] || 0;
  }

  /**
   * Calculate priority score based on priority, urgency, and due date
   * @returns {number} Priority score (0-100)
   */
  calculatePriorityScore() {
    let score = 0;

    // Priority weight (40%)
    const priorityWeights = {
      'LOW': 10,
      'MEDIUM': 25,
      'HIGH': 40,
      'URGENT': 60
    };
    score += priorityWeights[this.priority] || 25;

    // Urgency bonus (20%)
    if (this.is_urgent) {
      score += 20;
    }

    // Due date urgency (40%)
    if (this.due_date) {
      const now = moment();
      const dueDate = moment(this.due_date);
      const daysUntilDue = dueDate.diff(now, 'days');

      if (daysUntilDue < 0) {
        // Overdue
        score += 40;
      } else if (daysUntilDue <= 1) {
        // Due today or tomorrow
        score += 35;
      } else if (daysUntilDue <= 3) {
        // Due within 3 days
        score += 25;
      } else if (daysUntilDue <= 7) {
        // Due within a week
        score += 15;
      } else {
        // Due later
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Task>} Created task instance
   */
  static async create(taskData) {
    try {
      // Validate required fields
      if (!taskData.title || !taskData.user_id) {
        throw new Error('Title and user_id are required');
      }

      // Create task instance
      const task = new Task(taskData);
      
      // Calculate derived fields
      task.completion_percentage = task.calculateCompletionPercentage();
      task.priority_score = task.calculatePriorityScore();

      await database.run(`
        INSERT INTO tasks (
          id, title, description, status, priority, is_urgent, 
          due_date, completion_percentage, priority_score, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id, task.title, task.description, task.status, task.priority,
        task.is_urgent ? 1 : 0, task.due_date, task.completion_percentage,
        task.priority_score, task.user_id
      ]);

      return task;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find task by ID
   * @param {string} id - Task ID
   * @returns {Promise<Task|null>} Task instance or null
   */
  static async findById(id) {
    try {
      const taskData = await database.get(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      );
      return taskData ? new Task(taskData) : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get tasks with filtering, sorting, and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Object with tasks and pagination info
   */
  static async findAll(options = {}) {
    try {
      const {
        user_id,
        page = 1,
        limit = 10,
        status,
        priority,
        is_urgent,
        search,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = options;

      // Build WHERE clause
      const whereConditions = [];
      const params = [];

      if (user_id) {
        whereConditions.push('user_id = ?');
        params.push(user_id);
      }

      if (status) {
        whereConditions.push('status = ?');
        params.push(status);
      }

      if (priority) {
        whereConditions.push('priority = ?');
        params.push(priority);
      }

      if (is_urgent !== undefined) {
        whereConditions.push('is_urgent = ?');
        params.push(is_urgent ? 1 : 0);
      }

      if (search) {
        whereConditions.push('(title LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Validate sort parameters
      const allowedSortFields = ['title', 'status', 'priority', 'due_date', 'created_at', 'updated_at', 'completion_percentage', 'priority_score'];
      const allowedSortOrders = ['ASC', 'DESC'];
      
      const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
      const validSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

      // Build query
      const offset = (page - 1) * limit;
      const query = `
        SELECT * FROM tasks 
        ${whereClause}
        ORDER BY ${validSortBy} ${validSortOrder}
        LIMIT ? OFFSET ?
      `;

      const tasks = await database.all(query, [...params, limit, offset]);
      const totalCount = await database.get(
        `SELECT COUNT(*) as count FROM tasks ${whereClause}`,
        params
      );

      return {
        tasks: tasks.map(task => new Task(task)),
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit)
        },
        filters: {
          status,
          priority,
          is_urgent,
          search
        },
        sorting: {
          sort_by: validSortBy,
          sort_order: validSortOrder
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update task
   * @param {string} id - Task ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Task>} Updated task instance
   */
  static async update(id, updateData) {
    try {
      const task = await Task.findById(id);
      if (!task) {
        throw new Error('Task not found');
      }

      // Update task properties
      Object.assign(task, updateData);

      // Recalculate derived fields
      task.completion_percentage = task.calculateCompletionPercentage();
      task.priority_score = task.calculatePriorityScore();

      await database.run(`
        UPDATE tasks SET 
          title = ?, description = ?, status = ?, priority = ?, 
          is_urgent = ?, due_date = ?, completion_percentage = ?, 
          priority_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        task.title, task.description, task.status, task.priority,
        task.is_urgent ? 1 : 0, task.due_date, task.completion_percentage,
        task.priority_score, id
      ]);

      return await Task.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete task
   * @param {string} id - Task ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      const result = await database.run(
        'DELETE FROM tasks WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get task statistics for a user
   * @param {string} user_id - User ID
   * @returns {Promise<Object>} Task statistics
   */
  static async getStatistics(user_id) {
    try {
      const stats = await database.get(`
        SELECT 
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_tasks,
          SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_tasks,
          SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as pending_tasks,
          SUM(CASE WHEN is_urgent = 1 THEN 1 ELSE 0 END) as urgent_tasks,
          AVG(completion_percentage) as avg_completion,
          AVG(priority_score) as avg_priority_score
        FROM tasks 
        WHERE user_id = ?
      `, [user_id]);

      return {
        total_tasks: stats.total_tasks || 0,
        completed_tasks: stats.completed_tasks || 0,
        in_progress_tasks: stats.in_progress_tasks || 0,
        pending_tasks: stats.pending_tasks || 0,
        urgent_tasks: stats.urgent_tasks || 0,
        avg_completion: Math.round(stats.avg_completion || 0),
        avg_priority_score: Math.round(stats.avg_priority_score || 0),
        completion_rate: stats.total_tasks > 0 
          ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
          : 0
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get task data for API response
   * @returns {Object} Formatted task data
   */
  toResponse() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      is_urgent: Boolean(this.is_urgent),
      due_date: this.due_date,
      completion_percentage: this.completion_percentage,
      priority_score: this.priority_score,
      user_id: this.user_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Task;
