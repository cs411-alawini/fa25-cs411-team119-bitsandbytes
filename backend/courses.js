const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');


router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    
    if (search && search.trim()) {
  
      const [rows] = await pool.query(
        `SELECT 
          ci.course_code,
          ci.course_name,
          ci.credit_hours,
          ROUND(
            SUM((gpa.Percentage_As * 4.0 + gpa.Percentage_Bs * 3.0 + 
                 gpa.Percentage_Cs * 2.0 + gpa.Percentage_Ds * 1.0 + 
                 gpa.Percentage_Fs * 0.0) / 100.0 * gpa.Total_Students) / 
            SUM(gpa.Total_Students),
            3
          ) as avg_gpa
        FROM Course_Information ci
        LEFT JOIN course_gpa_by_instructor gpa ON ci.course_code = gpa.Course_Code AND gpa.Total_Students > 0
        WHERE ci.course_code LIKE ?
        GROUP BY ci.course_code, ci.course_name, ci.credit_hours
        ORDER BY ci.course_code`,
        [`%${search.trim()}%`]
      );
      res.json(rows || []);
    } else {
      const [rows] = await pool.query('CALL GetAllCoursesWithGPA()');
      res.json(rows[0] || []);
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});


router.get('/user/:net_id/planned', async (req, res) => {
  const { net_id } = req.params;
  
  try {
    const [rows] = await pool.query('CALL GetUserCourses(?)', [net_id]);
    res.json(rows[0] || []);
  } catch (error) {
    console.error('Error fetching planned courses:', error);
    res.status(500).json({ error: 'Failed to fetch planned courses' });
  }
});


router.get('/user/:net_id/completed', async (req, res) => {
  const { net_id } = req.params;
  
  try {
    const [rows] = await pool.query('CALL GetUserCourses(?)', [net_id]);
    res.json(rows[1] || []);
  } catch (error) {
    console.error('Error fetching completed courses:', error);
    res.status(500).json({ error: 'Failed to fetch completed courses' });
  }
});


router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const connection = await pool.getConnection();
  
  try {

    const [results] = await connection.query('CALL GetCourseDetails(?)', [code]);
    
    const course = results[0]?.[0] || null;
    const instructors = results[1] || [];
    const prerequisites = results[2] || [];
    const concurrent = results[3] || [];
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({
      ...course,
      instructors,
      prerequisites,
      concurrentEnrollment: concurrent
    });
  } catch (error) {
    console.error('Error fetching course details:', error);
    res.status(500).json({ error: 'Failed to fetch course details' });
  } finally {
    connection.release();
  }
});


router.post('/semester/add', async (req, res) => {
  const { net_id, semester, year, course_code } = req.body;
  
  if (!net_id || !semester || !year || !course_code) {
    return res.status(400).json({ 
      error: 'Missing required fields: net_id, semester, year, course_code' 
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.query(
      'CALL AddCourseToSemester(?, ?, ?, ?)',
      [net_id, semester, year, course_code]
    );
    
   
    const [result] = await connection.query(
      'SELECT * FROM Courses_Planned_by_User WHERE net_id = ? AND course_code = ? AND semester_planned = ? AND year_planned = ?',
      [net_id, course_code, semester, year]
    );
    
    if (result.length > 0) {
      res.json({ 
        success: true, 
        message: 'Course successfully added to semester' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Unable to do this action' 
      });
    }
  } catch (error) {
    console.error('Error adding course to semester:', error);
    res.status(500).json({ 
      error: 'Failed to add course to semester',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});


router.put('/planned/update', async (req, res) => {
  const { net_id, course_code, new_semester, new_year } = req.body;
  
  if (!net_id || !course_code || !new_semester || !new_year) {
    return res.status(400).json({ 
      error: 'Missing required fields: net_id, course_code, new_semester, new_year' 
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.query(
      'CALL UpdatePlannedCourseSemester(?, ?, ?, ?)',
      [net_id, course_code, new_semester, parseInt(new_year)]
    );
    
    const [result] = await connection.query(
      'SELECT semester_planned, year_planned FROM Courses_Planned_by_User WHERE net_id = ? AND course_code = ?',
      [net_id, course_code]
    );
    
    if (result.length === 0 || result[0].semester_planned !== new_semester || result[0].year_planned !== parseInt(new_year)) {
      return res.status(400).json({ 
        error: 'Unable to do this action' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Course semester updated successfully' 
    });
  } catch (error) {
    console.error('Error updating planned course:', error);
    res.status(500).json({ 
      error: 'Failed to update planned course',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});


router.post('/completed/add', async (req, res) => {
  const { net_id, course_code, semester_taken, year_taken } = req.body;
  
  if (!net_id || !course_code || !semester_taken || !year_taken) {
    return res.status(400).json({ 
      error: 'Missing required fields: net_id, course_code, semester_taken, year_taken' 
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.query(
      'INSERT IGNORE INTO User_Table (net_id) VALUES (?)',
      [net_id]
    );
    
    await connection.query(
      'INSERT INTO Courses_Completed_By_User (net_id, course_code, semester_taken, year_taken) VALUES (?, ?, ?, ?)',
      [net_id, course_code, semester_taken, year_taken]
    );
    
    res.json({ 
      success: true, 
      message: 'Course successfully marked as completed' 
    });
  } catch (error) {
    console.error('Error adding completed course:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Course already marked as completed' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to add completed course',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});


router.delete('/completed/:net_id/:course_code', async (req, res) => {
  const { net_id, course_code } = req.params;
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.query(
      'DELETE FROM Courses_Completed_By_User WHERE net_id = ? AND course_code = ?',
      [net_id, course_code]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Completed course not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Course removed from completed courses' 
    });
  } catch (error) {
    console.error('Error deleting completed course:', error);
    res.status(500).json({ 
      error: 'Failed to delete completed course',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});


router.delete('/planned/:net_id/:course_code', async (req, res) => {
  const { net_id, course_code } = req.params;
  const connection = await pool.getConnection();
  
  try {
    const [result] = await connection.query(
      'DELETE FROM Courses_Planned_by_User WHERE net_id = ? AND course_code = ?',
      [net_id, course_code]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Planned course not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Course removed from planned courses' 
    });
  } catch (error) {
    console.error('Error deleting planned course:', error);
    res.status(500).json({ 
      error: 'Failed to delete planned course',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});







router.post('/user/create', async (req, res) => {
  const { net_id } = req.body;
  
  if (!net_id) {
    return res.status(400).json({ 
      error: 'Missing required field: net_id' 
    });
  }
  
  const connection = await pool.getConnection();
  
  try {
    const [existing] = await connection.query(
      'SELECT * FROM User_Table WHERE net_id = ?',
      [net_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'User already exists' 
      });
    }
    
    await connection.query(
      'INSERT INTO User_Table (net_id) VALUES (?)',
      [net_id]
    );
    
    res.json({ 
      success: true, 
      message: 'User profile created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user profile',
      details: error.message 
    });
  } finally {
    connection.release();
  }
});


module.exports = router;

