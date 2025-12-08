import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function UserPlanner() {
  const { net_id } = useParams();
  const navigate = useNavigate();
  const [plannedCourses, setPlannedCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('planned');
  const [userExists, setUserExists] = useState(true);
  const [showAddCompletedForm, setShowAddCompletedForm] = useState(false);
  const [newCompletedCourse, setNewCompletedCourse] = useState({
    course_code: '',
    semester_taken: 'Fall',
    year_taken: new Date().getFullYear()
  });
  const [message, setMessage] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    new_semester: 'Fall',
    new_year: new Date().getFullYear()
  });

  useEffect(() => {
    if (net_id) {
      fetchCourses();
    }
  }, [net_id]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const encodedNetId = encodeURIComponent(net_id);
      const [plannedRes, completedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses/user/${encodedNetId}/planned`),
        axios.get(`${API_BASE_URL}/courses/user/${encodedNetId}/completed`)
      ]);
      
      const plannedData = plannedRes.data || [];
      const completedData = completedRes.data || [];
      
      // If both are empty, user might not exist
      if (plannedData.length === 0 && completedData.length === 0) {
        setUserExists(false);
        setPlannedCourses([]);
        setCompletedCourses([]);
      } else {
        setUserExists(true);
        setPlannedCourses(plannedData);
        setCompletedCourses(completedData);
      }
    } catch (err) {
      setError('Failed to load courses: ' + (err.response?.data?.error || err.message));
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const groupBySemester = (courses) => {
    const grouped = {};
    courses.forEach(course => {
      const key = `${course.semester_planned || course.semester_completed} ${course.year_planned || course.year_completed}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(course);
    });
    return grouped;
  };

  const getTotalCredits = (courses) => {
    return courses.reduce((sum, course) => sum + (course.credit_hours || 0), 0);
  };

  const handleAddCompletedCourse = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/courses/completed/add`, {
        net_id: net_id,
        course_code: newCompletedCourse.course_code.toUpperCase(),
        semester_taken: newCompletedCourse.semester_taken,
        year_taken: parseInt(newCompletedCourse.year_taken)
      });
      
      setMessage({ type: 'success', text: response.data.message });
      setNewCompletedCourse({
        course_code: '',
        semester_taken: 'Fall',
        year_taken: new Date().getFullYear()
      });
      setShowAddCompletedForm(false);
      fetchCourses();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to add completed course' 
      });
    }
  };

  const handleDeleteCompletedCourse = async (courseCode, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (!window.confirm(`Remove ${courseCode} from completed courses?`)) {
      return;
    }
    
    setMessage(null);
    try {
      const encodedNetId = encodeURIComponent(net_id);
      const encodedCourseCode = encodeURIComponent(courseCode);
      await axios.delete(`${API_BASE_URL}/courses/completed/${encodedNetId}/${encodedCourseCode}`);
      setMessage({ type: 'success', text: 'Course removed from completed courses' });
      fetchCourses();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to delete completed course' 
      });
    }
  };

  const handleDeletePlannedCourse = async (courseCode, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    if (!window.confirm(`Remove ${courseCode} from planned courses?`)) {
      return;
    }
    
    setMessage(null);
    try {
      const encodedNetId = encodeURIComponent(net_id);
      const encodedCourseCode = encodeURIComponent(courseCode);
      const url = `${API_BASE_URL}/courses/planned/${encodedNetId}/${encodedCourseCode}`;
      console.log('Deleting planned course:', url);
      const response = await axios.delete(url);
      console.log('Delete response:', response.data);
      setMessage({ type: 'success', text: 'Course removed from planned courses' });
      fetchCourses();
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to delete planned course' 
      });
    }
  };

  const handleCreateProfile = async () => {
    setMessage(null);
    try {
      await axios.post(`${API_BASE_URL}/courses/user/create`, {
        net_id: net_id
      });
      setMessage({ type: 'success', text: 'Profile created successfully!' });
      setUserExists(true);
      fetchCourses();
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to create profile' 
      });
    }
  };

  const handleUpdatePlannedCourse = async (courseCode, e) => {
    e.stopPropagation();
    setMessage(null);
    
    const newYear = parseInt(editForm.new_year);
    const payload = {
      net_id: net_id,
      course_code: courseCode,
      new_semester: editForm.new_semester,
      new_year: newYear
    };
    
    console.log('Updating course:', payload);
    
    try {
      await axios.put(`${API_BASE_URL}/courses/planned/update`, payload);
      
      setMessage({ type: 'success', text: 'Course semester updated successfully' });
      setEditingCourse(null);
      setEditForm({ new_semester: 'Fall', new_year: new Date().getFullYear() });
      fetchCourses();
    } catch (err) {
      console.error('Update error:', err.response?.data || err.message);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Failed to update course semester' 
      });
    }
  };

  const startEditing = (course, e) => {
    e.stopPropagation();
    setEditingCourse(course.course_code);
    setEditForm({
      new_semester: course.semester_planned,
      new_year: course.year_planned
    });
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    setEditForm({ new_semester: 'Fall', new_year: new Date().getFullYear() });
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>CS Degree Planner</h1>
        </header>
        <main className="App-main">
          <div className="loading-message">Loading courses...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>CS Degree Planner</h1>
        </header>
        <main className="App-main">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/')} className="back-btn">Back to Courses</button>
        </main>
      </div>
    );
  }

  const plannedGrouped = groupBySemester(plannedCourses);
  const completedGrouped = groupBySemester(completedCourses);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CS Degree Planner</h1>
        <button onClick={() => navigate('/')} className="back-btn-header">
          ← Back to Courses
        </button>
      </header>

      <main className="App-main">
        <section className="section">
          {!userExists && (
            <div className="create-user-section">
              <div className="info-message">
                No profile found for {net_id}. Create your profile to start planning your courses.
              </div>
              <button 
                className="create-profile-btn"
                onClick={handleCreateProfile}
              >
                Create Profile
              </button>
            </div>
          )}
          {infoMessage && (
            <div className="info-message">{infoMessage}</div>
          )}
          <div className="planner-header">
            <h2>Planner for {net_id}</h2>
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-label">Planned:</span>
                <span className="stat-value">{plannedCourses.length} courses ({getTotalCredits(plannedCourses)} credits)</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed:</span>
                <span className="stat-value">{completedCourses.length} courses ({getTotalCredits(completedCourses)} credits)</span>
              </div>
            </div>
          </div>

          <div className="tabs">
            <button
              className={`tab-button ${activeTab === 'planned' ? 'active' : ''}`}
              onClick={() => setActiveTab('planned')}
            >
              Planned Courses ({plannedCourses.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed Courses ({completedCourses.length})
            </button>
          </div>

          {activeTab === 'planned' && (
            <div className="courses-section">
              {message && (
                <div className={`message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
                  {message.text}
                </div>
              )}

              {Object.keys(plannedGrouped).length === 0 ? (
                <div className="no-data-message">No planned courses yet.</div>
              ) : (
                Object.entries(plannedGrouped)
                  .sort((a, b) => {
                    const [semA, yearA] = a[0].split(' ');
                    const [semB, yearB] = b[0].split(' ');
                    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
                    // Academic order: Spring < Fall < Summer
                    const order = { 'Spring': 1, 'Fall': 2, 'Summer': 3 };
                    return (order[semA] || 0) - (order[semB] || 0);
                  })
                  .map(([semester, courses]) => {
                    const totalCredits = getTotalCredits(courses);
                    return (
                      <div key={semester} className="semester-group">
                        <div className="semester-header">
                          <h3>{semester}</h3>
                          <span className="semester-credits">{totalCredits} credits</span>
                        </div>
                        <div className="courses-grid">
                          {courses.map((course, index) => (
                            <div
                              key={index}
                              className="course-card"
                              onClick={() => !editingCourse && navigate(`/course/${course.course_code}`)}
                            >
                              {editingCourse === course.course_code ? (
                                <div className="edit-course-form" onClick={(e) => e.stopPropagation()}>
                                  <div className="course-card-code">{course.course_code}</div>
                                  <div className="form-group">
                                    <label>New Semester</label>
                                    <select
                                      value={editForm.new_semester}
                                      onChange={(e) => setEditForm({...editForm, new_semester: e.target.value})}
                                    >
                                      <option value="Fall">Fall</option>
                                      <option value="Spring">Spring</option>
                                      <option value="Summer">Summer</option>
                                    </select>
                                  </div>
                                  <div className="form-group">
                                    <label>New Year</label>
                                    <input
                                      type="number"
                                      value={editForm.new_year}
                                      onChange={(e) => setEditForm({...editForm, new_year: e.target.value})}
                                      min="2000"
                                      max="2100"
                                    />
                                  </div>
                                  <div className="edit-form-actions">
                                    <button
                                      className="update-btn"
                                      onClick={(e) => handleUpdatePlannedCourse(course.course_code, e)}
                                    >
                                      Update
                                    </button>
                                    <button
                                      className="cancel-btn"
                                      onClick={cancelEditing}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="course-card-header">
                                    <div className="course-card-code">{course.course_code}</div>
                                    <div className="course-card-actions">
                                      <button
                                        className="edit-btn"
                                        onClick={(e) => startEditing(course, e)}
                                        title="Update semester"
                                      >
                                        ✎
                                      </button>
                                      <button
                                        className="delete-btn"
                                        onClick={(e) => handleDeletePlannedCourse(course.course_code, e)}
                                        title="Remove from planned courses"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                  <div className="course-card-name">{course.course_name || 'N/A'}</div>
                                  <div className="course-card-credits">{course.credit_hours || 0} credits</div>
                                  {course.avg_course_gpa !== null && course.avg_course_gpa !== undefined && (
                                    <div className="course-card-gpa">Avg GPA: {course.avg_course_gpa}</div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="courses-section">
              <div className="section-actions">
                <button 
                  className="add-course-btn"
                  onClick={() => setShowAddCompletedForm(!showAddCompletedForm)}
                >
                  {showAddCompletedForm ? 'Cancel' : '+ Add Completed Course'}
                </button>
              </div>

              {message && (
                <div className={`message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
                  {message.text}
                </div>
              )}

              {showAddCompletedForm && (
                <form onSubmit={handleAddCompletedCourse} className="add-course-form">
                  <div className="form-group">
                    <label>Course Code</label>
                    <input
                      type="text"
                      value={newCompletedCourse.course_code}
                      onChange={(e) => setNewCompletedCourse({...newCompletedCourse, course_code: e.target.value})}
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <select
                      value={newCompletedCourse.semester_taken}
                      onChange={(e) => setNewCompletedCourse({...newCompletedCourse, semester_taken: e.target.value})}
                      required
                    >
                      <option value="Fall">Fall</option>
                      <option value="Spring">Spring</option>
                      <option value="Summer">Summer</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <input
                      type="number"
                      value={newCompletedCourse.year_taken}
                      onChange={(e) => setNewCompletedCourse({...newCompletedCourse, year_taken: e.target.value})}
                      min="2000"
                      max="2100"
                      required
                    />
                  </div>
                  <button type="submit" className="add-course-btn">Add Completed Course</button>
                </form>
              )}

              {Object.keys(completedGrouped).length === 0 ? (
                <div className="no-data-message">No completed courses yet.</div>
              ) : (
                Object.entries(completedGrouped)
                  .sort((a, b) => {
                    const [semA, yearA] = a[0].split(' ');
                    const [semB, yearB] = b[0].split(' ');
                    if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
                    // Academic order: Spring < Fall < Summer (reversed for descending)
                    const order = { 'Spring': 1, 'Fall': 2, 'Summer': 3 };
                    return (order[semB] || 0) - (order[semA] || 0);
                  })
                  .map(([semester, courses]) => {
                    const totalCredits = getTotalCredits(courses);
                    return (
                      <div key={semester} className="semester-group">
                        <div className="semester-header">
                          <h3>{semester}</h3>
                          <span className="semester-credits">{totalCredits} credits</span>
                        </div>
                        <div className="courses-grid">
                          {courses.map((course, index) => (
                            <div
                              key={index}
                              className="course-card completed"
                              onClick={() => navigate(`/course/${course.course_code}`)}
                            >
                              <div className="course-card-header">
                                <div className="course-card-code">{course.course_code}</div>
                                <button
                                  className="delete-btn"
                                  onClick={(e) => handleDeleteCompletedCourse(course.course_code, e)}
                                  title="Remove from completed courses"
                                >
                                  ×
                                </button>
                              </div>
                              <div className="course-card-name">{course.course_name || 'N/A'}</div>
                              <div className="course-card-credits">{course.credit_hours || 0} credits</div>
                              <div className="course-card-info">
                                {course.prereq_count > 0 && (
                                  <span className="info-badge">Prereq for {course.prereq_count} course{course.prereq_count !== 1 ? 's' : ''}</span>
                                )}
                                {course.concurrent_count > 0 && (
                                  <span className="info-badge">Concurrent for {course.concurrent_count} course{course.concurrent_count !== 1 ? 's' : ''}</span>
                                )}
                                {course.prereq_count === 0 && course.concurrent_count === 0 && (
                                  <span className="info-badge muted">No requirements fulfilled</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default UserPlanner;

