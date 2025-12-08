import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function CourseDetail() {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [net_id, setNet_id] = useState('');
  const [semester, setSemester] = useState('Fall');
  const [year, setYear] = useState(new Date().getFullYear());
  const [addingCourse, setAddingCourse] = useState(false);
  const [addMessage, setAddMessage] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseCode]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseCode}`);
      setCourse(response.data);
    } catch (err) {
      setError('Failed to load course details: ' + (err.response?.data?.error || err.message));
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSemester = async (e) => {
    e.preventDefault();
    setAddingCourse(true);
    setAddMessage(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/courses/semester/add`, {
        net_id: net_id,
        semester: semester,
        year: parseInt(year),
        course_code: courseCode
      });
      
      const successText = response.data.message || 'Course successfully added to semester!';
      setAddMessage({ 
        type: 'success', 
        text: successText,
        showPlannerLink: true
      });
      // Reset form (keep net_id so user can add more courses)
      setSemester('Fall');
      setYear(new Date().getFullYear());
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to add course to semester';
      setAddMessage({ type: 'error', text: errorMsg });
      console.error('Error adding course to semester:', err);
    } finally {
      setAddingCourse(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>CS Degree Planner</h1>
        </header>
        <main className="App-main">
          <div className="loading-message">Loading course details...</div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>CS Degree Planner</h1>
        </header>
        <main className="App-main">
          <div className="error-message">{error || 'Course not found'}</div>
          <button onClick={() => navigate('/')} className="back-btn">Back to Courses</button>
        </main>
      </div>
    );
  }

  
  const chartData = course.instructors
    .filter(instructor => instructor.Total_Students > 0 && instructor.gpa !== null && instructor.gpa !== undefined)
    .map(instructor => ({
      instructor: instructor.Instructor ? instructor.Instructor.split(',')[0] : 'N/A',
      gpa: parseFloat(instructor.gpa) || 0,
      students: instructor.Total_Students || 0
    }));

  return (
    <div className="App">
      <header className="App-header">
        <h1>CS Degree Planner</h1>
        <button onClick={() => navigate('/')} className="back-btn-header">
          ← Back to Courses
        </button>
      </header>

      <main className="App-main">
        {/* Course Basic Info */}
        <section className="section">
          <div className="course-header">
            <h2>{course.course_code}: {course.course_name}</h2>
            <div className="course-meta">
              <span className="meta-item">Credit Hours: {course.credit_hours !== null && course.credit_hours !== undefined ? course.credit_hours : 'N/A'}</span>
              <span className="meta-item">Average GPA: {course.avg_gpa !== null && course.avg_gpa !== undefined ? parseFloat(course.avg_gpa).toFixed(2) : 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Instructor GPA Breakdown */}
        <section className="section">
          <h2>Instructor GPA Breakdown</h2>
          {course.instructors && course.instructors.length > 0 ? (
            <>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="instructor" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis 
                      domain={[0, 4.0]}
                      label={{ value: 'GPA', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => value.toFixed(2)}
                      labelFormatter={(label) => `Instructor: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="gpa" fill="#2196f3" name="GPA" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="table-container">
                <h3>Instructor Details</h3>
                <table className="instructor-table">
                  <thead>
                    <tr>
                      <th>Instructor</th>
                      <th>GPA</th>
                      <th>Total Students</th>
                      <th>% A</th>
                      <th>% B</th>
                      <th>% C</th>
                      <th>% D</th>
                      <th>% F</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.instructors.map((instructor, index) => (
                      <tr key={index}>
                        <td>{instructor.Instructor || 'N/A'}</td>
                        <td className="gpa-cell">
                          {instructor.gpa !== null && instructor.gpa !== undefined 
                            ? parseFloat(instructor.gpa).toFixed(2) 
                            : 'N/A'}
                        </td>
                        <td>{instructor.Total_Students !== null && instructor.Total_Students !== undefined ? instructor.Total_Students : 'N/A'}</td>
                        <td>{instructor.Percentage_As !== null && instructor.Percentage_As !== undefined ? parseFloat(instructor.Percentage_As).toFixed(1) : 'N/A'}%</td>
                        <td>{instructor.Percentage_Bs !== null && instructor.Percentage_Bs !== undefined ? parseFloat(instructor.Percentage_Bs).toFixed(1) : 'N/A'}%</td>
                        <td>{instructor.Percentage_Cs !== null && instructor.Percentage_Cs !== undefined ? parseFloat(instructor.Percentage_Cs).toFixed(1) : 'N/A'}%</td>
                        <td>{instructor.Percentage_Ds !== null && instructor.Percentage_Ds !== undefined ? parseFloat(instructor.Percentage_Ds).toFixed(1) : 'N/A'}%</td>
                        <td>{instructor.Percentage_Fs !== null && instructor.Percentage_Fs !== undefined ? parseFloat(instructor.Percentage_Fs).toFixed(1) : 'N/A'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="no-data-message">No instructor data available for this course.</div>
          )}
        </section>

        {/* Prerequisites */}
        <section className="section">
          <h2>Prerequisites</h2>
          {course.prerequisites && course.prerequisites.length > 0 ? (
            <div className="prerequisite-container">
              {Object.entries(
                course.prerequisites.reduce((acc, prereq) => {
                  const groupId = prereq.requirement_group_id;
                  if (!acc[groupId]) acc[groupId] = [];
                  acc[groupId].push(prereq.prerequisite_course_code);
                  return acc;
                }, {})
              ).map(([groupId, courses], groupIndex, allGroups) => (
                <div key={groupId} className="prerequisite-group">
                  {courses.length > 1 ? (
                    <>
                      <h3>One of the following:</h3>
                      <p className="prerequisite-explanation">You must take at least one of these courses</p>
                    </>
                  ) : (
                    <>
                      <h3>Required:</h3>
                      <p className="prerequisite-explanation">You must take this course</p>
                    </>
                  )}
                  <div className="course-tags">
                    {courses.map((courseCode, idx) => (
                      <span key={idx} className="course-tag" onClick={() => navigate(`/course/${courseCode}`)}>
                        {courseCode}
                      </span>
                    ))}
                  </div>
                  {groupIndex < allGroups.length - 1 && (
                    <div className="prerequisite-separator">
                      <span className="and-text">AND</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">No prerequisites required for this course.</div>
          )}
        </section>

        {/* Concurrent Enrollment */}
        <section className="section">
          <h2>Concurrent Enrollment</h2>
          {course.concurrentEnrollment && course.concurrentEnrollment.length > 0 ? (
            <div className="concurrent-container">
              <p className="info-text">This course can be taken concurrently with:</p>
              <div className="course-tags">
                {course.concurrentEnrollment.map((item, index) => (
                  <span 
                    key={index} 
                    className="course-tag" 
                    onClick={() => navigate(`/course/${item.concurrent_enrollment_course_code}`)}
                  >
                    {item.concurrent_enrollment_course_code}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data-message">No concurrent enrollment options available for this course.</div>
          )}
        </section>

        {/* Add to Semester */}
        <section className="section">
          <h2>Add to Semester</h2>
          <form onSubmit={handleAddToSemester} className="add-semester-form">
            <div className="form-group">
              <label htmlFor="net_id">Net ID:</label>
              <input
                type="text"
                id="net_id"
                value={net_id}
                onChange={(e) => setNet_id(e.target.value)}
                required
                placeholder="Enter your Net ID (e.g., lgarg10)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="semester">Semester:</label>
              <select
                id="semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="year">Year:</label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                min="2020"
                max="2030"
              />
            </div>
            
            <button 
              type="submit" 
              className="add-course-btn"
              disabled={addingCourse}
            >
              {addingCourse ? 'Adding...' : 'Add Course to Semester'}
            </button>
            
            {addMessage && (
              <div className={`message ${addMessage.type === 'success' ? 'success-message' : 'error-message'}`}>
                {addMessage.text}
                {addMessage.showPlannerLink && net_id && (
                  <div style={{ marginTop: '12px' }}>
                    <button 
                      onClick={() => navigate(`/planner/${net_id}`)}
                      className="view-planner-link"
                    >
                      View My Planner →
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

export default CourseDetail;

