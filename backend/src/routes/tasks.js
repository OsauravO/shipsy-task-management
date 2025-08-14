const express = require('express');
const Task = require('../models/Task');
const { authenticateToken, requireOwnership } = require('../middleware/auth');
const { 
  validateTaskCreation, 
  validateTaskUpdate, 
  validateTaskId, 
  validatePagination, 
  validateTaskFilters 
} = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all task routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: "Complete project documentation"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Write comprehensive documentation for the API"
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 default: TODO
 *                 example: "TODO"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 default: MEDIUM
 *                 example: "HIGH"
 *               is_urgent:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-15T10:00:00Z"
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validateTaskCreation, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user_id: req.user.id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task.toResponse()
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({
      error: 'Task creation failed',
      message: 'An error occurred while creating the task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/statistics:
 *   get:
 *     summary: Get task statistics for the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_tasks:
 *                       type: integer
 *                       example: 25
 *                     completed_tasks:
 *                       type: integer
 *                       example: 15
 *                     in_progress_tasks:
 *                       type: integer
 *                       example: 5
 *                     pending_tasks:
 *                       type: integer
 *                       example: 5
 *                     urgent_tasks:
 *                       type: integer
 *                       example: 3
 *                     avg_completion:
 *                       type: number
 *                       example: 60
 *                     avg_priority_score:
 *                       type: number
 *                       example: 45
 *                     completion_rate:
 *                       type: number
 *                       example: 60
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await Task.getStatistics(req.user.id);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      error: 'Statistics retrieval failed',
      message: 'An error occurred while retrieving statistics'
    });
  }
});

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with filtering, sorting, and pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *         description: Filter by priority
 *       - in: query
 *         name: is_urgent
 *         schema:
 *           type: boolean
 *         description: Filter by urgency
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search in title and description
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [title, status, priority, due_date, created_at, updated_at, completion_percentage, priority_score]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     is_urgent:
 *                       type: boolean
 *                     search:
 *                       type: string
 *                 sorting:
 *                   type: object
 *                   properties:
 *                     sort_by:
 *                       type: string
 *                     sort_order:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get('/', validatePagination, validateTaskFilters, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      is_urgent,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const options = {
      user_id: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      priority,
      is_urgent: is_urgent !== undefined ? is_urgent === 'true' : undefined,
      search,
      sort_by,
      sort_order
    };

    const result = await Task.findAll(options);

    res.json({
      success: true,
      data: result.tasks.map(task => task.toResponse()),
      pagination: result.pagination,
      filters: result.filters,
      sorting: result.sorting
    });
  } catch (error) {
    console.error('Task retrieval error:', error);
    res.status(500).json({
      error: 'Task retrieval failed',
      message: 'An error occurred while retrieving tasks'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a specific task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.get('/:id', validateTaskId, requireOwnership('task'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.resource.toResponse()
    });
  } catch (error) {
    console.error('Task retrieval error:', error);
    res.status(500).json({
      error: 'Task retrieval failed',
      message: 'An error occurred while retrieving the task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a specific task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 example: "Updated task title"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Updated task description"
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 example: "IN_PROGRESS"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *                 example: "HIGH"
 *               is_urgent:
 *                 type: boolean
 *                 example: true
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-20T10:00:00Z"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.put('/:id', validateTaskId, validateTaskUpdate, requireOwnership('task'), async (req, res) => {
  try {
    const updatedTask = await Task.update(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask.toResponse()
    });
  } catch (error) {
    console.error('Task update error:', error);
    res.status(500).json({
      error: 'Task update failed',
      message: 'An error occurred while updating the task'
    });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a specific task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.delete('/:id', validateTaskId, requireOwnership('task'), async (req, res) => {
  try {
    const deleted = await Task.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Task not found',
        message: 'The specified task does not exist'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Task deletion error:', error);
    res.status(500).json({
      error: 'Task deletion failed',
      message: 'An error occurred while deleting the task'
    });
  }
});



module.exports = router;
