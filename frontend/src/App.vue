<template>
  <div class="app-container">
    <!-- Loading Overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Initializing TransitOps...</p>
    </div>

    <template v-else>
      <!-- Sidebar -->
      <aside :class="['sidebar', { 'mobile-open': mobileOpen }]">
        <div class="sidebar-brand">
          <div class="brand-logo">⚡</div>
          <div class="brand-name">TransitOps</div>
        </div>

        <nav class="sidebar-nav">
          <router-link v-if="hasTabAccess('Dashboard')" to="/" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Dashboard</span>
          </router-link>
          <router-link v-if="hasTabAccess('Vehicles')" to="/vehicles" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">🚚</span>
            <span class="nav-label">Vehicles</span>
          </router-link>
          <router-link v-if="hasTabAccess('Drivers')" to="/drivers" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">👤</span>
            <span class="nav-label">Drivers</span>
          </router-link>
          <router-link v-if="hasTabAccess('Trips')" to="/trips" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">🗺️</span>
            <span class="nav-label">Trips</span>
          </router-link>
          <router-link v-if="hasTabAccess('Maintenance')" to="/maintenance" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">🔧</span>
            <span class="nav-label">Maintenance</span>
          </router-link>
          <router-link v-if="hasTabAccess('Expenses')" to="/expenses" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">💳</span>
            <span class="nav-label">Expenses &amp; Fuel</span>
          </router-link>
          <router-link v-if="hasTabAccess('Analytics')" to="/reports" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">📈</span>
            <span class="nav-label">Analytics</span>
          </router-link>
          <router-link v-if="hasTabAccess('Settings')" to="/settings" class="nav-item" active-class="active" @click="mobileOpen = false">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Settings</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile" v-if="currentUser.authenticated">
            <div class="user-avatar">
              {{ currentUser.full_name ? currentUser.full_name[0].toUpperCase() : 'U' }}
            </div>
            <div class="user-info">
              <div class="user-name">{{ currentUser.full_name }}</div>
              <div class="user-role">{{ getDisplayRole() }}</div>
            </div>
          </div>
          <div class="desk-link-container" style="display: flex; flex-direction: column; gap: 8px;">
            <a href="/app" class="desk-link">
              <span class="nav-icon">🖥️</span> Go to Desk
            </a>
            <button @click="handleLogout" class="logout-link">
              <span class="nav-icon">🚪</span> Logout
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Layout -->
      <div class="main-layout">
        <!-- Top Navbar -->
        <header class="top-navbar">
          <button class="menu-toggle" @click="mobileOpen = !mobileOpen">
            ☰
          </button>
          <div class="navbar-title">
            {{ $route.name }}
          </div>
          <div class="navbar-actions">
            <span class="site-badge">{{ currentUser.site_name || 'transitops.local' }}</span>
          </div>
        </header>

        <!-- View Container -->
        <main class="content-container">
          <router-view :user="currentUser" @refresh-user="fetchUser"></router-view>
        </main>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      loading: true,
      mobileOpen: false,
      currentUser: {
        authenticated: false,
        user: '',
        full_name: '',
        roles: [],
        driver: null,
        site_name: ''
      }
    }
  },
  created() {
    this.fetchUser()
  },
  methods: {
    hasTabAccess(tab) {
      const roles = this.currentUser.roles || []
      if (roles.includes("System Manager") || roles.includes("Administrator")) {
        return true
      }
      if (tab === "Dashboard") {
        return roles.includes("Fleet Manager") || roles.includes("Dispatcher") || roles.includes("Safety Officer") || roles.includes("Financial Analyst")
      }
      if (tab === "Vehicles") {
        return roles.includes("Fleet Manager")
      }
      if (tab === "Drivers") {
        return roles.includes("Safety Officer") || roles.includes("Fleet Manager")
      }
      if (tab === "Trips") {
        return roles.includes("Dispatcher") || roles.includes("Fleet Manager")
      }
      if (tab === "Maintenance") {
        return roles.includes("Fleet Manager")
      }
      if (tab === "Expenses") {
        return roles.includes("Financial Analyst") || roles.includes("Fleet Manager")
      }
      if (tab === "Analytics") {
        return roles.includes("Financial Analyst") || roles.includes("Fleet Manager")
      }
      if (tab === "Settings") {
        return roles.includes("Fleet Manager") || roles.includes("Safety Officer")
      }
      return true
    },
    async fetchUser() {
      try {
        const response = await fetch('/api/method/transitops.transitops.api.auth.get_current_user')
        if (response.ok) {
          const res = await response.json()
          if (res.message) {
            this.currentUser = res.message
            if (res.message.csrf_token) {
              window.csrf_token = res.message.csrf_token
            }
            if (!res.message.authenticated) {
              window.location.href = '/login?redirect-to=/transitops';
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        this.loading = false
      }
    },
    getDisplayRole() {
      if (!this.currentUser.roles) return ''
      const roles = this.currentUser.roles
      if (roles.includes('Fleet Manager')) return 'Fleet Manager'
      if (roles.includes('Financial Analyst')) return 'Financial Analyst'
      if (roles.includes('Safety Officer')) return 'Safety Officer'
      if (roles.includes('Driver')) return 'Driver'
      if (roles.includes('System Manager')) return 'System Manager'
      return roles[0] || 'User'
    },
    async handleLogout() {
      try {
        await fetch('/api/method/logout', {
          method: 'POST',
          headers: {
            'X-Frappe-CSRF-Token': window.csrf_token
          }
        });
        window.location.href = '/login?redirect-to=/transitops';
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
  }
}
</script>

<style>
/* Reset and Globals */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

body, html {
  background-color: #0b0f19;
  color: #f3f4f6;
  height: 100%;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Scrollbar Styles */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #111827;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background-color: #0b0f19;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #1e293b;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Sidebar */
.sidebar {
  width: 260px;
  background-color: #111827;
  border-right: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-brand {
  height: 70px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #1f2937;
}

.brand-logo {
  font-size: 24px;
  color: #3b82f6;
}

.brand-name {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #ffffff;
}

.sidebar-nav {
  flex: 1;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #9ca3af;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: #1f2937;
  color: #ffffff;
}

.nav-item.active {
  background-color: #1e293b;
  color: #3b82f6;
  border-left: 3px solid #3b82f6;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: #1f2937;
  border-radius: 8px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
}

.user-info {
  overflow: hidden;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.user-role {
  font-size: 11px;
  color: #9ca3af;
}

.desk-link-container {
  display: flex;
}

.desk-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: #374151;
  color: #f3f4f6;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.desk-link:hover {
  background-color: #4b5563;
}

/* Main Layout */
.main-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.top-navbar {
  height: 70px;
  border-bottom: 1px solid #1f2937;
  background-color: #111827;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
}

.navbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
}

.navbar-actions {
  display: flex;
  align-items: center;
}

.site-badge {
  background-color: #1e293b;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.content-container {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #0b0f19;
}

/* Common View Styles */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
}

.view-actions {
  display: flex;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .menu-toggle {
    display: block;
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .content-container {
    padding: 16px;
  }
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-control {
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 10px 14px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: #3b82f6;
}

.form-control:disabled {
  background-color: #111827;
  color: #6b7280;
  cursor: not-allowed;
}

/* Dialog & Table styles shared across pages */
.table-container {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.data-table th {
  background-color: #1f2937;
  padding: 12px 16px;
  font-weight: 600;
  color: #9ca3af;
  border-bottom: 1px solid #374151;
}

.data-table td {
  padding: 12px 16px;
  color: #f3f4f6;
  border-bottom: 1px solid #1f2937;
}

.data-table tr:hover td {
  background-color: #1e293b;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9999px;
  text-transform: uppercase;
}

.badge-success { background-color: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
.badge-primary { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
.badge-warning { background-color: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
.badge-danger { background-color: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.badge-secondary { background-color: rgba(107, 114, 128, 0.1); color: #9ca3af; border: 1px solid rgba(107, 114, 128, 0.2); }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary { background-color: #3b82f6; color: #ffffff; }
.btn-primary:hover { background-color: #2563eb; }
.btn-success { background-color: #10b981; color: #ffffff; }
.btn-success:hover { background-color: #059669; }
.btn-danger { background-color: #ef4444; color: #ffffff; }
.btn-danger:hover { background-color: #dc2626; }
.btn-secondary { background-color: #374151; color: #ffffff; }
.btn-secondary:hover { background-color: #4b5563; }

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.logout-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background-color: #3f1e1e;
  border: 1px solid #7f1d1d;
  color: #fca5a5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-link:hover {
  background-color: #7f1d1d;
  color: #ffffff;
}
</style>
