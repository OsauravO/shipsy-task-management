const request = require('supertest');
const app = require('../src/server');
const { database } = require('../src/utils/database');

describe('Authentication Endpoints', () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Clean up test data
    await database.run('DELETE FROM tasks WHERE user_id LIKE ?', ['test-%']);
    await database.run('DELETE FROM users WHERE username LIKE ?', ['test_%']);
  });

  afterAll(async () => {
    // Clean up test data
    await database.run('DELETE FROM tasks WHERE user_id LIKE ?', ['test-%']);
    await database.run('DELETE FROM users WHERE username LIKE ?', ['test_%']);
    await database.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'test_user',
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.username).toBe(userData.username);
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.password).toBeUndefined();

      testUserId = response.body.data.id;
      authToken = response.body.token;
    });

    it('should return 409 for duplicate username', async () => {
      const userData = {
        username: 'test_user',
        email: 'test2@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        username: 'test_user2',
        email: 'test@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });

    it('should return 400 for invalid username', async () => {
      const userData = {
        username: 'ab', // Too short
        email: 'test3@example.com',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        username: 'test_user3',
        email: 'invalid-email',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        username: 'test_user4',
        email: 'test4@example.com',
        password: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        username: 'test_user',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.username).toBe(loginData.username);
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for incorrect username', async () => {
      const loginData = {
        username: 'nonexistent_user',
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for incorrect password', async () => {
      const loginData = {
        username: 'test_user',
        password: 'WrongPassword123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for missing username', async () => {
      const loginData = {
        password: 'TestPass123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        username: 'test_user'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('test_user');
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user email successfully', async () => {
      const updateData = {
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.email).toBe(updateData.email);
    });

    it('should update user password successfully', async () => {
      const updateData = {
        password: 'NewPassword123'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
    });

    it('should return 409 for duplicate email', async () => {
      // First, create another user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'test_user_duplicate',
          email: 'duplicate@example.com',
          password: 'TestPass123'
        });

      const updateData = {
        email: 'duplicate@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.error).toBe('Email already exists');
    });

    it('should return 400 for invalid email', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for no updates provided', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('No updates provided');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('should verify valid token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token is valid');
      expect(response.body.data.username).toBe('test_user');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid token');
    });
  });
});
