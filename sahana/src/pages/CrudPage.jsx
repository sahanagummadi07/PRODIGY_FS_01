import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const defaultForm = {
  title: '',
  description: '',
  status: 'draft'
};

export default function CrudPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = async () => {
    try {
      const response = await api.get('/items');
      setItems(response.data.items ?? []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      if (editingId) {
        const response = await api.put(`/items/${editingId}`, form);
        setItems((current) => current.map((item) => (item.id === editingId ? response.data.item : item)));
      } else {
        const response = await api.post('/items', form);
        setItems((current) => [response.data.item, ...current]);
      }

      setForm(defaultForm);
      setEditingId(null);
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to save item.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/items/${id}`);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete item.');
    }
  };

  const handleEdit = (item) => {
    setForm({ title: item.title, description: item.description, status: item.status });
    setEditingId(item.id);
  };

  const itemCount = useMemo(() => items.length, [items]);

  return (
    <div className="row g-4">
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <h3 className="fw-bold">{editingId ? 'Update item' : 'Create item'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input className="form-control" value={form.title} onChange={(event) => handleChange('title', event.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="4" value={form.description} onChange={(event) => handleChange('description', event.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {error ? <div className="alert alert-danger">{error}</div> : null}
              <div className="d-flex gap-2">
                <button className="btn btn-primary" type="submit">{editingId ? 'Update' : 'Create'}</button>
                {editingId ? (
                  <button className="btn btn-outline-secondary" type="button" onClick={() => { setEditingId(null); setForm(defaultForm); }}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="col-lg-7">
        <div className="card border-0 shadow-sm rounded-4 h-100">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="fw-bold mb-0">Items</h3>
              <span className="badge text-bg-dark">{itemCount} records</span>
            </div>

            {loading ? <div className="text-muted">Loading items…</div> : null}

            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.description}</td>
                      <td>
                        <span className="badge text-bg-light text-dark">{item.status}</span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(item)}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
