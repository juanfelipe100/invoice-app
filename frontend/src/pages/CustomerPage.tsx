import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';

type Step = 'terms' | 'upload' | 'success';

interface InvoiceData {
  company: string | null;
  consumption: string | null;
  cost: string | null;
}

const TERMS_TEXT = `TÉRMINOS Y CONDICIONES DE USO

1. ACEPTACIÓN
Al aceptar estos términos, usted autoriza el procesamiento de sus datos y la factura proporcionada con fines de análisis y gestión energética.

2. DATOS PERSONALES
La información recopilada (nombre, email, datos de factura) será tratada conforme a la normativa de protección de datos vigente. No compartiremos su información con terceros sin su consentimiento.

3. USO DE LA INFORMACIÓN
Los datos de consumo y costo extraídos de su factura se utilizarán exclusivamente para brindarle un mejor servicio y análisis personalizado.

4. SEGURIDAD
Implementamos medidas técnicas y organizativas para proteger su información contra acceso no autorizado, pérdida o divulgación.

5. DERECHOS DEL USUARIO
Tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos personales en cualquier momento contactándonos.

6. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos con previo aviso. El uso continuado del servicio implica la aceptación de los cambios.`;

export default function CustomerPage() {
  const [step, setStep] = useState<Step>('terms');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [company, setCompany] = useState('');
  const [consumption, setConsumption] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Accept terms
  async function handleTermsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim()) {
      setError('Por favor ingresa tu nombre y email.');
      return;
    }
    if (!accepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar');
      setSubmissionId(data.submissionId);
      setStep('upload');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Upload invoice
  function handleFileDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Por favor selecciona una factura.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('invoice', file);
      formData.append('company', company.trim());
      formData.append('consumption', consumption.trim());
      formData.append('cost', cost.trim());
      const res = await fetch(`/api/upload/${submissionId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar la factura');
      setInvoiceData(data.data);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  let card: React.ReactNode;

  if (step === 'terms') {
    card = (
      <div className="card">
        <div className="step-indicator">
          <span className="step active">1</span>
          <span className="step-line" />
          <span className="step">2</span>
          <span className="step-line" />
          <span className="step">3</span>
        </div>
        <h1 className="card-title">
          Sube tu factura
          <span className="card-title-accent">Comienza a ahorrar ahora</span>
        </h1>
        <p className="card-subtitle">Registra tu factura y los datos de consumo.</p>

        <form onSubmit={handleTermsSubmit} className="form">
          <div className="field">
            <label htmlFor="name">Nombre completo</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <div className="terms-box">
            <pre className="terms-text">{TERMS_TEXT}</pre>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>He leído y acepto los términos y condiciones</span>
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Continuar →'}
          </button>
        </form>
      </div>
    );
  } else if (step === 'upload') {
    card = (
      <div className="card">
        <div className="step-indicator">
          <span className="step done">✓</span>
          <span className="step-line active" />
          <span className="step active">2</span>
          <span className="step-line" />
          <span className="step">3</span>
        </div>
        <h1 className="card-title">Datos de la factura</h1>
        <p className="card-subtitle">
          Hola <strong>{name}</strong>, adjunta tu factura e ingresa los datos.
        </p>

        <form onSubmit={handleUpload} className="form">
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div className="file-info">
                <span className="file-icon">📄</span>
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <div className="drop-hint">
                <span className="drop-icon">☁️</span>
                <span>Arrastra tu factura aquí o <u>haz clic para seleccionar</u></span>
                <span className="drop-types">PDF, JPG, PNG — máx. 20 MB</span>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="company">Empresa emisora</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Ej: Empresas Públicas de Medellín"
            />
          </div>
          <div className="field">
            <label htmlFor="consumption">Consumo</label>
            <input
              id="consumption"
              type="text"
              value={consumption}
              onChange={(e) => setConsumption(e.target.value)}
              placeholder="Ej: 350 kWh"
            />
          </div>
          <div className="field">
            <label htmlFor="cost">Costo total</label>
            <input
              id="cost"
              type="text"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="Ej: $120.000"
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !file}>
            {loading ? 'Enviando...' : 'Enviar factura →'}
          </button>
        </form>
      </div>
    );
  } else {
    card = (
      <div className="card">
        <div className="step-indicator">
          <span className="step done">✓</span>
          <span className="step-line active" />
          <span className="step done">✓</span>
          <span className="step-line active" />
          <span className="step active">3</span>
        </div>
        <div className="success-icon">✅</div>
        <h1 className="card-title">¡Factura enviada!</h1>
        <p className="card-subtitle">Registramos los siguientes datos:</p>

        <div className="extracted-data">
          <div className="data-row">
            <span className="data-label">🏢 Empresa</span>
            <span className="data-value">{invoiceData?.company || '—'}</span>
          </div>
          <div className="data-row">
            <span className="data-label">⚡ Consumo</span>
            <span className="data-value">{invoiceData?.consumption || '—'}</span>
          </div>
          <div className="data-row">
            <span className="data-label">💰 Costo total</span>
            <span className="data-value highlight">{invoiceData?.cost || '—'}</span>
          </div>
        </div>

        <p className="success-note">
          Nos pondremos en contacto a <strong>{email}</strong> con más información.
        </p>

        <button
          className="btn-secondary"
          onClick={() => {
            setStep('terms');
            setFile(null);
            setCompany('');
            setConsumption('');
            setCost('');
            setInvoiceData(null);
            setAccepted(false);
            setName('');
            setEmail('');
            setSubmissionId(null);
          }}
        >
          Enviar otra factura
        </button>
      </div>
    );
  }

  return (
    <div className="customer-layout">
      <div className="customer-illustration">
        <img src="/robot.png" alt="Robot ahorro" />
      </div>
      <div className="customer-form">
        {card}
      </div>
    </div>
  );
}
