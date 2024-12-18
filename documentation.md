# IWC Backend & Frontend Documentation

## Table of Contents
1. [Database Initialization (init.js)](#database-initialization)
2. [Authentication Middleware (auth.js)](#authentication-middleware)
3. [Assignments Routes (assignments.js)](#assignments-routes)
4. [Authentication Routes (auth.js)](#authentication-routes)
5. [Media Routes (media.js)](#media-routes)
6. [Students Routes (students.js)](#students-routes)
7. [Tests Routes (tests.js)](#tests-routes)
8. [Server Configuration (server.js)](#server-configuration)
9. [Frontend API Client (index.ts)](#frontend-api-client)

## Database Initialization
**File: `init.js`**

Handles the initialization of the PostgreSQL database schema, including:

### ENUM Types:
- `user_role`: 'student' | 'teacher'
- `student_level`: 'A' | 'B' | 'C' | 'D'
- `question_type_enum`: Various question types
- `assignment_status`: Assignment progress states

### Tables:
- `users`: Core user information
- `teachers`: Teacher-specific data
- `students`: Student-specific data
- `tests`: Test definitions
- `questions`: Test questions
- `test_assignments`: Test assignments to students
- `student_tests`: Test attempt records
- `answers`: Student answers to questions

## Authentication Middleware
**File: `auth.js`**

Provides JWT-based authentication middleware:

### Key Features:
- Token verification
- User data retrieval
- Role-specific data attachment
- Error handling for invalid/expired tokens

### Usage: 