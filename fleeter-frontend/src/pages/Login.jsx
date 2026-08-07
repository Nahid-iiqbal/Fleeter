import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // 1. Save the token and user details to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userId', data.user_id);
        
        // 2. Route the user based on their role
        if (data.role === 'owner' || data.role === 'admin') {
          navigate('/owner-dashboard');
        } else if (data.role === 'driver') {
          navigate('/driver-portal');
        } else {
          setError('Unrecognized user role.');
        }
      } else {
        // Display backend error (e.g., "User not found" or "Invalid password")
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login request failed', err);
      setError('Network error. Is the backend running?');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Login to Fleeter</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          name="email" 
          placeholder="Email address" 
          onChange={handleChange} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      
      {error && <p style={{ marginTop: '15px', color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Don't have an account?</p>
        <Link to="/register" style={{ color: '#007BFF', textDecoration: 'none', fontWeight: 'bold' }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default Login;