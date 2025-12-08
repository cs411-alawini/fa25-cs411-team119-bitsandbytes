import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [netIdInput, setNetIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchCourses = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = search.trim() ? { search: search.trim() } : {};
      const response = await axios.get(`${API_BASE_URL}/courses`, { params });
      setCourses(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch courses. Please try again.';
      setError(errorMessage);
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchCourses(searchQuery);
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleViewPlanner = (e) => {
    e.preventDefault();
    if (netIdInput.trim()) {
      navigate(`/planner/${netIdInput.trim()}`);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CS Degree Planner</h1>
        <form onSubmit={handleViewPlanner} className="planner-nav-form">
          <input
            type="text"
            value={netIdInput}
            onChange={(e) => setNetIdInput(e.target.value)}
            placeholder="Enter Net ID to view planner"
            className="planner-nav-input"
          />
          <button type="submit" className="planner-nav-button">View Planner</button>
        </form>
      </header>

      <main className="App-main">
        <div className="container">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course code (e.g., CS101, MATH200)"
              className="search-input"
            />
            {searchQuery && (
              <div className="search-results-count">
                {courses.length} course{courses.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
          {/* Course List */}
          <div className="table-container">
            <div className="table-header">
              <h3>Courses ({courses.length} course{courses.length !== 1 ? 's' : ''})</h3>
            </div>
            {loading ? (
              <div className="loading-message">Loading courses...</div>
            ) : error ? (
              <div className="no-data-message">{error}</div>
            ) : courses.length === 0 ? (
              <div className="no-data-message">
                {searchQuery ? `No courses found matching "${searchQuery}"` : 'No courses found.'}
              </div>
            ) : (
              <table className="courses-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Credit Hours</th>
                    <th>GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr 
                      key={course.course_code || index}
                      className="course-row"
                      onClick={() => navigate(`/course/${course.course_code}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="course-code">{course.course_code}</td>
                      <td className="course-name">{course.course_name}</td>
                      <td className="course-credits">
                        {course.credit_hours !== null && course.credit_hours !== undefined 
                          ? course.credit_hours 
                          : 'N/A'}
                      </td>
                      <td className="course-gpa">
                        {course.avg_gpa !== null && course.avg_gpa !== undefined 
                          ? (typeof course.avg_gpa === 'number' ? course.avg_gpa.toFixed(2) : parseFloat(course.avg_gpa).toFixed(2))
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

