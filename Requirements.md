Below is a concise set of MVP requirements, organized into **Functional**, **Non‑Functional**, and **Technical** categories. These requirements directly map to your high‑priority assessment use case and lay the groundwork for later expansion (e.g., progress tracking).

---

## 1. Functional Requirements

### 1.1 User Management & Authentication

1. **User Roles**
    
    - Support three roles: **Admin**, **Instructor**, **Student**.
        
2. **Registration & Login**
    
    - Instructors and Admins sign up via invitation or Admin portal.
        
    - Students log in with credentials created by an Admin.
        
3. **Role-Based Access Control**
    
    - Only Admins can manage users and system settings.
        
    - Instructors can manage assessments and grade submissions.
        
    - Students can only view and take assessments assigned to them.
        

### 1.2 Assessment Lifecycle

1. **Assessment CRUD**
    
    - Instructors can **Create**, **Read**, **Update**, and **Delete** assessments.
        
2. **Question Types**
    
    - Support at least: **Multiple‑Choice**, **True/False**, **Short Answer**.
        
3. **Question Management**
    
    - Add, remove, reorder questions within an assessment.
        
    - Preview assessment exactly as students will see it.
        
4. **Availability Controls**
    
    - Set open/close dates and time limits per assessment.
        

### 1.3 Submission & Grading

1. **Student Submission**
    
    - Students can launch an assessment, answer questions, and submit once.
        
2. **Auto‑Grading**
    
    - System automatically grades objective questions (MCQ, T/F) on submission.
        
3. **Manual Grading**
    
    - Instructors can view all submissions for an assessment and enter grades/feedback on short‑answer responses.
        
4. **Result Feedback**
    
    - Students immediately see auto‑graded scores and later see instructor feedback on free‑response items.

---

## 2. Non‑Functional Requirements

### 2.1 Security & Compliance

- **Authentication** via JWT tokens issued by a third‑party provider (e.g., Auth0).
    
- **HTTPS** enforced end‑to‑end (TLS).
    
- **Input Validation** on both frontend and backend to prevent injection attacks.
    
- **Role‑Based Authorization** checks on every API endpoint.
    

### 2.3 Maintainability & Extensibility

- **Modular Code**:
    
    - Separate modules for Users, Assessments, Submissions, and (future) Progress.

---

## 3. Technical Requirements

### 3.1 Frontend

- **Framework**: Vite and React.js (allowing fast development and easy component reuse for question widgets).
    
- **Styling**: Material‑UI for rapid UI assembly.
    
- **Routing**: React Router for protected and public routes.
    

### 3.2 Backend

- **Runtime & Framework**: Node.js (v18 LTS) + Express.js for RESTful API.
    
- **API Design**:
    
    - Endpoints under `/api/assessments`, `/api/submissions`, `/api/users`, etc.
        
    - JWT‑protected routes with role checks.
        

### 3.3 Data Storage

- **Primary DB**: PostgreSQL on AWS RDS (schema for Users, Roles, Assessments, Questions, Submissions, Results).
    
- **File Storage**: AWS S3 for any media or static assets.
    

### 3.4 Containerization & Deployment

- **Docker**
    
    - Single multi‑stage `Dockerfile` for app image.
        
    - `docker-compose.yml` for local development (app + Postgres).
        
- **Registry**: AWS ECR for storing production images.
    
- **Orchestration**: AWS ECS with Fargate (behind an Application Load Balancer).
    

### 3.5 CI/CD

- **Pipeline**: GitHub Actions to
    
    1. Run tests and linting
        
    2. Build Docker image
        
    3. Push to ECR
        
    4. Update ECS service for zero‑downtime deploys
        

---

These requirements ensure your MVP delivers robust assessment functionality quickly, while establishing a solid foundation (Docker + AWS + modular code) for adding features like student progress tracking in the next phase.

Here’s a set of agile-style user stories, organized by role. They focus first on assessment-related functionality (your MVP), with a few that look ahead to progress tracking and admin functions.

---

## Instructor User Stories

1. **Assessment Creation & Management**
    
    - As an **instructor**, I want to **create a new assessment** (quiz/exam) with a mix of question types (multiple‑choice, true/false, short answer), so that I can test learners’ skills.
        
    - As an **instructor**, I want to **edit or delete an existing assessment**, so that I can correct mistakes or update content.
        
    - As an **instructor**, I want to **set availability dates and deadlines** for each assessment, so that students know when they can take it and when it is due.
        
2. **Question Authoring**
    
    - As an **instructor**, I want to **add, reorder, or remove questions** within an assessment, so that I can tailor difficulty and flow.
        
    - As an **instructor**, I want to **preview an assessment** exactly as students will see it, so that I can verify formatting and question clarity.
        
3. **Submission Review & Grading**
    
    - As an **instructor**, I want to **view all student submissions** for a given assessment in a table, so that I can efficiently review and grade them.
        
    - As an **instructor**, I want to **provide feedback and manual grades** on open‑ended answers, so that learners get personalized guidance.
        
4. **Auto‑Grading & Analytics**
    
    - As an **instructor**, I want the system to **automatically grade objective questions**, so that I can focus on assessing free‑response items.
        
    - As an **instructor**, I want to **see summary statistics** (average score, question difficulty) after grading, so that I can identify concepts that need reteaching.

---

## Student User Stories

1. **Assessment Access & Submission**
    
    - As a **student**, I want to **see a list of available assessments** with open/close dates, so that I know what to work on.
        
    - As a **student**, I want to **take an assessment** by answering questions and submitting them, so that I can demonstrate my learning.
        
2. **Real‑Time Feedback**
    
    - As a **student**, I want to **receive instant scores** on automatically graded questions, so that I know which areas I need to review.
        
    - As a **student**, I want to **view my instructor’s feedback** on my free‑response answers once graded, so that I can understand my mistakes.

---

## Admin User Stories

1. **User & Role Management**
    
    - As an **admin**, I want to **create, edit, or deactivate user accounts** (instructor or student), so that I can control who has access.
        
    - As an **admin**, I want to **manage roles** (instructor vs. student) for each user, so that permissions are enforced correctly.