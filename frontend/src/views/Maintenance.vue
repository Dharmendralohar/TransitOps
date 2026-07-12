<template>
  <div class="maintenance-view">
    <div class="view-header">
      <h2 class="view-title">🔧 Maintenance Records</h2>
      <div class="view-actions" v-if="canManageMaintenance">
        <button class="btn btn-primary" @click="openCreateModal">+ Log Maintenance</button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Maintenance Table -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Vehicle</th>
            <th>Type</th>
            <th>Start Date</th>
            <th>Completion Date</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Notes</th>
            <th v-if="canManageMaintenance">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.name">
            <td class="font-bold">{{ log.name }}</td>
            <td>{{ log.vehicle }}</td>
            <td>
              <span class="badge badge-secondary">{{ log.maintenance_type }}</span>
            </td>
            <td>{{ formatDate(log.date) }}</td>
            <td>{{ log.completion_date ? formatDate(log.completion_date) : '-' }}</td>
            <td>${{ formatCurrency(log.cost) }}</td>
            <td>
              <span :class="['badge', getStatusBadgeClass(log.status)]">
                {{ log.status }}
              </span>
            </td>
            <td>{{ log.notes || '-' }}</td>
            <td v-if="canManageMaintenance">
              <div class="actions-cell" v-if="log.status === 'Active'">
                <button class="btn btn-primary btn-xs" @click="openCloseModal(log)">
                  🏁 Close Log
                </button>
                <button class="btn btn-secondary btn-xs" @click="openEditModal(log)">
                  Edit
                </button>
              </div>
              <span v-else class="no-actions">-</span>
            </td>
          </tr>
          <tr v-if="!logs.length">
            <td colspan="9" class="no-data">No maintenance logs recorded.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-backdrop" v-if="modalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Maintenance Log' : 'Log Maintenance' }}</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveLog">
            <div class="form-grid">
              <div class="form-group">
                <label>Vehicle</label>
                <select v-model="form.vehicle" class="form-control" required :disabled="isEdit">
                  <option value="">Select Vehicle</option>
                  <option v-for="v in vehicles" :key="v.name" :value="v.name">
                    {{ v.name }} - {{ v.vehicle_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Maintenance Type</label>
                <select v-model="form.maintenance_type" class="form-control" required>
                  <option value="Oil Change">Oil Change</option>
                  <option value="Tire Replacement">Tire Replacement</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" v-model="form.date" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="form.status" class="form-control" required>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div class="form-grid" v-if="form.status === 'Closed'">
              <div class="form-group">
                <label>Completion Date</label>
                <input type="date" v-model="form.completion_date" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Total Cost ($)</label>
                <input type="number" v-model.number="form.cost" class="form-control" required min="0" step="0.01" />
              </div>
            </div>

            <div class="form-group">
              <label>Notes</label>
              <textarea v-model="form.notes" class="form-control" rows="3" placeholder="Enter service description, parts replaced, etc."></textarea>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Log</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Close Log Modal -->
    <div class="modal-backdrop" v-if="closeModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🏁 Close Maintenance Log: {{ selectedLog.name }}</h3>
          <button class="modal-close" @click="closeModalOpen = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="submitCloseLog">
            <div class="form-group mb-16">
              <label>Completion Date</label>
              <input type="date" v-model="closeForm.completion_date" class="form-control" required />
            </div>

            <div class="form-group mb-16">
              <label>Total Cost ($)</label>
              <input type="number" v-model.number="closeForm.cost" class="form-control" required min="0" step="0.01" />
            </div>

            <div class="form-group mb-16">
              <label>Notes</label>
              <textarea v-model="closeForm.notes" class="form-control" rows="2" placeholder="Final service logs..."></textarea>
            </div>

            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeModalOpen = false">Cancel</button>
              <button type="submit" class="btn btn-success">Close &amp; Complete</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Maintenance',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      logs: [],
      vehicles: [],
      modalOpen: false,
      isEdit: false,
      closeModalOpen: false,
      selectedLog: null,
      errorMsg: '',
      form: {
        vehicle: '',
        maintenance_type: 'Oil Change',
        date: '',
        completion_date: '',
        cost: 0,
        status: 'Active',
        notes: ''
      },
      closeForm: {
        completion_date: '',
        cost: 0,
        notes: ''
      }
    }
  },
  computed: {
    canManageMaintenance() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Safety Officer') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchLogs()
    this.fetchVehicles()
  },
  methods: {
    async fetchLogs() {
      try {
        const response = await fetch('/api/resource/Maintenance Log?fields=["*"]&limit_page_length=100&order_by=creation desc')
        if (response.ok) {
          const res = await response.json()
          this.logs = res.data || []
        }
      } catch (err) {
        console.error('Error fetching logs:', err)
      }
    },
    async fetchVehicles() {
      try {
        const response = await fetch('/api/resource/Vehicle?fields=["name","vehicle_name"]&limit_page_length=200')
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
        vehicle: '',
        maintenance_type: 'Oil Change',
        date: new Date().toISOString().substring(0, 10),
        completion_date: '',
        cost: 0,
        status: 'Active',
        notes: ''
      }
      this.modalOpen = true
    },
    openEditModal(log) {
      this.isEdit = true
      this.form = { ...log }
      this.modalOpen = true
    },
    closeModal() {
      this.modalOpen = false
      this.errorMsg = ''
    },
    async saveLog() {
      try {
        const url = this.isEdit 
          ? `/api/resource/Maintenance Log/${encodeURIComponent(this.form.name)}`
          : '/api/resource/Maintenance Log'
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
          this.fetchLogs()
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Error while saving maintenance log.'
        }
      } catch (err) {
        this.errorMsg = 'Connection issue while saving.'
      }
    },
    openCloseModal(log) {
      this.selectedLog = log
      this.closeForm = {
        completion_date: new Date().toISOString().substring(0, 10),
        cost: log.cost || 0,
        notes: log.notes || ''
      }
      this.closeModalOpen = true
    },
    async submitCloseLog() {
      try {
        const response = await fetch(`/api/resource/Maintenance Log/${encodeURIComponent(this.selectedLog.name)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify({
            status: 'Closed',
            completion_date: this.closeForm.completion_date,
            cost: this.closeForm.cost,
            notes: this.closeForm.notes
          })
        })

        if (response.ok) {
          this.closeModalOpen = false
          this.fetchLogs()
        } else {
          const res = await response.json()
          alert(res._server_messages ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ') : 'Failed to close maintenance log.')
        }
      } catch (err) {
        console.error('Failed to close log:', err)
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    },
    formatCurrency(val) {
      return parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    },
    getStatusBadgeClass(status) {
      if (status === 'Active') return 'badge-warning'
      return 'badge-success' // Closed
    }
  }
}
</script>

<style scoped>
.font-bold {
  font-weight: 700;
  color: #3b82f6 !important;
}

.btn-xs {
  padding: 4px 8px;
  font-size: 11px;
}

.actions-cell {
  display: flex;
  gap: 6px;
}

.no-actions {
  color: #4b5563;
  font-size: 14px;
}

.mb-16 {
  margin-bottom: 16px;
}

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
