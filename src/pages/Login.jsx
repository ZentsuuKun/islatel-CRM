import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = auth.login(passcode.trim());
    if (res.success) {
      setError('');
      navigate('/');
    } else {
      setError('Invalid passcode');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">Quick Login</h1>
          <p className="text-secondary mb-0">Enter your passcode to sign in as staff or admin.</p>
        </div>
      </div>

      <Card className="glass-card p-4" style={{ maxWidth: 420 }}>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label className="text-secondary small">Passcode</Form.Label>
            <Form.Control type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} className="filter-control w-100" />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button type="submit" variant="primary">Sign In</Button>
          </div>
        </Form>
        <div className="small text-muted mt-3">Hint: admin passcode is <strong>admin123</strong>, staff passcode is <strong>staff123</strong> (for quick demo).</div>
      </Card>
    </div>
  );
};

export default Login;
