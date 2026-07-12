<template>
  <div class="dashboard-view">
    <!-- Filter Bar -->
    <div class="filter-card">
      <div class="filter-title">🔎 Dashboard Filters</div>
      <div class="filter-grid">
        <div class="form-group">
          <label>Vehicle Type</label>
          <select v-model="filters.vehicle_type" class="form-control">
            <option value="">All Types</option>
            <option value="Truck">Truck</option>
            <option value="Van">Van</option>
            <option value="Bike">Bike</option>
            <option value="Bus">Bus</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Region</label>
          <input type="text" v-model="filters.region" class="form-control" placeholder="e.g. North, West" />
        </div>
        <div class="form-group">
          <label>From Date</label>
          <input type="date" v-model="filters.from_date" class="form-control" />
        </div>
        <div class="form-group">
          <label>To Date</label>
          <input type="date" v-model="filters.to_date" class="form-control" />
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="fetchData">Apply Filters</button>
        <button class="btn btn-secondary" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon text-primary">🚚</div>
        <div class="stat-content">
          <div class="stat-label">Active Vehicles</div>
          <div class="stat-value">{{ data.active_vehicles }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon text-success">✅</div>
        <div class="stat-content">
          <div class="stat-label">Available Vehicles</div>
          <div class="stat-value">{{ data.available_vehicles }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon text-warning">🗺️</div>
        <div class="stat-content">
          <div class="stat-label">Vehicles On Trip</div>
          <div class="stat-value">{{ data.vehicles_on_trip }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon text-danger">🔧</div>
        <div class="stat-content">
          <div class="stat-label">In Maintenance</div>
          <div class="stat-value">{{ data.vehicles_in_maintenance }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon text-purple">⚡</div>
        <div class="stat-content">
          <div class="stat-label">Fleet Utilization</div>
          <div class="stat-value">{{ data.fleet_utilization }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon text-orange">📅</div>
        <div class="stat-content">
          <div class="stat-label">Active / Pending Trips</div>
          <div class="stat-value">{{ data.active_trips }} / {{ data.pending_trips }}</div>
        </div>
      </div>
      <div class="stat-card" v-if="hasFinancialAccess">
        <div class="stat-icon text-yellow">💳</div>
        <div class="stat-content">
          <div class="stat-label">Monthly Fuel Cost</div>
          <div class="stat-value">${{ formatCurrency(data.monthly_fuel_cost) }}</div>
        </div>
      </div>
      <div class="stat-card" v-if="hasFinancialAccess">
        <div class="stat-icon text-teal">🛠️</div>
        <div class="stat-content">
          <div class="stat-label">Monthly Maintenance</div>
          <div class="stat-value">${{ formatCurrency(data.monthly_maintenance_cost) }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Vehicle Status Distribution -->
      <div class="chart-card">
        <div class="chart-title">Vehicle Status Distribution</div>
        <div class="visual-list" v-if="Object.keys(data.charts.vehicle_status).length">
          <div class="visual-item" v-for="(count, status) in data.charts.vehicle_status" :key="status">
            <div class="visual-label-row">
              <span class="visual-label">{{ status }}</span>
              <span class="visual-count">{{ count }}</span>
            </div>
            <div class="visual-progress-bg">
              <div :class="['visual-progress-bar', getStatusClass(status)]" :style="{ width: getPercentage(count, totalVehicles) + '%' }"></div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">No vehicle status data available</div>
      </div>

      <!-- Vehicle Type Distribution -->
      <div class="chart-card">
        <div class="chart-title">Vehicle Type Distribution</div>
        <div class="visual-list" v-if="Object.keys(data.charts.vehicle_type).length">
          <div class="visual-item" v-for="(count, type) in data.charts.vehicle_type" :key="type">
            <div class="visual-label-row">
              <span class="visual-label">{{ type }}</span>
              <span class="visual-count">{{ count }}</span>
            </div>
            <div class="visual-progress-bg">
              <div class="visual-progress-bar bg-primary" :style="{ width: getPercentage(count, totalVehicles) + '%' }"></div>
            </div>
          </div>
        </div>
        <div v-else class="no-data">No vehicle type data available</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      filters: {
        vehicle_type: '',
        region: '',
        from_date: '',
        to_date: ''
      },
      data: {
        active_vehicles: 0,
        available_vehicles: 0,
        vehicles_on_trip: 0,
        vehicles_in_maintenance: 0,
        active_trips: 0,
        pending_trips: 0,
        drivers_on_duty: 0,
        fleet_utilization: 0.0,
        monthly_fuel_cost: 0.0,
        monthly_maintenance_cost: 0.0,
        charts: {
          vehicle_status: {},
          vehicle_type: {},
          trip_status: {},
          monthly_costs: { labels: [], fuel: [], maintenance: [] }
        }
      }
    }
  },
  computed: {
    hasFinancialAccess() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Financial Analyst') || roles.includes('System Manager')
    },
    totalVehicles() {
      return Object.values(this.data.charts.vehicle_status).reduce((a, b) => a + b, 0) || 1
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      try {
        const queryParams = new URLSearchParams()
        if (this.filters.vehicle_type) queryParams.append('vehicle_type', this.filters.vehicle_type)
        if (this.filters.region) queryParams.append('region', this.filters.region)
        if (this.filters.from_date) queryParams.append('from_date', this.filters.from_date)
        if (this.filters.to_date) queryParams.append('to_date', this.filters.to_date)

        const response = await fetch(`/api/method/transitops.transitops.api.dashboard.get_dashboard_data?${queryParams.toString()}`)
        if (response.ok) {
          const res = await response.json()
          if (res.message) {
            this.data = res.message
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      }
    },
    clearFilters() {
      this.filters = {
        vehicle_type: '',
        region: '',
        from_date: '',
        to_date: ''
      }
      this.fetchData()
    },
    formatCurrency(val) {
      return parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    getPercentage(count, total) {
      return ((count / total) * 100).toFixed(1)
    },
    getStatusClass(status) {
      if (status === 'Available') return 'bg-success'
      if (status === 'On Trip') return 'bg-warning'
      if (status === 'In Shop') return 'bg-danger'
      return 'bg-secondary'
    }
  }
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Filter Card */
.filter-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
}

.filter-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  border-color: #374151;
}

.stat-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1f2937;
  border-radius: 10px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
}

/* Colors */
.text-primary { color: #3b82f6; }
.text-success { color: #10b981; }
.text-warning { color: #f59e0b; }
.text-danger { color: #ef4444; }
.text-purple { color: #8b5cf6; }
.text-orange { color: #f97316; }
.text-yellow { color: #eab308; }
.text-teal { color: #14b8a6; }

/* Charts */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

@media (max-width: 500px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.chart-title {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 20px;
  font-family: 'Outfit', sans-serif;
}

.visual-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.visual-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.visual-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
}

.visual-label {
  color: #d1d5db;
}

.visual-count {
  color: #ffffff;
}

.visual-progress-bg {
  height: 8px;
  background-color: #1f2937;
  border-radius: 4px;
  overflow: hidden;
}

.visual-progress-bar {
  height: 100%;
  border-radius: 4px;
}

.bg-primary { background-color: #3b82f6; }
.bg-success { background-color: #10b981; }
.bg-warning { background-color: #f59e0b; }
.bg-danger { background-color: #ef4444; }
.bg-secondary { background-color: #4b5563; }

.no-data {
  text-align: center;
  padding: 40px 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
