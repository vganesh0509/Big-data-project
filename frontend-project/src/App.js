import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WorkflowEditor from "./components/WorkflowEditor";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    setUserRole(localStorage.getItem("role"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    setUserRole(null);
  };

  return (
    <Router>
      <div style={{ textAlign: "center", padding: "20px" }}>
        <h1>BigDataTutor Workflow Editor</h1>

        {/* Show Logout Button if User is Logged In */}
        {userRole && (
          <button onClick={handleLogout} style={{ marginBottom: "10px" }}>🚪 Logout</button>
        )}

        <Routes>
          {/* ✅ Redirect logged-in users to Workflow Editor, else Login */}
          <Route path="/" element={userRole ? <Navigate to="/workflow-editor" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ Both Students & Instructors Can Edit Workflows */}
          <Route 
            path="/workflow-editor" 
            element={userRole ? <WorkflowEditor userRole={userRole} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
