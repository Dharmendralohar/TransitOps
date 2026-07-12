<template>
  <div class="reports-view">
    <!-- Selection Bar -->
    <div class="filter-card">
      <div class="filter-title">📈 Analytics Reports</div>
      <div class="filter-grid">
        <div class="form-group">
          <label>Report Type</label>
          <select v-model="selectedReport" class="form-control" @change="onReportChange">
            <option value="fuel_efficiency">Fuel Efficiency Report</option>
            <option value="fleet_utilization">Current Fleet Utilization Report</option>
            <option v-if="hasFinancialAccess" value="operational_cost">Operational Cost per Vehicle</option>
            <option v-if="hasFinancialAccess" value="roi">Vehicle ROI Report</option>
          </select>
        </div>

        <div class="form-group" v-if="selectedReport !== 'fleet_utilization'">
          <label>From Date</label>
          <input type="date" v-model="filters.from_date" class="form-control" />
        </div>

        <div class="form-group" v-if="selectedReport !== 'fleet_utilization'">
          <label>To Date</label>
          <input type="date" v-model="filters.to_date" class="form-control" />
        </div>
      </div>

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
          <input type="text" v-model="filters.region" class="form-control" placeholder="e.g. North" />
        </div>

        <div class="form-group" v-if="selectedReport !== 'fleet_utilization'">
          <label>Vehicle</label>
          <select v-model="filters.vehicle" class="form-control">
            <option value="">All Vehicles</option>
            <option v-for="v in vehicles" :key="v.name" :value="v.name">
              {{ v.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button class="btn btn-primary" @click="fetchReportData">Generate Report</button>
        <button class="btn btn-success" @click="exportCSV" :disabled="!reportData.length">
          📥 Export CSV
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Report Table -->
    <div class="table-container" v-if="reportData.length">
      <table class="data-table">
        <thead>
          <tr v-if="selectedReport === 'fuel_efficiency'">
            <th>Vehicle</th>
            <th>Registration Number</th>
            <th>Total Distance (km)</th>
            <th>Total Fuel (Liters)</th>
            <th>Fuel Efficiency</th>
            <th>Unit</th>
          </tr>
          <tr v-else-if="selectedReport === 'fleet_utilization'">
            <th>Total Active Vehicles</th>
            <th>Vehicles On Trip</th>
            <th>Vehicles Available</th>
            <th>Vehicles In Shop</th>
            <th>Fleet Utilization (%)</th>
          </tr>
          <tr v-else-if="selectedReport === 'operational_cost'">
            <th>Vehicle</th>
            <th>Fuel Cost</th>
            <th>Maintenance Cost</th>
            <th>Other Expenses</th>
            <th>Mandatory Operational Cost</th>
            <th>Total Cost</th>
          </tr>
          <tr v-else-if="selectedReport === 'roi'">
            <th>Vehicle</th>
            <th>Acquisition Cost</th>
            <th>Trip Revenue</th>
            <th>Fuel Cost</th>
            <th>Maintenance Cost</th>
            <th>Operating Profit</th>
            <th>ROI Percentage</th>
          </tr>
        </thead>
        <tbody>
          <!-- Fuel Efficiency Rows -->
          <template v-if="selectedReport === 'fuel_efficiency'">
            <tr v-for="row in reportData" :key="row.vehicle">
              <td class="font-bold">{{ row.vehicle }}</td>
              <td>{{ row.registration_number }}</td>
              <td>{{ row.total_distance }} km</td>
              <td>{{ row.total_fuel }} L</td>
              <td class="text-primary font-semibold">{{ row.efficiency }}</td>
              <td>{{ row.unit }}</td>
            </tr>
          </template>

          <!-- Fleet Utilization Rows -->
          <template v-else-if="selectedReport === 'fleet_utilization'">
            <tr v-for="(row, idx) in reportData" :key="idx">
              <td>{{ row.total_active_vehicles }}</td>
              <td>{{ row.vehicles_on_trip }}</td>
              <td>{{ row.vehicles_available }}</td>
              <td>{{ row.vehicles_in_shop }}</td>
              <td class="text-primary font-bold">{{ row.fleet_utilization_percentage }}%</td>
            </tr>
          </template>

          <!-- Operational Cost Rows -->
          <template v-else-if="selectedReport === 'operational_cost'">
            <tr v-for="row in reportData" :key="row.vehicle">
              <td class="font-bold">{{ row.vehicle }}</td>
              <td>${{ formatCurrency(row.fuel_cost) }}</td>
              <td>${{ formatCurrency(row.maintenance_cost) }}</td>
              <td>${{ formatCurrency(row.other_expenses) }}</td>
              <td class="font-semibold text-warning">${{ formatCurrency(row.mandatory_operational_cost) }}</td>
              <td class="font-bold text-danger">${{ formatCurrency(row.total_cost) }}</td>
            </tr>
          </template>

          <!-- ROI Rows -->
          <template v-else-if="selectedReport === 'roi'">
            <tr v-for="row in reportData" :key="row.vehicle">
              <td class="font-bold">{{ row.vehicle }}</td>
              <td>${{ formatCurrency(row.acquisition_cost) }}</td>
              <td>${{ formatCurrency(row.trip_revenue) }}</td>
              <td>${{ formatCurrency(row.fuel_cost) }}</td>
              <td>${{ formatCurrency(row.maintenance_cost) }}</td>
              <td :class="['font-semibold', row.operating_profit >= 0 ? 'text-success' : 'text-danger']">
                ${{ formatCurrency(row.operating_profit) }}
              </td>
              <td :class="['font-bold', row.roi_percentage >= 0 ? 'text-success' : 'text-danger']">
                {{ row.roi_percentage }}%
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    
    <div v-else class="no-report-card">
      <div class="empty-icon">📊</div>
      <p>No report data generated. Select filters and click "Generate Report".</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reports',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      selectedReport: 'fuel_efficiency',
      reportData: [],
      vehicles: [],
      errorMsg: '',
      filters: {
        from_date: '',
        to_date: '',
        vehicle_type: '',
        region: '',
        vehicle: ''
      }
    }
  },
  computed: {
    hasFinancialAccess() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Financial Analyst') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchVehicles()
  },
  methods: {
    async fetchVehicles() {
      try {
        const response = await fetch('/api/resource/Vehicle?fields=["name"]&limit_page_length=200')
        if (response.ok) {
          const res = await response.json()
          this.vehicles = res.data || []
        }
      } catch (err) {
        console.error(err)
      }
    },
    onReportChange() {
      this.reportData = []
      this.errorMsg = ''
    },
    async fetchReportData() {
      this.errorMsg = ''
      try {
        let endpoint = ''
        if (this.selectedReport === 'fuel_efficiency') {
          endpoint = '/api/method/transitops.transitops.api.reports.get_fuel_efficiency_report'
        } else if (this.selectedReport === 'fleet_utilization') {
          endpoint = '/api/method/transitops.transitops.api.reports.get_fleet_utilization_report'
        } else if (this.selectedReport === 'operational_cost') {
          endpoint = '/api/method/transitops.transitops.api.reports.get_operational_cost_report'
        } else if (this.selectedReport === 'roi') {
          endpoint = '/api/method/transitops.transitops.api.reports.get_vehicle_roi_report'
        }

        const params = new URLSearchParams()
        if (this.filters.from_date) params.append('from_date', this.filters.from_date)
        if (this.filters.to_date) params.append('to_date', this.filters.to_date)
        if (this.filters.vehicle_type) params.append('vehicle_type', this.filters.vehicle_type)
        if (this.filters.region) params.append('region', this.filters.region)
        if (this.filters.vehicle) params.append('vehicle', this.filters.vehicle)

        const response = await fetch(`${endpoint}?${params.toString()}`)
        if (response.ok) {
          const res = await response.json()
          this.reportData = res.message || []
          if (!this.reportData.length) {
            this.errorMsg = 'No records found matching filters.'
          }
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Access Denied or report generation failed.'
        }
      } catch (err) {
        this.errorMsg = 'Failed to fetch report details from server.'
      }
    },
    exportCSV() {
      if (!this.reportData.length) return
      const keys = Object.keys(this.reportData[0])
      const csvRows = []
      
      // Headers
      csvRows.push(keys.join(','))
      
      // Data rows
      for (const row of this.reportData) {
        const values = keys.map(k => {
          const escapeVal = ('' + (row[k] ?? '')).replace(/"/g, '""')
          return `"${escapeVal}"`
        })
        csvRows.push(values.join(','))
      }

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `transitops_${this.selectedReport}_report.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    formatCurrency(val) {
      return parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }
}
</script>

<style scoped>
.font-bold {
  font-weight: 700;
  color: #3b82f6 !important;
}

.font-semibold {
  font-weight: 600;
}

.text-success { color: #10b981; }
.text-danger { color: #ef4444; }
.text-warning { color: #f59e0b; }
.text-primary { color: #3b82f6; }

/* Filter Card */
.filter-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
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

/* Empty Report Card */
.no-report-card {
  background-color: #111827;
  border: 1px dashed #374151;
  border-radius: 12px;
  padding: 80px 24px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* Alert styles */
.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.alert-danger {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-close {
  background: none;
  border: none;
  color: currentColor;
  font-size: 18px;
  cursor: pointer;
}
</style>
