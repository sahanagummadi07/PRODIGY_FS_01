import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      await register(name, email, password, role);
      navigate('/dashboard', { replace: true });
    } catch (submissionError) {
      const errorList = submissionError.response?.data?.errors;
      if (errorList?.length) {
        setErrors(errorList.map((item) => item.msg));
      } else {
        setErrors([submissionError.response?.data?.message || 'Unable to register.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4 p-lg-5">
            <h2 className="fw-bold mb-3">Register</h2>
            <p className="text-muted">Create a new account and start interacting with your backend APIs.</p>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input className="form-control" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {errors.length ? (
                <div className="alert alert-danger">
                  <ul className="mb-0">
                    {errors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <button className="btn btn-primary w-100" disabled={loading}>
                {loading ? 'Creating account…' : 'Register'}
              </button>
            </form>
            <p className="mt-3 mb-0 text-center text-muted">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
