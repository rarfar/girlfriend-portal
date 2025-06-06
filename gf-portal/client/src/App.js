import React, { useState } from "react";
import axios from "axios";

function App() {
  // States for login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [loginError, setLoginError] = useState("");

  // States for grievance submission and list
  const [content, setContent] = useState("");
  const [grievances, setGrievances] = useState([]);
  const [submitMsg, setSubmitMsg] = useState("");

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await axios.post("http://localhost:6969/api/login", {
        username,
        password,
      });
      setToken(res.data.token);
      setUsername("");
      setPassword("");
      fetchGrievances(res.data.token); // fetch on login
    } catch (err) {
      setLoginError("Login failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // Fetch grievances
  const fetchGrievances = async (jwt) => {
    try {
      const res = await axios.get("http://localhost:6969/api/grievances", {
        headers: {
          Authorization: "Bearer " + (jwt || token),
        },
      });
      setGrievances(res.data);
    } catch (err) {
      setGrievances([]);
    }
  };

  // Handle grievance submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    try {
      await axios.post(
        "http://localhost:6969/api/grievances",
        { content },
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setSubmitMsg("Grievance submitted!");
      setContent("");
      fetchGrievances(); // refresh list
    } catch (err) {
      setSubmitMsg("Failed to submit: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // Handle logout
  const handleLogout = () => {
    setToken("");
    setGrievances([]);
    setSubmitMsg("");
  };

  // Show login form if not logged in
  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
        <h2>Girlfriend Grievance Portal</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginBottom: 10, width: "100%" }}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 10, width: "100%" }}
          />
          <br />
          <button type="submit" style={{ width: "100%" }}>Log In</button>
        </form>
        {loginError && <div style={{ color: "red", marginTop: 10 }}>{loginError}</div>}
      </div>
    );
  }

  // Show grievance submission and list if logged in
  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", textAlign: "center" }}>
      <h2>Welcome to the Grievance Portal!</h2>
      <button onClick={handleLogout} style={{ float: "right" }}>Logout</button>
      <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
        <textarea
          placeholder="What's your grievance?"
          value={content}
          required
          onChange={(e) => setContent(e.target.value)}
          style={{ width: "100%", minHeight: 60 }}
        />
        <br />
        <button type="submit" style={{ width: "100%", marginTop: 10 }}>Submit Grievance</button>
      </form>
      {submitMsg && <div style={{ color: "green", marginTop: 10 }}>{submitMsg}</div>}
      <h3 style={{ marginTop: 40 }}>Previous Grievances</h3>
      <ul style={{ textAlign: "left" }}>
        {grievances.length === 0 && <li>No grievances yet!</li>}
        {grievances.map((g, i) => (
          <li key={i}>
            <b>{g.created_at}:</b> {g.content}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
