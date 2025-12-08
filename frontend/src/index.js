import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import CourseDetail from './CourseDetail';
import UserPlanner from './UserPlanner';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/course/:courseCode" element={<CourseDetail />} />
        <Route path="/planner/:net_id" element={<UserPlanner />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

