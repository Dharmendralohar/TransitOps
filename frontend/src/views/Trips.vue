<template>
  <div class="trips-view">
    <div class="view-header">
      <h2 class="view-title">🗺️ Trip Logs &amp; Dispatch</h2>
      <div class="view-actions" v-if="canCreateTrips">
        <button class="btn btn-primary" @click="openCreateModal">+ Create Trip</button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Trips List -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Trip ID</th>
            <th>Route (Source ➔ Destination)</th>
            <th>Vehicle</th>
            <th>Driver</th>
            <th>Cargo (kg)</th>
            <th>Planned (km)</th>
            <th>Actual (km)</th>
            <th>Dispatch Time</th>
            <th>Status</th>
            <th v-if="hasFinancialAccess">Revenue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trip in trips" :key="trip.name">
            <td class="font-bold">{{ trip.name }}</td>
            <td>
              <div class="route-display">
                <span class="route-point">{{ trip.source }}</span>
                <span class="route-arrow">➔</span>
                <span class="route-point">{{ trip.destination }}</span>
              </div>
            </td>
            <td>{{ trip.vehicle }}</td>
            <td>{{ trip.driver }}</td>
            <td>{{ trip.cargo_weight }} kg</td>
            <td>{{ trip.planned_distance }} km</td>
            <td>{{ trip.actual_distance ? trip.actual_distance + ' km' : '-' }}</td>
            <td>{{ formatDateTime(trip.dispatch_datetime) }}</td>
            <td>
              <span :class="['badge', getStatusBadgeClass(trip.status)]">
                {{ trip.status }}
              </span>
            </td>
            <td v-if="hasFinancialAccess">${{ formatCurrency(trip.revenue) }}</td>
            <td>
              <div class="actions-cell">
                <!-- State transition triggers -->
                <button v-if="trip.status === 'Draft'" class="btn btn-success btn-xs" @click="dispatchTrip(trip)">
                  🚀 Dispatch
                </button>
                <button v-if="trip.status === 'Dispatched'" class="btn btn-primary btn-xs" @click="openCompleteModal(trip)">
                  🏁 Complete
                </button>
                <button v-if="trip.status === 'Draft' || trip.status === 'Dispatched'" class="btn btn-danger btn-xs" @click="openCancelModal(trip)">
                  🛑 Cancel
                </button>
                
                <!-- View Details / Edit -->
                <button v-if="trip.status === 'Draft' && canCreateTrips" class="btn btn-secondary btn-xs" @click="openEditModal(trip)">
                  Edit
                </button>
                <span v-if="trip.status === 'Completed' || trip.status === 'Cancelled'" class="no-actions">-</span>
              </div>
            </td>
          </tr>
          <tr v-if="!trips.length">
            <td colspan="11" class="no-data">No trip logs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" v-if="modalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Trip Details' : 'Create New Trip' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveTrip">
            <div class="form-grid">
              <div class="form-group">
                <label>Source Location</label>
                <input type="text" v-model="form.source" class="form-control" required placeholder="e.g. Depot A" />
              </div>
              <div class="form-group">
                <label>Destination Location</label>
                <input type="text" v-model="form.destination" class="form-control" required placeholder="e.g. Client Warehouse" />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Vehicle</label>
                <select v-model="form.vehicle" class="form-control" required>
                  <option value="">Select Vehicle</option>
                  <option v-for="v in availableVehicles" :key="v.name" :value="v.name">
                    {{ v.name }} - {{ v.vehicle_name }} ({{ v.max_load_capacity }} kg)
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Driver</label>
                <select v-model="form.driver" class="form-control" required>
                  <option value="">Select Driver</option>
                  <option v-for="d in availableDrivers" :key="d.name" :value="d.name">
                    {{ d.driver_name }} ({{ d.status }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Cargo Weight (kg)</label>
                <input type="number" v-model.number="form.cargo_weight" class="form-control" required min="1" />
              </div>
              <div class="form-group">
                <label>Planned Distance (km)</label>
                <input type="number" v-model.number="form.planned_distance" class="form-control" required min="1" />
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" class="form-control" placeholder="Add optional details..." rows="3"></textarea>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="!!cargoWarning">Save Trip</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Complete Trip Modal -->
    <div class="modal-backdrop" v-if="completeModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🏁 Complete Trip: {{ selectedTrip.name }}</h3>
          <button class="modal-close" @click="completeModalOpen = false">×</button>
        </div>
        <div class="modal-body">
          <div class="info-row">
            <span>Starting Odometer:</span>
            <strong>{{ selectedTrip.starting_odometer }} km</strong>
          </div>
          <form @submit.prevent="submitCompleteTrip">
            <div class="form-group mb-16">
              <label>Final Odometer Reading (km)</label>
              <input type="number" v-model.number="completeForm.final_odometer" class="form-control" required :min="selectedTrip.starting_odometer" />
            </div>

            <div class="form-group mb-16">
              <label>Fuel Consumed (Liters)</label>
              <input type="number" v-model.number="completeForm.fuel_consumed" class="form-control" required min="0" step="0.01" />
            </div>

            <div class="form-group mb-16" v-if="hasFinancialAccess">
              <label>Fuel Cost ($)</label>
              <input type="number" v-model.number="completeForm.fuel_cost" class="form-control" required min="0" step="0.01" />
            </div>

            <div class="form-group mb-16" v-if="hasFinancialAccess">
              <label>Trip Revenue ($)</label>
              <input type="number" v-model.number="completeForm.revenue" class="form-control" required min="0" step="0.01" />
            </div>

            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="completeModalOpen = false">Cancel</button>
              <button type="submit" class="btn btn-success">Complete Trip</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Cancel Trip Modal -->
    <div class="modal-backdrop" v-if="cancelModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🛑 Cancel Trip: {{ selectedTrip.name }}</h3>
          <button class="modal-close" @click="cancelModalOpen = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitCancelTrip">
            <div class="form-group mb-16">
              <label>Cancellation Reason</label>
              <textarea v-model="cancelForm.cancellation_reason" class="form-control" required placeholder="Describe the reason for cancellation..." rows="3"></textarea>
            </div>

            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="cancelModalOpen = false">Cancel</button>
              <button type="submit" class="btn btn-danger">Cancel Trip</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Trips',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      trips: [],
      vehicles: [],
      drivers: [],
      modalOpen: false,
      isEdit: false,
      errorMsg: '',
      selectedTrip: null,
      completeModalOpen: false,
      cancelModalOpen: false,
      form: {
        source: '',
        destination: '',
        vehicle: '',
        driver: '',
        cargo_weight: 0,
        planned_distance: 0,
        notes: ''
      },
      completeForm: {
        final_odometer: 0,
        fuel_consumed: 0,
        fuel_cost: 0,
        revenue: 0
      },
      cancelForm: {
        cancellation_reason: ''
      }
    }
  },
  computed: {
    availableVehicles() {
      return this.vehicles.filter(v => {
        const isAssigned = v.name === this.form.vehicle;
        const isAvailable = v.status === "Available";
        return isAssigned || isAvailable;
      })
    },
    availableDrivers() {
      return this.drivers.filter(d => {
        const isAssigned = d.name === this.form.driver;
        const isAvailable = d.status === "Available";
        const isNotExpired = !d.license_expiry_date || new Date(d.license_expiry_date) >= new Date();
        return isAssigned || (isAvailable && isNotExpired);
      })
    },
    selectedVehicleObj() {
      if (!this.form.vehicle) return null
      return this.vehicles.find(v => v.name === this.form.vehicle)
    },
    cargoWarning() {
      const v = this.selectedVehicleObj
      if (v && v.max_load_capacity && this.form.cargo_weight > v.max_load_capacity) {
        const diff = this.form.cargo_weight - v.max_load_capacity
        return `Vehicle Capacity: ${v.max_load_capacity} kg | Cargo Weight: ${this.form.cargo_weight} kg | Capacity exceeded by ${diff} kg - dispatch blocked.`
      }
      return ""
    },
    canCreateTrips() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('System Manager')
    },
    hasFinancialAccess() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Financial Analyst') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchTrips()
    this.fetchVehicles()
    this.fetchDrivers()
  },
  methods: {
    isDispatchDisabled(trip) {
      const v = this.vehicles.find(veh => veh.name === trip.vehicle)
      if (v && v.max_load_capacity && trip.cargo_weight > v.max_load_capacity) {
        return true
      }
      return false
    },
    async fetchTrips() {
      try {
        const response = await fetch('/api/resource/Trip?fields=["*"]&limit_page_length=100&order_by=creation desc')
        if (response.ok) {
          const res = await response.json()
          this.trips = res.data || []
        }
      } catch (err) {
        console.error('Error fetching trips:', err)
      }
    },
    async fetchVehicles() {
      try {
        const response = await fetch('/api/resource/Vehicle?fields=["name","vehicle_name","status","max_load_capacity"]&limit_page_length=200')
        if (response.ok) {
          const res = await response.json()
          this.vehicles = res.data || []
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err)
      }
    },
    async fetchDrivers() {
      try {
        const response = await fetch('/api/resource/Driver?fields=["name","driver_name","status","license_expiry_date"]&limit_page_length=200')
        if (response.ok) {
          const res = await response.json()
          this.drivers = res.data || []
        }
      } catch (err) {
        console.error('Error fetching drivers:', err)
      }
    },
    openCreateModal() {
      this.isEdit = false
      this.form = {
        source: '',
        destination: '',
        vehicle: '',
        driver: '',
        cargo_weight: 100,
        planned_distance: 10,
        notes: ''
      }
      this.modalOpen = true
    },
    openEditModal(trip) {
      this.isEdit = true
      this.form = { ...trip }
      this.modalOpen = true
    },
    closeModal() {
      this.modalOpen = false
      this.errorMsg = ''
    },
    async saveTrip() {
      try {
        const selectedVehicle = this.vehicles.find(vehicle => vehicle.name === this.form.vehicle)
        if (selectedVehicle && this.form.cargo_weight > selectedVehicle.max_load_capacity) {
          this.errorMsg = `Cargo weight ${this.form.cargo_weight} kg exceeds ${selectedVehicle.name} capacity of ${selectedVehicle.max_load_capacity} kg.`
          return
        }

        const url = this.isEdit 
          ? `/api/resource/Trip/${encodeURIComponent(this.form.name)}`
          : '/api/resource/Trip'
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
          this.refreshTripContext()
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Error while saving trip details.'
        }
      } catch (err) {
        this.errorMsg = 'Failed to save trip. Connection issue.'
      }
    },
    async dispatchTrip(trip) {
      try {
        const response = await fetch('/api/method/transitops.transitops.api.trips.dispatch_trip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify({ trip_name: trip.name })
        })

        if (response.ok) {
          this.refreshTripContext()
        } else {
          const res = await response.json()
          alert(res._server_messages ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ') : 'Dispatch failed.')
        }
      } catch (err) {
        console.error('Failed to dispatch:', err)
      }
    },
    openCompleteModal(trip) {
      this.selectedTrip = trip
      this.completeForm = {
        final_odometer: trip.starting_odometer || 0,
        fuel_consumed: 0,
        fuel_cost: 0,
        revenue: 0
      }
      this.completeModalOpen = true
    },
    async submitCompleteTrip() {
      try {
        const response = await fetch('/api/method/transitops.transitops.api.trips.complete_trip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify({
            trip_name: this.selectedTrip.name,
            final_odometer: this.completeForm.final_odometer,
            fuel_consumed: this.completeForm.fuel_consumed,
            fuel_cost: this.completeForm.fuel_cost,
            revenue: this.completeForm.revenue
          })
        })

        if (response.ok) {
          this.completeModalOpen = false
          this.refreshTripContext()
        } else {
          const res = await response.json()
          alert(res._server_messages ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ') : 'Completion failed.')
        }
      } catch (err) {
        console.error('Completion error:', err)
      }
    },
    openCancelModal(trip) {
      this.selectedTrip = trip
      this.cancelForm = {
        cancellation_reason: ''
      }
      this.cancelModalOpen = true
    },
    async submitCancelTrip() {
      try {
        const response = await fetch('/api/method/transitops.transitops.api.trips.cancel_trip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify({
            trip_name: this.selectedTrip.name,
            cancellation_reason: this.cancelForm.cancellation_reason
          })
        })

        if (response.ok) {
          this.cancelModalOpen = false
          this.refreshTripContext()
        } else {
          const res = await response.json()
          alert(res._server_messages ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ') : 'Cancellation failed.')
        }
      } catch (err) {
        console.error('Cancellation error:', err)
      }
    },
    formatDateTime(dtStr) {
      if (!dtStr) return '-'
      const date = new Date(dtStr)
      return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    },
    refreshTripContext() {
      this.fetchTrips()
      this.fetchVehicles()
      this.fetchDrivers()
    },
    formatCurrency(val) {
      return parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    },
    getStatusBadgeClass(status) {
      if (status === 'Draft') return 'badge-secondary'
      if (status === 'Dispatched') return 'badge-warning'
      if (status === 'Completed') return 'badge-success'
      return 'badge-danger' // Cancelled
    }
  }
}
</script>

<style scoped>
.font-bold {
  font-weight: 700;
  color: #3b82f6 !important;
}

.route-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-point {
  font-weight: 600;
}

.route-arrow {
  color: #6b7280;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.actions-cell {
  display: flex;
  gap: 6px;
  align-items: center;
}

.no-actions {
  color: #4b5563;
  font-size: 14px;
}

.mb-16 {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background-color: #1f2937;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
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
