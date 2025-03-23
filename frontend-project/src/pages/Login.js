import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

const Login = ({ setUserRole }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await loginUser({ username, password });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      setUserRole(response.data.role);
      alert("✅ Login Successful!");

      // ✅ Redirect based on role
      if (response.data.role !== "instructor") {
        navigate("/workflow-editor"); // Redirect Instructors
      } else {
        navigate("/view-workflows"); // Redirect Students
      }
    } catch (error) {
      alert("❌ Login Failed! Check credentials.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      <p>Don't have an account? <a href="/register">Register</a></p>
    </div>
  );
};

export default Login;
