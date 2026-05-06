'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';

const INDIAN_INSURANCE_COMPANIES = [
  'HDFC Ergo',
  'Niva Bupa',
  'Manipal Cigna',
  'ICICI Lombard',
  'Care Health',
  'Tata AIG',
  'Life Insurance Corporation (LIC)',
  'HDFC Life Insurance',
  'ICICI Prudential Life Insurance',
  'SBI Life Insurance',
  'Max Life Insurance',
  'Bajaj Allianz Life Insurance',
  'Kotak Mahindra Life Insurance',
  'Aditya Birla Sun Life Insurance',
  'Tata AIA Life Insurance',
  'PNB MetLife India Insurance',
  'Aviva Life Insurance',
  'Reliance Nippon Life Insurance',
  'Ageas Federal Life Insurance',
  'Canara HSBC Life Insurance',
  'Shriram Life Insurance',
  'Star Union Dai-ichi Life Insurance',
  'Bharti AXA Life Insurance',
  'Future Generali India Life Insurance',
  'IDBI Federal Life Insurance',
  'Aegon Life Insurance',
  'Other'
];

const STATUS_OPTIONS = ['Pending', 'Paid', 'Overdue', 'Grace Period', 'Lapsed'];

export default function NewPolicyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client_name: '',
    insurance_company: '',
    policy_number: '',
    premium_amount: '',
    due_date: '',
    issuance_date: '',
    phone: '',
    email: '',
    status: 'Pending'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...form,
        premium_amount: parseFloat(form.premium_amount)
      };

      await api.post('/policies', payload);
      router.push('/policies');
    } catch (err) {
      setError(err.message || 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Add New Policy</h1>
        <p>Enter policy details for a new client</p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Client Name *</label>
            <input
              type="text"
              name="client_name"
              value={form.client_name}
              onChange={handleChange}
              required
              placeholder="Enter client full name"
            />
          </div>

          <div className={styles.field}>
            <label>Insurance Company *</label>
            <select name="insurance_company" value={form.insurance_company} onChange={handleChange} required>
              <option value="">Select company</option>
              {INDIAN_INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label>Policy Number *</label>
            <input
              type="text"
              name="policy_number"
              value={form.policy_number}
              onChange={handleChange}
              required
              placeholder="e.g., LIC/2024/001"
            />
          </div>

          <div className={styles.field}>
            <label>Premium Amount (INR) *</label>
            <input
              type="number"
              name="premium_amount"
              value={form.premium_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className={styles.field}>
            <label>Due Date *</label>
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Issuance Date *</label>
            <input
              type="date"
              name="issuance_date"
              value={form.issuance_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="client@email.com"
            />
          </div>

          <div className={styles.field}>
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Creating...' : 'Create Policy'}
          </button>
        </div>
      </form>
    </div>
  );
}
