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
        <h1 style={{ marginBottom: 24, textAlign: "center", color: "#222" }}>💖 Welcome, Stink! 💖</h1>
        <p style={{ fontSize: 20, marginBottom: 40, textAlign: "center", lineHeight: 1.75, color: "#222" }}>
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  // Handles the login form submission
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
      fetchGrievances(res.data.token);
      navigate("/portal");
    } catch (err) {
      setLoginError("Login failed: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#7c60a1", // darker lavender
        flexDirection: "column"
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          boxShadow: "0 8px 32px #0002",
          padding: "2.5rem 2.5rem 2rem 2.5rem",
          maxWidth: 380,
          width: "100%",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <h2 style={{
          color: "#7c60a1",
          marginBottom: 20,
          fontWeight: 700,
          fontSize: 28,
        }}>
          Babu Authenticator
        </h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
            style={{
              marginBottom: 12,
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d1a8ec",
              fontSize: 18,
              outline: "none",
              background: "#f3eafe"
            }}
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{
              marginBottom: 18,
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d1a8ec",
              fontSize: 18,
              outline: "none",
              background: "#f3eafe"
            }}
          />
          <br />
          <button
            type="submit"
            className="lavender-btn"
            style={{
              width: "100%",
              margin: "0 auto",
              marginTop: 8,
              fontSize: 18,
            }}
          >
            Log In
          </button>
        </form>
        {loginError && <div style={{ color: "#b71c1c", marginTop: 14 }}>{loginError}</div>}
      </div>
    </div>
  );
}

const MOOD_OPTIONS = [
  { label: "Happy", value: "happy", img: "/png/cool.png" },
  { label: "Sad", value: "sad", img: "/png/crying.png" },
  { label: "Angry", value: "angry", img: "/png/grumpy.png" },
  { label: "Confused", value: "confused", img: "/png/too_bright.png" },
];
// ------------- MAIN PORTAL COMPONENT (AFTER LOGIN) -------------
/*
  The main page shown after a successful login.
  Allows users to submit grievances and see their previous submissions.
*/
function Portal({
  token,
  grievances,
  fetchGrievances,
  handleLogout
}) {
  const navigate = useNavigate();

  // Form fields state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState(3);
  const [mood, setMood] = useState(MOOD_OPTIONS[0].value);

  // Feedback to the user
  const [submitMsg, setSubmitMsg] = useState("");

  if (!token) {
    return <div style={{ textAlign: "center", marginTop: "5rem" }}>Please log in first.</div>;
  }

  // Handles logging out and redirects to home
  const handleLogoutAndRedirect = () => {
    handleLogout();
    navigate("/");
  };

  // Submit the grievance to the backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    try {
      await axios.post(
        "http://localhost:6969/api/grievances",
        { title, description, severity, mood },
        { headers: { Authorization: "Bearer " + token } }
      );
      setSubmitMsg("Grievance submitted! 🐾");
      setTitle("");
      setDescription("");
      setSeverity(3);
      setMood(MOOD_OPTIONS[0].value);
      fetchGrievances();
    } catch (err) {
      setSubmitMsg("Failed to submit: " + (err.response?.data?.error || "Unknown error"));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#b57edc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 28,
          boxShadow: "0 8px 32px #0002",
          padding: "2.5rem 2.5rem 2rem 2.5rem",
          maxWidth: 430,
          width: "100%",
          textAlign: "center",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>💌</div>
        <h2 style={{
          color: "#b57edc",
          marginBottom: 24,
          fontWeight: 700,
          fontSize: 26
        }}>
          Submit a Grievance
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <input
            type="text"
            placeholder="Title"
            value={title}
            required
            onChange={e => setTitle(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
              border: "1.5px solid #d1a8ec",
              fontSize: 18,
              background: "#f3eafe"
            }}
          />

          {/* Description */}
          <textarea
            placeholder="tell me about it stink..."
            value={description}
            required
            onChange={e => setDescription(e.target.value)}
            style={{
              width: "100%",
              minHeight: 90,
              borderRadius: 14,
              border: "1.5px solid #d1a8ec",
              fontSize: 18,
              padding: 14,
              marginBottom: 12,
              background: "#f3eafe",
              outline: "none"
            }}
          />

          {/* Severity */}
          <label style={{ display: "block", margin: "18px 0 10px 0", fontWeight: 500 }}>
            Severity:
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={e => setSeverity(Number(e.target.value))}
              style={{
                marginLeft: 12,
                verticalAlign: "middle"
              }}
            />
            <span style={{ marginLeft: 8 }}>{severity}</span>
          </label>

          {/* Mood with cat PNG preview */}
          <label style={{ display: "block", margin: "18px 0 16px 0", fontWeight: 500 }}>
            Mood:
            <select
              value={mood}
              onChange={e => setMood(e.target.value)}
              style={{
                marginLeft: 10,
                padding: 8,
                borderRadius: 8,
                fontSize: 16,
                background: "#f3eafe",
                border: "1.5px solid #d1a8ec",
              }}
            >
              {MOOD_OPTIONS.map(opt => (
                <option value={opt.value} key={opt.value}>{opt.label}</option>
              ))}
            </select>
            {/* Show cat image preview */}
            <img
              src={MOOD_OPTIONS.find(opt => opt.value === mood).img}
              alt={mood}
              style={{
                width: 40,
                height: 40,
                verticalAlign: "middle",
                marginLeft: 12,
                borderRadius: "50%",
                border: "2px solid #b57edc"
              }}
            />
          </label>

          {/* Submit button */}
          <button
            type="submit"
            className="lavender-btn"
            style={{
              width: "100%",
              margin: "0 auto",
              fontSize: 18,
              fontWeight: 700
            }}
          >
            Submit Grievance
          </button>
        </form>
        {/* Feedback message */}
        {submitMsg && <div style={{ color: "#2e7d32", marginTop: 14 }}>{submitMsg}</div>}
        {/* Optionally add navigation buttons below */}
        <button
          onClick={() => navigate("/grievances")}
          style={{
            marginTop: 24,
            width: "100%",
            padding: 12,
            background: "#a98fdc",
            color: "#222",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          📖 View Previous Grievances
        </button>
        <button
          onClick={handleLogoutAndRedirect}
          style={{
            marginTop: 18,
            width: "100%",
            padding: 10,
            background: "#f3eafe",
            color: "#a98fdc",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          🚪 Log Out
        </button>
      </div>
    </div>
  );
}

// ----------- Grievances View Page -----------
function GrievancesView({ token, grievances, fetchGrievances, handleLogout }) {
  const navigate = useNavigate();
  const [replyInputs, setReplyInputs] = useState({}); // for holding reply text by grievance ID
  const [submitting, setSubmitting] = useState({});   // for showing loader or disabling

  if (!token) {
    return <div style={{ textAlign: "center", marginTop: "5rem" }}>Please log in first.</div>;
  }

  // Add a reply to a grievance
  const handleReply = async (grievanceId) => {
    const reply = replyInputs[grievanceId];
    if (!reply) return;
    setSubmitting((prev) => ({ ...prev, [grievanceId]: true }));
    try {
      await axios.post(
        `http://localhost:6969/api/grievances/${grievanceId}/reply`,
        { reply, author: "Admin" }, // or your name, or the logged-in user
        { headers: { Authorization: "Bearer " + token } }
      );
      setReplyInputs((prev) => ({ ...prev, [grievanceId]: "" }));
      fetchGrievances(); // reload grievances with new replies
    } catch (err) {
      alert("Failed to add reply: " + (err.response?.data?.error || "Unknown error"));
    }
    setSubmitting((prev) => ({ ...prev, [grievanceId]: false }));
  };

  const handleInputChange = (grievanceId, value) => {
    setReplyInputs((prev) => ({ ...prev, [grievanceId]: value }));
  };

  // Helper: get mood PNG for value
  const moodImg = (mood) => MOOD_OPTIONS.find(opt => opt.value === mood)?.img;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3eafe",
        padding: "30px 0",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={() => navigate("/portal")} style={{ fontSize: 18, background: "#b57edc", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>← Back</button>
          <button onClick={handleLogout} style={{ fontSize: 18, background: "#f3eafe", color: "#b57edc", border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}>Logout</button>
        </div>
        <h2 style={{ color: "#b57edc", textAlign: "center", marginBottom: 32 }}>Your Previous Grievances</h2>
        {grievances.length === 0 && <div style={{ textAlign: "center", color: "#aaa" }}>No grievances yet!</div>}
        {grievances.map((g, i) => (
          <div key={g.id || i}
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 2px 8px #b57edc44",
              marginBottom: 36,
              padding: 22,
              position: "relative"
            }}>
            {/* Mood cat */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <img src={moodImg(g.mood)} alt={g.mood} style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #b57edc", marginRight: 14 }} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#7c60a1" }}>{g.title || <i>(No title)</i>}</div>
                <div style={{ color: "#555", marginTop: 2 }}>{new Date(g.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: 17, marginBottom: 8 }}>{g.description}</div>
            <div style={{ color: "#7c60a1", fontSize: 15, marginBottom: 12 }}>Severity: {g.severity} / 5</div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#b57edc" }}>Replies:</strong>
              <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
                {g.replies && g.replies.length === 0 && (
                  <li style={{ color: "#aaa" }}><i>No replies yet.</i></li>
                )}
                {g.replies && g.replies.map((reply, ri) => (
                  <li key={ri}
                      style={{
                        background: "#f3eafe",
                        borderRadius: 10,
                        padding: "10px 12px",
                        marginBottom: 7,
                        color: "#333",
                        fontSize: 15,
                        position: "relative"
                      }}>
                    <span style={{ fontWeight: 500, color: "#b57edc" }}>{reply.author}:</span>
                    {" "}
                    {reply.reply}
                    <span style={{ fontSize: 12, color: "#999", float: "right" }}>
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Reply input */}
            <form
              style={{ marginTop: 10, display: "flex", gap: 8 }}
              onSubmit={e => {
                e.preventDefault();
                handleReply(g.id);
              }}
            >
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyInputs[g.id] || ""}
                onChange={e => handleInputChange(g.id, e.target.value)}
                style={{
                  flex: 1,
                  borderRadius: 8,
                  border: "1.5px solid #d1a8ec",
                  padding: "9px 12px",
                  fontSize: 15,
                  background: "#f3eafe"
                }}
                disabled={submitting[g.id]}
              />
              <button
                type="submit"
                style={{
                  background: "#b57edc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "9px 22px",
                  cursor: "pointer"
                }}
                disabled={submitting[g.id] || !(replyInputs[g.id] || "").trim()}
              >
                {submitting[g.id] ? "Sending..." : "Reply"}
              </button>
            </form>
          </div>
        ))}
      </div>
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
