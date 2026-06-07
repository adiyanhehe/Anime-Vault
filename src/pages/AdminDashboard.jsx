import React from 'react';
import AdminNav from '../components/AdminNav';

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard" style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Anime Vault Admin Panel</h1>
      <AdminNav />
      <section style={{ marginTop: '2rem' }}>
        <p>Welcome to the admin dashboard. Here you can manage content, users, and platform settings.</p>
        {/* Add admin widgets, tables, charts, etc. */}
      </section>
    </div>
  );
}
