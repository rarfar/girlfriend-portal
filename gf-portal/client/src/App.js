import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import './App.css';

// ------------- LANDING PAGE COMPONENT -------------
/*
  The first screen the user sees.
  Welcome messsage and has a button to navigate to the login page.
*/
function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Equivalent to CodePen's JS, using #container as the flower canvas
    gsap.set("#container", { perspective: 600 });

    const total = 30;
    const warp = document.getElementById("container");
    const w = window.innerWidth;
    const h = window.innerHeight;
    let divs = [];

    function R(min, max) {
      return min + Math.random() * (max - min);
    }

    function animm(elm) {
      gsap.to(elm, {
      duration: R(6, 15),
      y: h + 100,
      ease: "none",        // Linear ease
      repeat: -1,
      delay: -15,
    });
    gsap.to(elm, {
      duration: R(4, 8),
      x: "+=100",
      rotationZ: R(0, 180),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    gsap.to(elm, {
      duration: R(2, 8),
      rotationX: R(0, 360),
      rotationY: R(0, 360),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: -5,
      });
    }

    // Clean up old divs if any
    if (warp) {
      while (warp.firstChild) {
        warp.removeChild(warp.firstChild);
      }
    }

    for (let i = 0; i < total; i++) {
      const Div = document.createElement("div");
      Div.className = "dot";
      // Use local rose.png or keep the external URL:
      Div.style.backgroundImage = "url('/png/petal3.png')"; // or the direct link
      gsap.set(Div, {
        x: R(0, w),
        y: R(-200, -150),
        z: R(-200, 200),
      });
      warp.appendChild(Div);
      divs.push(Div);
      animm(Div);
    }

    // Clean up function to remove the falling roses on unmount
    return () => {
      divs.forEach(div => {
        if (div.parentNode) div.parentNode.removeChild(div);
      });
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "lavender",
      }}
    >
      <div id="container" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 0 }} />
      <div style={{ zIndex: 1, position: "relative" }}>
        <h1 style={{ marginBottom: 24, textAlign: "center" }}>💖 Welcome, Stink! 💖</h1>
        <p style={{ fontSize: 20, marginBottom: 40, textAlign: "center" }}>
          I made this little portal for you, my love. <br />
          Meant to enhance and refine stink to stink communication, please use this portal <br />
          to air out any grievances, thoughts or feelings you have in your little head. <br />
          Je t&apos;aime beaucoup!
        </p>
        <button
          onClick={() => navigate("/login")}
          className="lavender-btn"
        >
          Log In
        </button>
      </div>
    </div>
  );
}

//export default Landing;

// ------------- LOGIN PAGE COMPONENT -------------
/*
  The login form.
  Accepts username and password, sends them to the backend.
  On success, saves the token and fetches grievances, then navigates to the portal.
*/
function Login({ setToken, fetchGrievances }) {
  const [username, setUsername] = useState("");         // Username input state
  const [password, setPassword] = useState("");         // Password input state
  const [loginError, setLoginError] = useState("");     // For displaying login errors
  const navigate = useNavigate();                       // For redirecting after login

  // Handles the login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(""); // Reset error message

    try {
      // Send POST request to backend for login
      const res = await axios.post("http://localhost:6969/api/login", {
        username,
        password,
      });
      // If successful, save token and fetch grievances
      setToken(res.data.token);
      setUsername("");
      setPassword("");
      fetchGrievances(res.data.token); // Load grievances for user right after login
      navigate("/portal");             // Redirect to portal page
    } catch (err) {
      // If login fails, show error message
      setLoginError("Login failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", textAlign: "center" }}>
      <h2>Login to Grievance Portal</h2>
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
      {/* Show login errors if any */}
      {loginError && <div style={{ color: "red", marginTop: 10 }}>{loginError}</div>}
    </div>
  );
}

// ------------- MAIN PORTAL COMPONENT (AFTER LOGIN) -------------
/*
  The main page shown after a successful login.
  Allows users to submit grievances and see their previous submissions.
*/
function Portal({
  token,
  grievances,
  setToken,
  fetchGrievances,
  content,
  setContent,
  handleSubmit,
  submitMsg,
  handleLogout
}) {
  const navigate = useNavigate(); // <--- get the navigate function

  if (!token) {
    // If not logged in, do not show this page.
    return <div style={{ textAlign: "center", marginTop: "5rem" }}>Please log in first.</div>;
  }

  // New handler to log out and redirect
  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate("/"); // Go to landing page
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", textAlign: "center" }}>
      <h2>Welcome to the Grievance Portal!</h2>
      <button onClick={handleLogoutAndRedirect} style={{ float: "right" }}>Logout</button>
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
      <button
        onClick={() => navigate("/grievances")}
        style={{
        marginTop: 40,
        width: "100%",
        padding: 12,
        background: "#1976d2",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 18,
        cursor: "pointer",
        }}
      >
      View Previous Grievances
      </button>
    </div>
  );
}

// ----------- Grievances View Page -----------
function GrievancesView({ token, grievances, handleLogout }) {
  const navigate = useNavigate();

  // If not logged in, block access
  if (!token) {
    return <div style={{ textAlign: "center", marginTop: "5rem" }}>Please log in first.</div>;
  }

  // For logging out and redirecting to landing
  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate("/");
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", textAlign: "center" }}>
      <h2>Your Previous Grievances</h2>
      <button onClick={() => navigate("/portal")} style={{ float: "left" }}>
        ← Back
      </button>
      <button onClick={handleLogoutAndRedirect} style={{ float: "right" }}>
        Logout
      </button>
      <ul style={{ textAlign: "left", marginTop: 60 }}>
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

// ------------- MAIN APP COMPONENT (WRAPPER + ROUTES) -------------
/*
  This is the app's main component.
  Handles all state for login, grievance data, and routes between screens.
*/
function App() {
  // ===== Shared state =====
  const [token, setToken] = useState("");               // JWT token for logged-in user
  const [grievances, setGrievances] = useState([]);     // List of grievances fetched from backend
  const [content, setContent] = useState("");           // Text area for new grievance
  const [submitMsg, setSubmitMsg] = useState("");       // Feedback message after submit

  // Fetch grievances from backend for the logged-in user
  const fetchGrievances = async (jwt) => {
    try {
      const res = await axios.get("http://localhost:6969/api/grievances", {
        headers: { Authorization: "Bearer " + (jwt || token) },
      });
      setGrievances(res.data); // Save grievances in state
    } catch {
      setGrievances([]); // On error, show empty list
    }
  };

  // Handle grievance submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg(""); // Clear old message
    try {
      await axios.post(
        "http://localhost:6969/api/grievances",
        { content },
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setSubmitMsg("Grievance submitted!"); // Success message
      setContent(""); // Clear input
      fetchGrievances(); // Refresh the list
    } catch (err) {
      setSubmitMsg("Failed to submit: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  // Handle logging out (clear all user-related state)
  const handleLogout = () => {
    setToken("");
    setGrievances([]);
    setSubmitMsg("");
  };

  // Main router, handles navigation between landing, login, and portal pages
  return (
    <Router>
      <Routes>
        {/* Landing page (default route) */}
        <Route path="/" element={<Landing />} />

        {/* Login page */}
        <Route path="/login" element={
          <Login setToken={setToken} fetchGrievances={fetchGrievances} />
        } />
        {/* Grievance View page*/}
        <Route path="/grievances" element={
          <GrievancesView token={token} grievances={grievances} handleLogout={handleLogout} />
        } />

        {/* Main portal page (only accessible after login) */}
        <Route path="/portal" element={
          <Portal
            token={token}
            grievances={grievances}
            setToken={setToken}
            fetchGrievances={fetchGrievances}
            content={content}
            setContent={setContent}
            handleSubmit={handleSubmit}
            submitMsg={submitMsg}
            handleLogout={handleLogout}
          />
        } />
      </Routes>
    </Router>
  );
}

export default App;
