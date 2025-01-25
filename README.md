# Code Documentation

This document provides a detailed overview of the system architecture, implementation, and code organization. It serves as a reference for developers, maintainers, and other stakeholders to understand the internal workings of the backend (Node.js/Express/PostgreSQL) and frontend (React/TypeScript) components.

---

## Table of Contents

1. [Backend Structure and Database](#backend-structure-and-database)  
   1.1. [Database Structure (PostgreSQL)](#database-structure-postgresql)  
   1.2. [API Routes](#api-routes)  
   1.3. [Technical Implementation Details](#technical-implementation-details)  
   1.4. [Database Query Patterns](#database-query-patterns)

2. [Frontend Structure and Implementation](#frontend-structure-and-implementation)  
   2.1. [Application Architecture](#application-architecture)  
   2.2. [Role-Based Features](#role-based-features)  
   2.3. [Component Organization](#component-organization)  
   2.4. [State Management and Styling](#state-management-and-styling)

3. [System Architecture Overview](#system-architecture-overview)  
   3.1. [System Services](#system-services)  
   3.2. [System Components and Tiers](#system-components-and-tiers)  
   3.3. [Communication Patterns](#communication-patterns)

4. [User Interface & Interaction Design](#user-interface--interaction-design)  
   4.1. [Teacher and Student Interfaces](#teacher-and-student-interfaces)  
   4.2. [Layout and Navigation](#layout-and-navigation)  
   4.3. [Error Handling and Feedback](#error-handling-and-feedback)

5. [Implementation Details](#implementation-details)  
   5.1. [Technology Choices](#technology-choices)  
   5.2. [Coding Standards and Documentation](#coding-standards-and-documentation)  
   5.3. [Codebase Organization](#codebase-organization)  
   5.4. [Quality and Maintenance](#quality-and-maintenance)

6. [User Guide](#user-guide)

7. [Testing Documentation](#testing-documentation)

---

## Backend Structure and Database

### Database Structure (PostgreSQL)

**Core Entities:**
- **User Management**:  
  - `users` table: Core user info and roles (`student`, `teacher`)  
  - `teachers` table: Extended teacher data  
  - `students` table: Extended student data (language, proficiency level A-D)

**Testing System:**
- `tests`: Defines tests created by teachers  
- `questions`: Multiple question types (picture vocab, sequence order, fill-in-the-blank, listening)  
- `test_assignments`: Manages test distribution to students  
- `student_tests`: Records test attempts and scores  
- `answers`: Stores individual question responses

### API Routes

**Key Route Files:**
- **Authentication (`auth.js`)**: Handles user registration, login, session management, and role-based control  
- **Tests (`tests.js`)**: Creates, updates, and manages tests and their questions  
- **Assignments (`assignments.js`)**: Creates and distributes assignments, updates statuses, and monitors progress  
- **Students (`students.js`)**: Manages student records, tracks progress and performance  
- **Media (`media.js`)**: Manages media uploads and content serving

### Technical Implementation Details

- **Database Access**: Uses `node-postgres` with connection pooling and transactions  
- **Configuration**: Environment variables for database credentials and JWT secret  
- **Data Integrity**: Foreign keys, ENUM types, JSONB fields for flexible data storage  
- **Error Handling**: Parameterized queries, role-based access checks, transaction rollback on errors

### Database Query Patterns

- **Transaction Management**: Ensures atomicity for multi-step operations (e.g., creating tests and associated questions)  
- **JOIN Queries**: Combine data from multiple tables for comprehensive views (e.g., test details with student scores)  
- **Security**: Parameterized queries to prevent SQL injection  
- **Cascading Deletes and Status Updates**: Organized data management  
- **Error Handling**: Distinguishes foreign key violations, duplicates, and other errors

---

## Frontend Structure and Implementation

### Application Architecture

- Built with **React (TypeScript)** and **Vite**
- Used component library MaterialUI
- Uses **React Router** for navigation and protected routes  
- Context-based authentication for role-based UI control

### Role-Based Features

**Teacher:**
- Dashboard with analytics  
- Test creation and management  
- Student assignment distribution and tracking

**Student:**
- Dashboard with upcoming tests  
- Test-taking interface  
- Progress tracking and review

### Component Organization

- `components/` for reusable UI elements  
- `pages/` for main views (dashboards, test management)  
- `api/` for centralized API calls  
- `context/` for global state (auth context)  
- `types/` for TypeScript definitions

### State Management and Styling

- React Context and hooks for global state  
- TypeScript ensures type safety  
- CSS modules and global styles for consistent UI/UX  
- Axios for API calls and error handling

---

## System Architecture Overview

### System Services

**Teacher Services:** Auth, test/assignment management, analytics, student progress  
**Student Services:** Auth, test-taking, assignments, progress tracking

### System Components and Tiers

**Three-Tier Architecture:**
- **Frontend:** React SPA for user interaction  
- **Backend:** Express.js REST API for business logic  
- **Database:** PostgreSQL for data persistence

### Communication Patterns

- **Client-Server:** RESTful JSON-based APIs, JWT authentication  
- **Server-Database:** Parameterized queries, transactions, pooling

---

## User Interface & Interaction Design

### Teacher and Student Interfaces

**Teacher UI:** Data management and analytics dashboards  
**Student UI:** Focused on test-taking experience and feedback

### Layout and Navigation

- React Router for navigation  
- Protected routes by role  
- Responsive layouts with sidebars, headers, and breadcrumbs

### Error Handling and Feedback

- Real-time form validation  
- Toast notifications and dialogs  
- Loading states and user-friendly error messages

---

## Implementation Details

### Technology Choices

- **Frontend:** TypeScript, React, Vite, Axios, React Router  
- **Backend:** Node.js, Express, `pg` (PostgreSQL), JWT for auth

### Coding Standards and Documentation

- TypeScript interfaces and JSDoc comments for code clarity  
- ESLint and Prettier for formatting and code style  
- Consistent naming and directory structure

### Codebase Organization

- **Frontend:** Feature-based organization (api, components, pages, context, types)  
- **Backend:** Organized by functionality (routes, services, middleware, db queries)

### Quality and Maintenance

- Linting and formatting for consistent code quality  
- Robust error handling for easier debugging  
- Modular architecture for scalable development  
- Potential CI/CD integration and automated testing

---

## User Guide

This guide provides step-by-step instructions on how to run the application as a developer.

### Prerequisites
```bash
# Required Software:
- Node.js (Latest LTS)
- PostgreSQL (v13 or higher)
- Git
```

### Database Setup
```sql
1. Install PostgreSQL
2. Create a database named 'postgres'
3. Set environment variables in iwc-backend/.env:
   DB_USER=postgres
   DB_PASSWORD=iwcepics
   DB_HOST=localhost
   DB_PORT=5432
   DB_DATABASE=postgres
4. Leave 'locale' as default
```

### Backend Setup
```bash
# Navigate to backend directory
cd iwc-backend

# Install dependencies
npm install

# Create .env file with the following content:
PORT=5000
DB_USER=postgres
DB_PASSWORD=iwcepics
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=postgres
JWT_SECRET=IWCF2024epics

# Start the backend server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd iwc-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Development Scripts

**Backend Scripts (iwc-backend/package.json):**
```json
{
  "scripts": {
    "start": "nodemon server.js"
  }
}
```

**Frontend Scripts (iwc-frontend/package.json):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### Development Workflow

1. **Run Both Services:**
```bash
# Terminal 1 (Backend)
cd iwc-backend
npm start

# Terminal 2 (Frontend)
cd iwc-frontend
npm run dev
```
*The following command must have been run in both directories before the application will run
```bash
npm install
```

2. **Access the Application:**
- Frontend: `http://localhost:5173`  
- Backend API: `http://localhost:5000`

3. **Hot Reload & Features:**
- Backend uses Nodemon for hot reload  
- Frontend uses Vite for fast builds  
- ESLint for code quality checks

### Environment Configuration
`iwc-backend/.env`:
```env
PORT=5000
DB_USER=postgres
DB_PASSWORD=iwcepics
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=postgres
JWT_SECRET=IWCF2024epics
```

### Database Initialization

- The database schema initializes automatically when the backend starts.
- Includes user, test, question, and assignment tables.

### Testing the Setup

**Backend Health Check:**
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok"}
```

**Frontend Health Check:**
- Open `http://localhost:5173` in your browser.
- You should see the login page.

### Common Development Tasks

**Adding Dependencies:**
```bash
# Backend
cd iwc-backend
npm install package-name

# Frontend
cd iwc-frontend
npm install package-name
```

**Running Linter (Frontend):**
```bash
cd iwc-frontend
npm run lint
```

**Building for Production (Frontend):**
```bash
cd iwc-frontend
npm run build
```

### Troubleshooting

**Database Connection Issues:**
- Verify PostgreSQL is running and credentials are correct  
- Check if the `DB_*` variables in `.env` match your local setup

**Node Module Issues:**
```bash
rm -rf node_modules
npm install
```

**Port Conflicts:**
- Change `PORT` in `.env` if 5000 is taken  
- For frontend, run `npm run dev -- --port=XXXX` to specify a different port

### Testing the Application

#### Initial Setup for Testing
```bash
# Backend test setup
cd iwc-backend
npm install --save-dev jest supertest @types/jest

# Frontend test setup
cd iwc-frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

#### Running Tests

1. **Quick Test Run**
```bash
# Test backend
cd iwc-backend
npm test

# Test frontend
cd iwc-frontend
npm test
```

2. **Watch Mode (Development)**
```bash
# Backend: Automatically run tests when files change
cd iwc-backend
npm run test:watch

# Frontend: Interactive test runner
cd iwc-frontend
npm run test:watch
```

3. **Coverage Reports**
```bash
# Backend coverage
cd iwc-backend
npm run test:coverage
# View report in iwc-backend/coverage/lcov-report/index.html

# Frontend coverage
cd iwc-frontend
npm run test:coverage
# View report in iwc-frontend/coverage/lcov-report/index.html
```

#### Debugging Tests

1. **Backend Tests**
```bash
# Run single test file
npm test -- tests/routes/students.test.js

# Run tests with detailed logging
npm test -- --verbose

# Run specific test
npm test -- -t "should return all students"
```

2. **Frontend Tests**
```bash
# Run single test file
npm test -- TestAssignments.test.tsx

# Run tests with detailed logging
npm test -- --verbose

# Run specific test
npm test -- -t "renders loading state"
```

#### Common Testing Issues

1. **Backend Test Issues**
- Database connection errors: Ensure test database is running
- Auth token errors: Check JWT_SECRET in test environment
- Mocking issues: Verify mock implementations match actual services

2. **Frontend Test Issues**
- Component not rendering: Check BrowserRouter wrapper
- Async test failures: Ensure proper use of waitFor
- State updates not reflecting: Verify act() wrapper usage

#### Adding New Tests

1. **Backend Route Test**
```bash
# Create new test file
touch iwc-backend/tests/routes/your-route.test.js

# Basic test structure
const request = require('supertest');
const app = require('../../server');

describe('Your Route', () => {
  it('should handle GET request', async () => {
    const response = await request(app)
      .get('/your/endpoint')
      .expect(200);
    // Add assertions
  });
});
```

2. **Frontend Component Test**
```bash
# Create new test file
touch iwc-frontend/tests/components/YourComponent.test.tsx

# Basic test structure
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    // Add assertions
  });
});
```

#### Test Environment Setup

1. **Backend (.env.test)**
```env
DB_USER=postgres
DB_PASSWORD=iwcepics
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=postgres_test
JWT_SECRET=test_secret
```

2. **Frontend (setupTests.ts)**
```typescript
import '@testing-library/jest-dom';
// Add any global test setup here
```

#### Continuous Integration

The test suite runs automatically on:
- Pull requests to main branch
- Push to main branch
- Manual trigger via GitHub Actions

To run CI tests locally:
```bash
# Backend
cd iwc-backend
npm run test:ci

# Frontend
cd iwc-frontend
npm run test:ci
```

## Testing Documentation

The project implements comprehensive testing strategies for both frontend and backend components.

### Frontend Testing Architecture

The frontend testing suite uses the following technologies:
- **Jest**: Main testing framework
- **React Testing Library**: For testing React components
- **@testing-library/user-event**: For simulating user interactions
- **jest-dom**: For DOM-specific assertions

#### Test Organization
- Tests are located in the `iwc-frontend/tests` directory
  - Component tests are in `iwc-frontend/tests/components`
  - Main test files are in the root of the tests directory (e.g., `TestAssignments.test.tsx`)
- Each test file follows the naming pattern `*.test.tsx`
- Tests are organized by component and feature

#### Key Testing Patterns
1. **Component Tests**
   - Render testing with proper context providers
   - User interaction simulation
   - Async operation handling
   - Form validation testing
   - Error state verification

2. **Mock Implementations**
   - API calls are mocked using Jest's mock functions
   - Properly typed mock responses using TypeScript
   - Browser APIs (TextEncoder, IntersectionObserver) are polyfilled

3. **Test Setup**
   - Global setup in `setupTests.ts`
   - Common test utilities and fixtures
   - Environment polyfills for browser APIs

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage Goals
- Components: 80% coverage
- User interactions: 90% coverage
- Error handling: 85% coverage
- Form validation: 90% coverage

### Best Practices
1. Use `act()` for state updates
2. Mock external dependencies
3. Test user interactions
4. Verify error states
5. Test accessibility
6. Use proper assertions with jest-dom
7. Maintain type safety in tests

### Backend Testing Architecture

(Backend testing documentation to be added when implemented)
