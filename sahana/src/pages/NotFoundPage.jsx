import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-4 fw-bold">404</h1>
      <p className="lead text-muted">The page you requested is not available.</p>
      <Link className="btn btn-primary" to="/">Back home</Link>
    </div>
  );
}
