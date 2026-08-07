import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // The import causing the warning

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'driver'
  });
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false); 
  
  // 1. Initialize the navigate function
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
        setMessage('Registration successful! Redirecting to login...');
        
        // 2. Redirect the user to the login page after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 1500); 

      } else {
        setIsSuccess(false);
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Registration failed', error);
      setIsSuccess(false);
      setMessage('Network error. Is the backend running?');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Create an Account</h2>
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
          placeholder="Secure password" 
          onChange={handleChange} 
          required 
          style={{ padding: '10px' }}
        />
        <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '10px' }}>
          <option value="driver">Driver</option>
          <option value="owner">Fleet Owner</option>
        </select>
        <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}>
          Sign Up
        </button>
      </form>
      {message && <p style={{ marginTop: '15px', color: isSuccess ? 'green' : 'red' }}>{message}</p>}
    </div>
  );
}

export default Register;