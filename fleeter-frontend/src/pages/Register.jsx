import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "driver", // Default role
  });
  const [message, setMessage] = useState("");

  // 1. Add a new state variable to track if the request succeeded
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true); // 2. Set success to true
        setMessage("Registration successful! You can now log in.");
      } else {
        setIsSuccess(false); // 3. Set success to false
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Registration failed", error);
      setIsSuccess(false);
      setMessage("Network error. Is the backend running?");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>Create an Account</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="email"
          name="email"
          placeholder="Email address"
          onChange={handleChange}
          required
          style={{ padding: "10px" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Secure password"
          onChange={handleChange}
          required
          style={{ padding: "10px" }}
        />
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={{ padding: "10px" }}
        >
          <option value="driver">Driver</option>
          <option value="owner">Fleet Owner</option>
        </select>
        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#007BFF",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </form>
      {/* 4. Use the isSuccess state here instead of response */}
      {message && (
        <p style={{ marginTop: "15px", color: isSuccess ? "green" : "red" }}>
          {message}
        </p>
      )}
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Already have an account?</p>
        <Link
          to="/login"
          style={{
            color: "#007BFF",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Login Here
        </Link>
      </div>
    </div>
  );
}

export default Register;
