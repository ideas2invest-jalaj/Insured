'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import styles from '../../new/page.module.css';

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

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const data = await api.get(`/policies/${params.id}`);
      const policy = data.policy;
      setForm({
        client_name: policy.client_name,
        insurance_company: policy.insurance_company,
        policy_number: policy.policy_number,
        premium_amount: policy.premium_amount,
        due_date: policy.due_date,
        issuance_date: policy.issuance_date,
        phone: policy.phone || '',
        email: policy.email || '',
        status: policy.status
      });
    } catch (err) {
      setError('Failed to load policy');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        premium_amount: parseFloat(form.premium_amount)
      };

      await api.put(`/policies/${params.id}`, payload);
      router.push('/policies');
    } catch (err) {
      setError(err.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.form} style={{ textAlign: 'center', padding: '60px' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Edit Policy</h1>
        <p>Update policy details</p>
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
            />
          </div>

          <div className={styles.field}>
            <label>Premium Amount *</label>
            <input
              type="number"
              name="premium_amount"
              value={form.premium_amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
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
            />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
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
          <button type="submit" disabled={saving} className={styles.submitBtn}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
