'use strict';
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL, { dialect: 'postgres', logging: false });

// User model
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'instructor', 'student'), allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'users', timestamps: false, underscored: true });

// Assessment model
const Assessment = sequelize.define('Assessment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  instructor_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  open_at: { type: DataTypes.DATE, allowNull: false },
  close_at: { type: DataTypes.DATE, allowNull: false },
  duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  level: { type: DataTypes.ENUM('A', 'B', 'C', 'D'), allowNull: false },
  theme: { type: DataTypes.ENUM('health', 'travel', 'food', 'work', 'education'), allowNull: false },
}, { tableName: 'assessments', timestamps: false, underscored: true });

// Question model
const Question = sequelize.define('Question', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assessment_id: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('multiple_choice', 'essay', 'short_answer'), allowNull: false },
  prompt: { type: DataTypes.TEXT, allowNull: false },
  position: { type: DataTypes.INTEGER, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  options: { type: DataTypes.JSONB, allowNull: true },
  correct_answer: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'questions', timestamps: false, underscored: true, indexes: [{ name: 'unique_position_per_assessment', unique: true, fields: ['assessment_id', 'position'] }] });

// Submission model
const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  assessment_id: { type: DataTypes.UUID, allowNull: false },
  student_id: { type: DataTypes.UUID, allowNull: false },
  score: { type: DataTypes.DECIMAL, allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  submitted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'submissions', timestamps: false, underscored: true, indexes: [{ name: 'one_submission_per_student', unique: true, fields: ['assessment_id', 'student_id'] }] });

// SubmissionAnswer model
const SubmissionAnswer = sequelize.define('SubmissionAnswer', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  submission_id: { type: DataTypes.UUID, allowNull: false },
  question_id: { type: DataTypes.UUID, allowNull: false },
  answer: { type: DataTypes.JSONB, allowNull: true },
  is_correct: { type: DataTypes.BOOLEAN, allowNull: true },
}, { tableName: 'submission_answers', timestamps: false, underscored: true });

// Associations
User.hasMany(Assessment, { foreignKey: 'instructor_id', as: 'assessments' });
Assessment.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
Assessment.hasMany(Question, { foreignKey: 'assessment_id', as: 'questions' });
Question.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });
Assessment.hasMany(Submission, { foreignKey: 'assessment_id', as: 'submissions' });
Submission.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.hasMany(SubmissionAnswer, { foreignKey: 'submission_id', as: 'answers' });
SubmissionAnswer.belongsTo(Submission, { foreignKey: 'submission_id', as: 'submission' });
Question.hasMany(SubmissionAnswer, { foreignKey: 'question_id', as: 'submission_answers' });
SubmissionAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

module.exports = { sequelize, Sequelize, User, Assessment, Question, Submission, SubmissionAnswer };
