import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="row align-items-center g-4 py-4">
      <div className="col-lg-7">
        <div className="hero-card p-4 p-lg-5 rounded-4 shadow-sm">
          <span className="badge text-bg-primary mb-3">React + Express + Bootstrap</span>
          <h1 className="display-5 fw-bold">Modern authenticated frontend for your Node.js backend</h1>
          <p className="lead text-muted mt-3">
            Register, sign in, view a personalized dashboard, and manage your CRUD resource with session-aware API integration.
          </p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link className="btn btn-primary px-4" to="/register">Create account</Link>
            <Link className="btn btn-outline-primary px-4" to="/login">Login</Link>
          </div>
        </div>
      </div>
      <div className="col-lg-5">
        <div className="row g-3">
          <div className="col-12">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Session-based auth</h5>
                <p className="card-text text-muted">The React UI authenticates against your Express server using the same session cookies the backend already uses.</p>
              </div>
            </div>
          </div>
          <div className="col-12">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">Responsive layout</h5>
                <p className="card-text text-muted">Built with Bootstrap utilities so the interface stays clean on desktop, tablet, and mobile.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
