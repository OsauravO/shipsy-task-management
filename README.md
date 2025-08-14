# 🚀 AI Campus Assignment - Task Management System

## 📋 Project Overview
A full-stack task management application built with modern technologies, demonstrating AI-powered development practices and industry-standard coding principles.

## 🎯 Features Implemented
- ✅ **Authentication System**: Username/password login with JWT
- ✅ **CRUD Operations**: Complete task management (Create, Read, Update, Delete)
- ✅ **Advanced Features**: Pagination, filtering, sorting, search
- ✅ **Calculated Fields**: Task completion percentage and priority score
- ✅ **Modern UI**: React frontend with responsive design
- ✅ **API Documentation**: Swagger/OpenAPI specification
- ✅ **AI Integration**: Gemini CLI usage documented throughout development

## 🛠️ Tech Stack
- **Backend**: Node.js + Express.js
- **Frontend**: React.js + Vite
- **Database**: SQLite (for simplicity, easily upgradable to PostgreSQL)
- **Authentication**: JWT tokens
- **API Documentation**: Swagger/OpenAPI
- **Styling**: Tailwind CSS
- **Testing**: Jest + Supertest

## 🏗️ Architecture
```
shipsy/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth & validation
│   │   ├── routes/         # API routes
│   │   └── utils/          # Helper functions
│   ├── tests/              # API tests
│   └── docs/               # API documentation
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service layer
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
├── docs/                   # Project documentation
│   ├── commits.md          # Development history
│   ├── video.md            # Demo video link
│   ├── ai-usage.md         # AI prompts and methodology
│   └── architecture.md     # Technical architecture
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Git

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
The SQLite database will be automatically created on first run.

## 📊 Task Model Schema
```javascript
{
  id: UUID,
  title: String (required),
  description: String,
  status: Enum ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  priority: Enum ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  isUrgent: Boolean,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date,
  userId: UUID (foreign key),
  
  // Calculated Fields
  completionPercentage: Number (derived from status),
  priorityScore: Number (derived from priority + isUrgent + dueDate)
}
```

## 🔐 Authentication Flow
1. User registers/logs in with username/password
2. Server validates credentials and returns JWT token
3. Frontend stores token in localStorage
4. All API requests include Authorization header
5. Server validates token on protected routes

## 📈 Development Timeline (24 Hours)
- **Hours 1-2**: Project setup and basic structure
- **Hours 3-4**: Backend API foundation
- **Hours 5-6**: Authentication system
- **Hours 7-8**: CRUD operations
- **Hours 9-10**: Frontend setup and basic UI
- **Hours 11-12**: Task management interface
- **Hours 13-14**: Pagination and filtering
- **Hours 15-16**: Sorting and search
- **Hours 17-18**: Calculated fields and advanced features
- **Hours 19-20**: Testing and bug fixes
- **Hours 21-22**: API documentation
- **Hours 23-24**: Deployment and final touches

## 🧪 Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete user workflows
- **Validation Tests**: Input validation and error handling

## 📚 API Documentation
- Swagger/OpenAPI specification
- Interactive API explorer
- Request/response examples
- Authentication documentation

## 🌐 Deployment
- **Backend**: Render 
- **Frontend**: Vercel 
- **Database**: SQLite (embedded) 

## 📝 AI Integration Documentation
All AI usage with Gemini CLI is documented in `/docs/ai-usage.md` including:
- Prompts used for code generation
- Architecture decisions
- Problem-solving approaches
- Code review and optimization

## 🎥 Demo Video
A 3-5 minute walkthrough demonstrating:
- User registration and login
- Task creation and management
- Advanced features (filtering, sorting, search)
- API documentation
- Code structure and architecture

## 🔍 Evaluation Criteria Alignment
- ✅ **AI Integration**: Extensive Gemini CLI usage documented
- ✅ **Code Quality**: OOP principles, clean architecture, modularity
- ✅ **Documentation**: Comprehensive API docs with Swagger
- ✅ **Authentication**: Complete login system
- ✅ **CRUD Operations**: Full task management
- ✅ **Advanced Features**: Pagination, filtering, sorting, search
- ✅ **Calculated Fields**: Completion percentage and priority scoring

