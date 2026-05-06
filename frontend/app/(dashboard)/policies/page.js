'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pendingRenewals: 0, paid: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    company: searchParams.get('company') || '',
    status: searchParams.get('filter') || '',
    due_date_from: '',
    due_date_to: ''
  });

  useEffect(() => {
    fetchStats();
    fetchPolicies();
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [filters, pagination.page]);

  const fetchStats = async () => {
    try {
      const data = await api.get('/policies/stats');
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      const data = await api.get(`/policies?${params.toString()}`);
      setPolicies(data.policies);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.delete(`/policies/${id}`);
      fetchPolicies();
      fetchStats();
    } catch (error) {
      alert('Failed to delete policy');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/policies/${id}`, { status: newStatus });
      fetchPolicies();
      fetchStats();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusClass = (status) => {
    const map = {
      'Paid': styles.badgePaid,
      'Pending': styles.badgePending,
      'Overdue': styles.badgeOverdue,
      'Grace Period': styles.badgeGrace,
      'Lapsed': styles.badgeLapsed
    };
    return map[status] || '';
  };

  const getDaysUntilDue = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Policies</h1>
          <p>Manage your client policies and track renewals</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/policies/import" className={styles.importBtn}>Import</Link>
          <Link href="/policies/new" className={styles.addBtn}>+ Add Policy</Link>
        </div>
      </header>

      <div className={styles.statsRow}>
        <div className={styles.statBento}>
          <div className={styles.statIcon}><TotalIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '-' : stats.total}</span>
            <span className={styles.statLabel}>Total Policies</span>
          </div>
        </div>
        <div className={styles.statBento}>
          <div className={`${styles.statIcon} ${styles.pendingIcon}`}><PendingIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '-' : stats.pendingRenewals}</span>
            <span className={styles.statLabel}>Pending Renewals</span>
          </div>
        </div>
        <div className={styles.statBento}>
          <div className={`${styles.statIcon} ${styles.paidIcon}`}><PaidIcon /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '-' : stats.paid}</span>
            <span className={styles.statLabel}>Paid</span>
          </div>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search by client name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          <select value={filters.company} onChange={(e) => handleFilterChange('company', e.target.value)} className={styles.select}>
            <option value="">All Companies</option>
            {INDIAN_INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className={styles.select}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Overdue">Overdue</option>
            <option value="Grace Period">Grace Period</option>
            <option value="Lapsed">Lapsed</option>
          </select>
          <input
            type="date"
            value={filters.due_date_from}
            onChange={(e) => handleFilterChange('due_date_from', e.target.value)}
            className={styles.dateInput}
          />
          <input
            type="date"
            value={filters.due_date_to}
            onChange={(e) => handleFilterChange('due_date_to', e.target.value)}
            className={styles.dateInput}
          />
        </div>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingState}>Loading...</div>
        ) : policies.length === 0 ? (
          <div className={styles.emptyState}>
            <EmptyIcon />
            <p>No policies found</p>
            <Link href="/policies/new" className={styles.emptyAddBtn}>Add your first policy</Link>
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Policy #</th>
                  <th>Company</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(policy => {
                  const days = getDaysUntilDue(policy.due_date);
                  return (
                    <tr key={policy.id}>
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.avatar}>{policy.client_name.charAt(0)}</div>
                          <span>{policy.client_name}</span>
                        </div>
                      </td>
                      <td className={styles.policyNumber}>{policy.policy_number}</td>
                      <td>{policy.insurance_company}</td>
                      <td>
                        <span className={days <= 7 ? styles.urgent : days <= 30 ? styles.soon : ''}>
                          {formatDate(policy.due_date)}
                        </span>
                        {days > 0 && days <= 7 && <small className={styles.daysLabel}>in {days}d</small>}
                        {days < 0 && <small className={styles.overdueLabel}>Overdue</small>}
                      </td>
                      <td className={styles.amount}>{formatCurrency(policy.premium_amount)}</td>
                      <td>
                        <select
                          value={policy.status}
                          onChange={(e) => handleStatusChange(policy.id, e.target.value)}
                          className={`${styles.statusSelect} ${getStatusClass(policy.status)}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Grace Period">Grace Period</option>
                          <option value="Lapsed">Lapsed</option>
                        </select>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <Link href={`/policies/edit/${policy.id}`} className={styles.editBtn}>Edit</Link>
                          <Link href={`/interactions?policy=${policy.id}`} className={styles.logBtn}>Logs</Link>
                          <button onClick={() => handleDelete(policy.id)} className={styles.deleteBtn}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
              <div className={styles.pageBtns}>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className={styles.pageBtn}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TotalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const PaidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const EmptyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="12" y1="12" x2="12" y2="18"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);
