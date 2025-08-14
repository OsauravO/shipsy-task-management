# 🏗️ Technical Architecture Documentation

## System Overview

The Task Management System is a full-stack web application built with modern technologies, following industry best practices and OOP principles. The system provides comprehensive task management capabilities with authentication, advanced filtering, and real-time updates.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express.js API │    │   SQLite DB     │
│                 │    │                 │    │                 │
│  - Components   │◄──►│  - Routes       │◄──►│  - Users        │
│  - Context      │    │  - Middleware   │    │  - Tasks        │
│  - Services     │    │  - Models       │    │  - Indexes      │
│  - Hooks        │    │  - Validation   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Context API
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_username` on `username`
- `idx_users_email` on `email`

### Tasks Table
```sql
CREATE TABLE tasks (
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
);
```

**Indexes:**
- `idx_tasks_user_id` on `user_id`
- `idx_tasks_status` on `status`
- `idx_tasks_priority` on `priority`
- `idx_tasks_due_date` on `due_date`

## API Design

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (min 6 chars, uppercase + lowercase + number)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "token": "jwt_token"
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  },
  "token": "jwt_token"
}
```

#### GET /auth/profile
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

#### PUT /auth/profile
Update user profile (requires authentication).

**Request Body:**
```json
{
  "email": "string (optional)",
  "password": "string (optional, min 6 chars)"
}
```

### Task Endpoints

#### GET /tasks
Get tasks with filtering, sorting, and pagination.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `status` (enum: TODO, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority` (enum: LOW, MEDIUM, HIGH, URGENT)
- `is_urgent` (boolean)
- `search` (string, searches title and description)
- `sort_by` (string, default: created_at)
- `sort_order` (enum: ASC, DESC, default: DESC)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "status": "enum",
      "priority": "enum",
      "is_urgent": "boolean",
      "due_date": "datetime",
      "completion_percentage": "number",
      "priority_score": "number",
      "user_id": "uuid",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  },
  "filters": {
    "status": "string",
    "priority": "string",
    "is_urgent": "boolean",
    "search": "string"
  },
  "sorting": {
    "sort_by": "string",
    "sort_order": "string"
  }
}
```

#### POST /tasks
Create a new task (requires authentication).

**Request Body:**
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional, max 1000 chars)",
  "status": "enum (optional, default: TODO)",
  "priority": "enum (optional, default: MEDIUM)",
  "is_urgent": "boolean (optional, default: false)",
  "due_date": "datetime (optional, ISO 8601 format)"
}
```

#### GET /tasks/:id
Get a specific task by ID (requires authentication and ownership).

#### PUT /tasks/:id
Update a specific task (requires authentication and ownership).

#### DELETE /tasks/:id
Delete a specific task (requires authentication and ownership).

#### GET /tasks/statistics
Get task statistics for the current user (requires authentication).

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tasks": "number",
    "completed_tasks": "number",
    "in_progress_tasks": "number",
    "pending_tasks": "number",
    "urgent_tasks": "number",
    "avg_completion": "number",
    "avg_priority_score": "number",
    "completion_rate": "number"
  }
}
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── Layout.jsx          # Main layout with sidebar
│   ├── LoadingSpinner.jsx  # Reusable loading component
│   └── ...
├── contexts/
│   └── AuthContext.jsx     # Authentication state management
├── pages/
│   ├── Login.jsx           # Login page
│   ├── Register.jsx        # Registration page
│   ├── Dashboard.jsx       # Dashboard with statistics
│   ├── TaskList.jsx        # Task management page
│   ├── TaskDetail.jsx      # Individual task view
│   └── Profile.jsx         # User profile page
├── services/
│   ├── authService.js      # Authentication API calls
│   └── taskService.js      # Task management API calls
├── hooks/
│   └── useAuth.js          # Custom authentication hook
└── utils/
    └── helpers.js          # Utility functions
```

### State Management
The application uses React Context API for global state management:

#### AuthContext
- User authentication state
- JWT token management
- Login/logout functionality
- Profile management
- Automatic token validation

### Routing
Protected routes ensure authentication:
- `/login` - Public route
- `/register` - Public route
- `/dashboard` - Protected route
- `/tasks` - Protected route
- `/tasks/:id` - Protected route
- `/profile` - Protected route

## Security Implementation

### Authentication
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Password Hashing**: bcrypt with 10 salt rounds
- **Token Storage**: localStorage with automatic cleanup
- **Token Validation**: Automatic verification on app load

### Authorization
- **Route Protection**: Middleware-based route protection
- **Resource Ownership**: Users can only access their own resources
- **Role-based Access**: Extensible role system (currently user/admin)

### Input Validation
- **Server-side**: express-validator with comprehensive rules
- **Client-side**: React Hook Form with real-time validation
- **Sanitization**: Automatic input sanitization and normalization

### Security Headers
- **Helmet.js**: Security headers middleware
- **CORS**: Configured for development and production
- **Rate Limiting**: 100 requests per 15 minutes per IP

## Performance Optimization

### Database
- **Indexing**: Strategic indexes on frequently queried fields
- **Query Optimization**: Efficient SQL queries with proper joins
- **Connection Pooling**: SQLite connection management

### Frontend
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Caching**: JWT token caching
- **Optimized Builds**: Vite for fast development and optimized production builds

### API
- **Pagination**: Efficient data loading with pagination
- **Filtering**: Server-side filtering to reduce data transfer
- **Caching**: Response caching for static data

## Error Handling

### Backend
- **Global Error Handler**: Centralized error handling middleware
- **Validation Errors**: Structured validation error responses
- **Database Errors**: Proper error handling for database operations
- **Authentication Errors**: Clear authentication error messages

### Frontend
- **Error Boundaries**: React error boundaries for component errors
- **Toast Notifications**: User-friendly error messages
- **Loading States**: Proper loading indicators
- **Fallback UI**: Graceful degradation for errors

## Testing Strategy

### Backend Testing
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing
- **Database Tests**: Database operation testing
- **Authentication Tests**: JWT and authentication flow testing

### Frontend Testing
- **Component Tests**: React component testing
- **Hook Tests**: Custom hook testing
- **Integration Tests**: User flow testing
- **E2E Tests**: End-to-end user journey testing

## Deployment

### Development
- **Backend**: `npm run dev` (nodemon for auto-restart)
- **Frontend**: `npm run dev` (Vite dev server)
- **Database**: SQLite file-based database

### Production
- **Backend**: Node.js on Render/Vercel
- **Frontend**: Static build on Vercel/Netlify
- **Database**: PostgreSQL on Render (upgrade from SQLite)

## Monitoring and Logging

### Logging
- **Console Logging**: Development logging
- **Error Logging**: Structured error logging
- **Request Logging**: API request/response logging

### Monitoring
- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Error rate monitoring

## Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration
- **File Attachments**: Task file uploads
- **Team Collaboration**: Multi-user task sharing
- **Advanced Analytics**: Detailed task analytics
- **Mobile App**: React Native mobile application

### Scalability Improvements
- **Database Migration**: PostgreSQL for production
- **Caching Layer**: Redis for session and data caching
- **Load Balancing**: Multiple server instances
- **CDN**: Static asset delivery optimization

---

This architecture provides a solid foundation for a scalable, maintainable, and secure task management system that can grow with user needs and business requirements.
