import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { User, AuthRequest, Student, Instructor, Admin } from '../types/index';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Fetch subtype-specific data based on role
    let userData: any = { ...userWithoutPassword };
    
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT * FROM students WHERE user_id = $1',
        [user.id]
      );
      if (studentResult.rows.length > 0) {
        userData = { ...userData, ...studentResult.rows[0] };
      }
    } else if (user.role === 'instructor' || user.role === 'admin') {
      const instructorResult = await pool.query(
        'SELECT * FROM instructors WHERE user_id = $1',
        [user.id]
      );
      if (instructorResult.rows.length > 0) {
        userData = { ...userData, ...instructorResult.rows[0] };
      }
      
      if (user.role === 'admin') {
        const adminResult = await pool.query(
          'SELECT * FROM admins WHERE instructor_id = $1',
          [user.id]
        );
        if (adminResult.rows.length > 0) {
          userData = { ...userData, ...adminResult.rows[0] };
        }
      }
    }

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role, ...subtypeData } = req.body;

    // Check if email already exists
    const emailCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const usernameCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user - the trigger will automatically create the subtype record
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, hashedPassword, role]
    );
    const newUser = result.rows[0];

    // Add subtype-specific data if provided
    if (Object.keys(subtypeData).length > 0) {
      // For student subtype
      if (role === 'student' && (subtypeData.proficiencyLevel || subtypeData.learningGoals || subtypeData.nativeLanguage)) {
        await pool.query(
          `UPDATE students 
           SET proficiency_level = $1, 
               learning_goals = $2,
               native_language = $3
           WHERE user_id = $4`,
          [
            subtypeData.proficiencyLevel || 'A1',
            subtypeData.learningGoals || null,
            subtypeData.nativeLanguage || null,
            newUser.id
          ]
        );
      }
      
      // For instructor subtype
      if ((role === 'instructor' || role === 'admin') && 
          (subtypeData.specializations || subtypeData.qualifications || subtypeData.teachingLanguages)) {
        await pool.query(
          `UPDATE instructors 
           SET specializations = $1, 
               qualifications = $2,
               teaching_languages = $3
           WHERE user_id = $4`,
          [
            subtypeData.specializations || null,
            subtypeData.qualifications || null,
            subtypeData.teachingLanguages || null,
            newUser.id
          ]
        );
      }
      
      // For admin subtype
      if (role === 'admin' && subtypeData.securityLevel) {
        await pool.query(
          `UPDATE admins 
           SET security_level = $1
           WHERE instructor_id = $2`,
          [subtypeData.securityLevel || 1, newUser.id]
        );
      }
    }

    // Fetch the complete user data with subtype info
    let userData = await getUserWithSubtypeData(newUser.id, role);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = userData;
    
    res.status(201).json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: 'Please authenticate' });
    }
    
    // Get complete user data including subtype information
    const userData = await getUserWithSubtypeData(authReq.user.id, authReq.user.role);
    
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: userData });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const authReq = req as unknown as AuthRequest;
    if (!authReq.user?.id) {
      return res.status(401).json({ error: 'Please authenticate' });
    }
    
    const { 
      firstName, lastName, bio, languagePreferences, profileImage, 
      // Student-specific fields
      proficiencyLevel, learningGoals, nativeLanguage,
      // Instructor-specific fields
      specializations, qualifications, teachingLanguages, availability
    } = req.body;
    
    // Start a transaction
    await pool.query('BEGIN');
    
    // Update base user profile
    const userResult = await pool.query(
      `UPDATE users 
       SET first_name = $1, 
           last_name = $2, 
           bio = $3, 
           language_preferences = $4,
           profile_image = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [firstName, lastName, bio, JSON.stringify(languagePreferences || {}), profileImage, authReq.user.id]
    );
    
    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Update subtype-specific fields
    if (user.role === 'student') {
      await pool.query(
        `UPDATE students 
         SET proficiency_level = COALESCE($1, proficiency_level),
             learning_goals = COALESCE($2, learning_goals),
             native_language = COALESCE($3, native_language)
         WHERE user_id = $4`,
        [proficiencyLevel, learningGoals, nativeLanguage, user.id]
      );
    } else if (user.role === 'instructor' || user.role === 'admin') {
      await pool.query(
        `UPDATE instructors 
         SET specializations = COALESCE($1, specializations),
             qualifications = COALESCE($2, qualifications),
             teaching_languages = COALESCE($3, teaching_languages),
             availability = COALESCE($4, availability)
         WHERE user_id = $5`,
        [
          specializations ? JSON.stringify(specializations) : null, 
          qualifications, 
          teachingLanguages ? JSON.stringify(teachingLanguages) : null,
          availability ? JSON.stringify(availability) : null, 
          user.id
        ]
      );
    }
    
    await pool.query('COMMIT');
    
    // Get the updated user data with subtype info
    const updatedUserData = await getUserWithSubtypeData(user.id, user.role);
    
    // Return updated user data
    res.json({ user: updatedUserData });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to get user data with subtype information
const getUserWithSubtypeData = async (userId: number, role?: string) => {
  // Get the base user data
  const userResult = await pool.query(
    'SELECT id, username, email, first_name, last_name, bio, language_preferences, profile_image, role, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    return null;
  }
  
  const userData = userResult.rows[0];
  role = role || userData.role;
  
  // Get subtype-specific data
  if (role === 'student') {
    const studentResult = await pool.query(
      'SELECT proficiency_level, learning_goals, study_streak, last_activity_date, native_language FROM students WHERE user_id = $1',
      [userId]
    );
    if (studentResult.rows.length > 0) {
      return { ...userData, ...studentResult.rows[0] };
    }
  } else if (role === 'instructor' || role === 'admin') {
    const instructorResult = await pool.query(
      'SELECT specializations, qualifications, teaching_languages, availability, rating FROM instructors WHERE user_id = $1',
      [userId]
    );
    let combinedData = { ...userData };
    
    if (instructorResult.rows.length > 0) {
      combinedData = { ...combinedData, ...instructorResult.rows[0] };
    }
    
    if (role === 'admin') {
      const adminResult = await pool.query(
        'SELECT permissions, last_login, security_level FROM admins WHERE instructor_id = $1',
        [userId]
      );
      if (adminResult.rows.length > 0) {
        combinedData = { ...combinedData, ...adminResult.rows[0] };
      }
    }
    
    return combinedData;
  }
  
  return userData;
}; 