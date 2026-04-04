import { useEffect, useState } from 'react';

interface Submission {
  id: number;
  customer_name: string;
  customer_email: string;
  terms_accepted_at: string;
  file_name: string | null;
  company: string | null;
  consumption: string | null;
  cost: string | null;
  uploaded_at: string | null;
  created_at: string;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/submissions');
      if (!res.ok) throw new Error('Error al cargar datos');
      setSubmissions(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta entrada?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  }

  const pending = submissions.filter((s) => !s.uploaded_at).length;
  const processed = submissions.filter((s) => s.uploaded_at).length;

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Panel de Administración</h1>
          <p className="admin-subtitle">Facturas recibidas de clientes</p>
        </div>
        <button className="btn-refresh" onClick={load} disabled={loading}>
          {loading ? '⟳' : '↻ Actualizar'}
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-number">{submissions.length}</span>
          <span className="stat-label">Total registros</span>
        </div>
        <div className="stat-card green">
          <span className="stat-number">{processed}</span>
          <span className="stat-label">Procesadas</span>
        </div>
        <div className="stat-card yellow">
          <span className="stat-number">{pending}</span>
          <span className="stat-label">Sin factura</span>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {loading && submissions.length === 0 ? (
        <div className="loading-placeholder">Cargando...</div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <span>📭</span>
          <p>No hay registros aún.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Empresa (factura)</th>
                <th>Consumo</th>
                <th>Costo</th>
                <th>Archivo</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className={s.uploaded_at ? '' : 'row-pending'}>
                  <td className="td-id">{s.id}</td>
                  <td className="td-name">{s.customer_name}</td>
                  <td className="td-email">{s.customer_email}</td>
                  <td>{s.company || <span className="muted">—</span>}</td>
                  <td>{s.consumption || <span className="muted">—</span>}</td>
                  <td>
                    {s.cost ? (
                      <span className="cost-badge">{s.cost}</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    {s.file_name ? (
                      <span className="file-badge" title={s.file_name}>
                        📄 {s.file_name.length > 20
                          ? s.file_name.slice(0, 18) + '…'
                          : s.file_name}
                      </span>
                    ) : (
                      <span className="badge-pending">Pendiente</span>
                    )}
                  </td>
                  <td className="td-date">{formatDate(s.created_at)}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(s.id)}
                      disabled={deleting === s.id}
                    >
                      {deleting === s.id ? '...' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
