'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import styles from './page.module.css';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, pendingRenewals: 0, paid: 0, overdue: 0, gracePeriod: 0, lapsed: 0 });
  const [upcomingPolicies, setUpcomingPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userStr));
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const statsData = await api.get('/policies/stats');
      setStats(statsData.stats);

      const policiesData = await api.get('/policies?limit=5&sort_by=due_date&sort_order=asc&status=Pending');
      setUpcomingPolicies(policiesData.policies || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getDaysUntilDue = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>Welcome back, {user.name || 'User'}!</h1>
          <p>Here&apos;s what&apos;s happening with your policies today.</p>
        </div>
        <div className={styles.headerDate}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </header>

      <div className={styles.bentoGrid}>
        <div className={`${styles.bentoCard} ${styles.statCard} ${styles.totalCard}`}>
          <div className={styles.statIcon}>
            <TotalIcon />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Total Policies</span>
            <span className={styles.statValue}>{loading ? '-' : stats.total}</span>
          </div>
          <a href="/policies" className={styles.cardLink}></a>
        </div>

        <div className={`${styles.bentoCard} ${styles.statCard} ${styles.pendingCard}`}>
          <div className={styles.statIcon}>
            <PendingIcon />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Pending Renewals</span>
            <span className={styles.statValue}>{loading ? '-' : stats.pendingRenewals}</span>
          </div>
          <a href="/policies?filter=Pending" className={styles.cardLink}></a>
        </div>

        <div className={`${styles.bentoCard} ${styles.statCard} ${styles.paidCard}`}>
          <div className={styles.statIcon}>
            <PaidIcon />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Paid Policies</span>
            <span className={styles.statValue}>{loading ? '-' : stats.paid}</span>
          </div>
          <a href="/policies?filter=Paid" className={styles.cardLink}></a>
        </div>

        <div className={`${styles.bentoCard} ${styles.statCard} ${styles.graceCard}`}>
          <div className={styles.statIcon}>
            <GraceIcon />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Grace Period</span>
            <span className={styles.statValue}>{loading ? '-' : stats.gracePeriod}</span>
          </div>
          <a href="/policies?filter=Grace Period" className={styles.cardLink}></a>
        </div>

        <div className={`${styles.bentoCard} ${styles.tableCard}`}>
          <div className={styles.cardHeader}>
            <h2>Upcoming Renewals</h2>
            <a href="/policies" className={styles.viewAll}>View All</a>
          </div>
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>Loading...</div>
            ) : upcomingPolicies.length === 0 ? (
              <div className={styles.emptyState}>No upcoming renewals</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Policy</th>
                    <th>Due</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingPolicies.map(policy => {
                    const days = getDaysUntilDue(policy.due_date);
                    return (
                      <tr key={policy.id}>
                        <td className={styles.clientCell}>
                          <div className={styles.clientAvatar}>{policy.client_name.charAt(0)}</div>
                          <span>{policy.client_name}</span>
                        </td>
                        <td>{policy.policy_number}</td>
                        <td>
                          <span className={days <= 7 ? styles.urgent : days <= 30 ? styles.soon : ''}>
                            {formatDate(policy.due_date)}
                            {days > 0 && <small> in {days}d</small>}
                            {days < 0 && <small className={styles.overdueText}> Overdue</small>}
                          </span>
                        </td>
                        <td>{formatCurrency(policy.premium_amount)}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[`badge${policy.status.replace(' ', '')}`]}`}>
                            {policy.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.quickActionsCard}`}>
          <h2>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <a href="/policies/new" className={styles.actionBtn}>
              <AddIcon />
              <span>Add Policy</span>
            </a>
            <a href="/clients/new" className={styles.actionBtn}>
              <ClientIcon />
              <span>Add Client</span>
            </a>
            <a href="/policies/import" className={styles.actionBtn}>
              <ImportIcon />
              <span>Import CSV</span>
            </a>
            <a href="/interactions" className={styles.actionBtn}>
              <LogIcon />
              <span>View Logs</span>
            </a>
          </div>
        </div>

        <div className={`${styles.bentoCard} ${styles.chartCard}`}>
          <h2>Policy Status</h2>
          <div className={styles.chartPlaceholder}>
            <div className={styles.donutChart}>
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="12"/>
                {stats.total > 0 && (
                  <>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                      strokeDasharray={`${(stats.paid / stats.total) * 251.2} 251.2`}
                      transform="rotate(-90 50 50)"/>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
                      strokeDasharray={`${(stats.pendingRenewals / stats.total) * 251.2} 251.2`}
                      strokeDashoffset={`-${(stats.paid / stats.total) * 251.2}`}
                      transform="rotate(-90 50 50)"/>
                  </>
                )}
                <text x="50" y="45" textAnchor="middle" className={styles.chartTotal}>{stats.total}</text>
                <text x="50" y="58" textAnchor="middle" className={styles.chartLabel}>Total</text>
              </svg>
            </div>
            <div className={styles.legend}>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{background: '#22c55e'}}></span>
                <span>Paid ({stats.paid})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{background: '#f59e0b'}}></span>
                <span>Pending ({stats.pendingRenewals})</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{background: '#6366f1'}}></span>
                <span>Grace Period ({stats.gracePeriod})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TotalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const PaidIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
);

const GraceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
  </svg>
);

const AddIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const ClientIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const ImportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17,8 12,3 7,8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const LogIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>
);
