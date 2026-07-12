<template>
  <div class="vehicles-view">
    <div class="view-header">
      <h2 class="view-title">🚚 Vehicle Fleet</h2>
      <div class="view-actions" v-if="canManageVehicles">
        <button class="btn btn-primary" @click="openCreateModal">+ Add Vehicle</button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Vehicles List -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Registration No.</th>
            <th>Name / Model</th>
            <th>Type</th>
            <th>Max Load (kg)</th>
            <th>Odometer (km)</th>
            <th v-if="hasFinancialAccess">Cost</th>
            <th>Status</th>
            <th>Region</th>
            <th>License Expiry</th>
            <th>Reminder Email</th>
            <th v-if="canManageVehicles">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vehicle in vehicles" :key="vehicle.name">
            <td class="font-bold">{{ vehicle.registration_number }}</td>
            <td>{{ vehicle.vehicle_name }}</td>
            <td>{{ vehicle.vehicle_type }}</td>
            <td>{{ vehicle.max_load_capacity }}</td>
            <td>{{ vehicle.odometer }}</td>
            <td v-if="hasFinancialAccess">${{ formatCurrency(vehicle.acquisition_cost) }}</td>
            <td>
              <span :class="['badge', getStatusBadgeClass(vehicle.status)]">
                {{ vehicle.status }}
              </span>
            </td>
            <td>{{ vehicle.region || '-' }}</td>
            <td>
              <span :class="{ 'text-danger': isExpired(vehicle.license_expiry_date) }">
                {{ formatDate(vehicle.license_expiry_date) }}
              </span>
            </td>
            <td>{{ vehicle.reminder_email || '-' }}</td>
            <td v-if="canManageVehicles">
              <div class="actions-cell">
                <button class="btn-icon" @click="openEditModal(vehicle)" title="Edit">✏️</button>
                <button v-if="vehicle.status !== 'Retired'" class="btn-icon text-red" @click="retireVehicle(vehicle)" title="Retire Vehicle">❌</button>
                <button class="btn-icon text-danger" @click="deleteVehicle(vehicle)" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="!vehicles.length">
            <td colspan="11" class="no-data">No vehicles found in the fleet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" v-if="modalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Vehicle' : 'Add New Vehicle' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveVehicle">
            <div class="form-grid">
              <div class="form-group">
                <label>Registration Number</label>
                <input type="text" v-model="form.registration_number" class="form-control" required :disabled="isEdit" placeholder="e.g. MH-12-AB-1234" />
              </div>
              <div class="form-group">
                <label>Vehicle Name / Model</label>
                <input type="text" v-model="form.vehicle_name" class="form-control" required />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Vehicle Type</label>
                <select v-model="form.vehicle_type" class="form-control" required>
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Bike">Bike</option>
                  <option value="Bus">Bus</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Maximum Load Capacity (kg)</label>
                <input type="number" v-model.number="form.max_load_capacity" class="form-control" required min="1" />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Current Odometer (km)</label>
                <input type="number" v-model.number="form.odometer" class="form-control" required min="0" />
              </div>
              <div class="form-group">
                <label>Acquisition Cost ($)</label>
                <input type="number" v-model.number="form.acquisition_cost" class="form-control" required min="0" />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Region</label>
                <input type="text" v-model="form.region" class="form-control" placeholder="e.g. North" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-control" required :disabled="form.status === 'Retired' && !isSuperUser">
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>License Expiry Date</label>
                <input type="date" v-model="form.license_expiry_date" class="form-control" />
              </div>
              <div class="form-group">
                <label>Reminder Email</label>
                <input type="email" v-model="form.reminder_email" class="form-control" placeholder="fleet@example.com" />
              </div>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Vehicle</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Vehicles',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      vehicles: [],
      modalOpen: false,
      isEdit: false,
      errorMsg: '',
      form: {
        registration_number: '',
        vehicle_name: '',
        vehicle_type: 'Truck',
        max_load_capacity: 0,
        odometer: 0,
        acquisition_cost: 0,
        status: 'Available',
        region: '',
        license_expiry_date: '',
        reminder_email: ''
      }
    }
  },
  computed: {
    canManageVehicles() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('System Manager')
    },
    hasFinancialAccess() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Financial Analyst') || roles.includes('System Manager')
    },
    isSuperUser() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchVehicles()
  },
  methods: {
    async fetchVehicles() {
      try {
        const response = await fetch('/api/resource/Vehicle?fields=["*"]&limit_page_length=100')
        if (response.ok) {
          const res = await response.json()
          this.vehicles = res.data || []
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err)
      }
    },
    openCreateModal() {
      this.isEdit = false
      this.form = {
        registration_number: '',
        vehicle_name: '',
        vehicle_type: 'Truck',
        max_load_capacity: 1000,
        odometer: 0,
        acquisition_cost: 5000,
        status: 'Available',
        region: '',
        license_expiry_date: '',
        reminder_email: ''
      }
      this.modalOpen = true
    },
    openEditModal(vehicle) {
      this.isEdit = true
      this.form = { ...vehicle }
      this.modalOpen = true
    },
    closeModal() {
      this.modalOpen = false
      this.errorMsg = ''
    },
    async saveVehicle() {
      try {
        const url = this.isEdit 
          ? `/api/resource/Vehicle/${encodeURIComponent(this.form.name)}`
          : '/api/resource/Vehicle'
        const method = this.isEdit ? 'PUT' : 'POST'

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify(this.form)
        })

        if (response.ok) {
          this.closeModal()
          this.fetchVehicles()
        } else {
          const res = await response.json()
          // Handle error message
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Error while saving vehicle.'
        }
      } catch (err) {
        this.errorMsg = 'Failed to connect to server.'
      }
    },
    async retireVehicle(vehicle) {
      if (!confirm(`Are you sure you want to Retire vehicle ${vehicle.registration_number}? This cannot be undone automatically.`)) {
        return
      }
      try {
        const response = await fetch(`/api/resource/Vehicle/${encodeURIComponent(vehicle.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify({ status: 'Retired' })
        })

        if (response.ok) {
          this.fetchVehicles()
        } else {
          const res = await response.json()
          alert(res._server_messages ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ') : 'Failed to retire vehicle.')
        }
      } catch (err) {
        console.error('Failed to retire:', err)
      }
    },
    async deleteVehicle(vehicle) {
      if (!confirm(`Are you sure you want to permanently delete vehicle ${vehicle.registration_number}?`)) {
        return
      }
      try {
        const response = await fetch(`/api/resource/Vehicle/${encodeURIComponent(vehicle.name)}`, {
          method: 'DELETE',
          headers: {
            'X-Frappe-CSRF-Token': window.csrf_token
          }
        })

        if (response.ok) {
          this.fetchVehicles()
        } else {
          alert('Failed to delete vehicle. Ensure it has no linked records.')
        }
      } catch (err) {
        console.error('Error deleting vehicle:', err)
      }
    },
    formatCurrency(val) {
      return parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    },
    isExpired(dateStr) {
      if (!dateStr) return false
      return new Date(dateStr) < new Date()
    },
    getStatusBadgeClass(status) {
      if (status === 'Available') return 'badge-success'
      if (status === 'On Trip') return 'badge-warning'
      if (status === 'In Shop') return 'badge-danger'
      return 'badge-secondary'
    }
  }
}
</script>

<style scoped>
.font-bold {
  font-weight: 700;
  color: #3b82f6 !important;
}

.actions-cell {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #1f2937;
}

.text-red { color: #f59e0b; }
.text-danger { color: #ef4444; }

.modal-footer-form {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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
