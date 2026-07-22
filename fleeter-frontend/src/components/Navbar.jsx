import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ role }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#0f172a', color: '#fff' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '1px' }}>
        FLEETER <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>| {role?.toUpperCase()} PORTAL</span>
      </div>
      <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
        Logout
      </button>
    </nav>
  );
}