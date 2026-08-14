import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [adminMessage, setAdminMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        if (user?.role === 'admin') {
          const response = await api.get('/admin');
          setAdminMessage(response.data.message);
        }
      } catch {
        setAdminMessage('Admin-only details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body">
            <h3 className="fw-bold">Profile</h3>
            <div className="mt-3">
              <div className="text-muted small text-uppercase">Name</div>
              <div className="fs-5 fw-semibold">{user?.name}</div>
            </div>
            <div className="mt-3">
              <div className="text-muted small text-uppercase">Email</div>
              <div className="fs-6">{user?.email}</div>
            </div>
            <div className="mt-3">
              <div className="text-muted small text-uppercase">Role</div>
              <span className="badge text-bg-primary">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-8">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body">
            <h3 className="fw-bold">Dashboard activity</h3>
            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <div className="stat-card p-3 rounded-4">
                  <div className="small text-muted">Authentication status</div>
                  <div className="fs-4 fw-bold">Connected</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="stat-card p-3 rounded-4">
                  <div className="small text-muted">Session source</div>
                  <div className="fs-4 fw-bold">Express Session</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="small text-muted text-uppercase">Backend response</div>
              <div className="fw-semibold">
                {loading ? 'Loading…' : adminMessage || 'Accessed the secure dashboard API successfully.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
