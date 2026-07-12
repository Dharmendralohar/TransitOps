<template>
  <div class="drivers-view">
    <div class="view-header">
      <h2 class="view-title">👤 Driver Directory</h2>
      <div class="view-actions" v-if="canManageDrivers">
        <button class="btn btn-primary" @click="openCreateModal">+ Add Driver</button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Drivers List -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Driver Name</th>
            <th>License Number</th>
            <th>Category</th>
            <th>Expiry Date</th>
            <th>Contact</th>
            <th>Safety Score</th>
            <th>Status</th>
            <th>Linked User</th>
            <th v-if="canManageDrivers">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="driver in drivers" :key="driver.name">
            <td class="font-bold">{{ driver.driver_name }}</td>
            <td>{{ driver.license_number }}</td>
            <td>
              <span class="badge badge-secondary">{{ driver.license_category }}</span>
            </td>
            <td>
              <span :class="['expiry-date', { 'expired': isExpired(driver.license_expiry_date) }]">
                {{ formatDate(driver.license_expiry_date) }}
                <span v-if="isExpired(driver.license_expiry_date)" class="expired-label">(Expired)</span>
              </span>
            </td>
            <td>{{ formatContactNumber(driver.contact_number) }}</td>
            <td>
              <div class="safety-score-container">
                <span :class="['safety-score-badge', getSafetyScoreClass(driver.safety_score)]">
                  {{ driver.safety_score }} / 100
                </span>
              </div>
            </td>
            <td>
              <span :class="['badge', getStatusBadgeClass(driver.status)]">
                {{ driver.status }}
              </span>
            </td>
            <td>{{ driver.user || '-' }}</td>
            <td v-if="canManageDrivers">
              <div class="actions-cell">
                <button class="btn-icon" @click="openEditModal(driver)" title="Edit">✏️</button>
                <button class="btn-icon text-danger" @click="deleteDriver(driver)" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
          <tr v-if="!drivers.length">
            <td colspan="9" class="no-data">No drivers registered.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" v-if="modalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Driver' : 'Register New Driver' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveDriver">
            <div class="form-grid">
              <div class="form-group">
                <label>Driver Name</label>
                <input type="text" v-model="form.driver_name" class="form-control" required />
              </div>
              <div class="form-group">
                <label>License Number</label>
                <input type="text" v-model="form.license_number" class="form-control" required />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>License Category</label>
                <select v-model="form.license_category" class="form-control" required>
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>License Expiry Date</label>
                <input type="date" v-model="form.license_expiry_date" class="form-control" required />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Contact Number</label>
                <input type="tel" v-model="form.contact_number" class="form-control" required placeholder="+919876543210" />
              </div>
              <div class="form-group">
                <label>Safety Score (0 - 100)</label>
                <input type="number" v-model.number="form.safety_score" class="form-control" required min="0" max="100" />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Linked System User</label>
                <select v-model="form.user" class="form-control">
                  <option value="">No linked user</option>
                  <option v-for="userOpt in systemUsers" :key="userOpt.name" :value="userOpt.name">
                    {{ userOpt.name }} ({{ userOpt.email }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-control" required>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Driver</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Drivers',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      drivers: [],
      systemUsers: [],
      modalOpen: false,
      isEdit: false,
      errorMsg: '',
      form: {
        driver_name: '',
        license_number: '',
        license_category: 'LMV',
        license_expiry_date: '',
        contact_number: '',
        safety_score: 100,
        status: 'Available',
        user: ''
      }
    }
  },
  computed: {
    canManageDrivers() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Safety Officer') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchDrivers()
    if (this.canManageDrivers) {
      this.fetchUsers()
    }
  },
  methods: {
    async fetchDrivers() {
      try {
        const response = await fetch('/api/resource/Driver?fields=["*"]&limit_page_length=100')
        if (response.ok) {
          const res = await response.json()
          this.drivers = res.data || []
        }
      } catch (err) {
        console.error('Error fetching drivers:', err)
      }
    },
    async fetchUsers() {
      try {
        const response = await fetch('/api/resource/User?fields=["name","email"]&filters=[["enabled","=",1]]&limit_page_length=200')
        if (response.ok) {
          const res = await response.json()
          this.systemUsers = res.data || []
        }
      } catch (err) {
        console.error('Error fetching system users:', err)
      }
    },
    openCreateModal() {
      this.isEdit = false
      this.form = {
        driver_name: '',
        license_number: '',
        license_category: 'LMV',
        license_expiry_date: '',
        contact_number: '',
        safety_score: 100,
        status: 'Available',
        user: ''
      }
      this.modalOpen = true
    },
    openEditModal(driver) {
      this.isEdit = true
      this.form = { ...driver }
      this.modalOpen = true
    },
    closeModal() {
      this.modalOpen = false
      this.errorMsg = ''
    },
    async saveDriver() {
      try {
        const url = this.isEdit 
          ? `/api/resource/Driver/${encodeURIComponent(this.form.name)}`
          : '/api/resource/Driver'
        const method = this.isEdit ? 'PUT' : 'POST'
        const payload = this.buildDriverPayload()

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          this.closeModal()
          this.fetchDrivers()
        } else {
          const res = await response.json()
          this.errorMsg = this.parseServerMessages(res) || res.exception || 'Error while saving driver details.'
        }
      } catch (err) {
        this.errorMsg = 'Failed to connect to server.'
      }
    },
    buildDriverPayload() {
      const payload = { ...this.form }
      payload.contact_number = this.normalizeContactNumber(payload.contact_number)

      if (!payload.user) {
        delete payload.user
      }

      return payload
    },
    normalizeContactNumber(value) {
      const contact = String(value || '').trim()
      if (!contact) return contact
      if (contact.startsWith('+')) return contact

      const digits = contact.replace(/\D/g, '')
      if (digits.length === 10) {
        return `+91${digits}`
      }
      if (digits.length > 10) {
        return `+${digits}`
      }

      return contact
    },
    parseServerMessages(response) {
      if (!response._server_messages) return ''

      try {
        return JSON.parse(response._server_messages)
          .map(message => JSON.parse(message).message)
          .join(', ')
      } catch (err) {
        return ''
      }
    },
    async deleteDriver(driver) {
      if (!confirm(`Are you sure you want to delete driver ${driver.driver_name}?`)) {
        return
      }
      try {
        const response = await fetch(`/api/resource/Driver/${encodeURIComponent(driver.name)}`, {
          method: 'DELETE',
          headers: {
            'X-Frappe-CSRF-Token': window.csrf_token
          }
        })

        if (response.ok) {
          this.fetchDrivers()
        } else {
          alert('Failed to delete driver record. Check for linked trip documents.')
        }
      } catch (err) {
        console.error('Error deleting driver:', err)
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    },
    formatContactNumber(value) {
      const contact = String(value || '').trim()
      if (!contact) return '-'

      const digits = contact.replace(/\D/g, '')
      if (digits.length === 12 && digits.startsWith('91')) {
        return digits.slice(2)
      }

      return contact
    },
    isExpired(dateStr) {
      if (!dateStr) return false
      return new Date(dateStr) < new Date()
    },
    getSafetyScoreClass(score) {
      if (score >= 85) return 'score-excellent'
      if (score >= 60) return 'score-average'
      return 'score-poor'
    },
    getStatusBadgeClass(status) {
      if (status === 'Available') return 'badge-success'
      if (status === 'On Trip') return 'badge-warning'
      if (status === 'Off Duty') return 'badge-secondary'
      return 'badge-danger' // Suspended
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

.text-danger { color: #ef4444; }

.modal-footer-form {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Expiry Date */
.expiry-date {
  font-weight: 500;
}
.expiry-date.expired {
  color: #ef4444;
  font-weight: 600;
}
.expired-label {
  font-size: 11px;
  margin-left: 4px;
}

/* Safety Score */
.safety-score-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 700;
  font-size: 13px;
}

.score-excellent {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.score-average {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.score-poor {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
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
