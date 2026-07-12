<template>
  <div class="expenses-view">
    <!-- View Tabs Header -->
    <div class="view-header-tabbed">
      <div class="tabs-container">
        <button :class="['tab-btn', { 'active': activeTab === 'fuel' }]" @click="activeTab = 'fuel'">
          ⛽ Fuel Logs
        </button>
        <button :class="['tab-btn', { 'active': activeTab === 'expense' }]" @click="activeTab = 'expense'">
          💳 Other Expenses
        </button>
      </div>
      <div class="view-actions">
        <button v-if="activeTab === 'fuel'" class="btn btn-primary" @click="openFuelModal">
          + Log Fuel
        </button>
        <button v-if="activeTab === 'expense'" class="btn btn-primary" @click="openExpenseModal">
          + Log Expense
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- TAB 1: FUEL LOGS -->
    <div v-if="activeTab === 'fuel'" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Trip</th>
            <th>Liters</th>
            <th>Cost</th>
            <th>Price / Liter</th>
            <th>Odometer Reading</th>
            <th v-if="canDeleteLogs">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in fuelLogs" :key="log.name">
            <td class="font-bold">{{ log.name }}</td>
            <td>{{ formatDate(log.date) }}</td>
            <td>{{ log.vehicle }}</td>
            <td>{{ log.trip || '-' }}</td>
            <td>{{ log.liters }} L</td>
            <td>${{ formatCurrency(log.cost) }}</td>
            <td>${{ formatCurrency(log.price_per_liter) }} / L</td>
            <td>{{ log.odometer_reading }} km</td>
            <td v-if="canDeleteLogs">
              <button class="btn-icon text-danger" @click="deleteFuelLog(log)">🗑️</button>
            </td>
          </tr>
          <tr v-if="!fuelLogs.length">
            <td colspan="9" class="no-data">No fuel logs found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- TAB 2: EXPENSES -->
    <div v-if="activeTab === 'expense'" class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Expense ID</th>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Trip</th>
            <th>Expense Type</th>
            <th>Amount</th>
            <th>Description</th>
            <th v-if="canDeleteLogs">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exp in expenses" :key="exp.name">
            <td class="font-bold">{{ exp.name }}</td>
            <td>{{ formatDate(exp.date) }}</td>
            <td>{{ exp.vehicle }}</td>
            <td>{{ exp.trip || '-' }}</td>
            <td>
              <span class="badge badge-secondary">{{ exp.expense_type }}</span>
            </td>
            <td class="text-danger font-semibold">${{ formatCurrency(exp.amount) }}</td>
            <td>{{ exp.description || '-' }}</td>
            <td v-if="canDeleteLogs">
              <button class="btn-icon text-danger" @click="deleteExpense(exp)">🗑️</button>
            </td>
          </tr>
          <tr v-if="!expenses.length">
            <td colspan="8" class="no-data">No expenses recorded.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Fuel Log Modal -->
    <div class="modal-backdrop" v-if="fuelModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>⛽ Log Fuel Purchase</h3>
          <button class="modal-close" @click="closeFuelModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveFuelLog">
            <div class="form-grid">
              <div class="form-group">
                <label>Vehicle</label>
                <select v-model="fuelForm.vehicle" class="form-control" required>
                  <option value="">Select Vehicle</option>
                  <option v-for="v in vehicles" :key="v.name" :value="v.name">
                    {{ v.name }} - {{ v.vehicle_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Linked Trip (Optional)</label>
                <select v-model="fuelForm.trip" class="form-control">
                  <option value="">No linked trip</option>
                  <option v-for="t in trips" :key="t.name" :value="t.name">
                    {{ t.name }} ({{ t.source }} ➔ {{ t.destination }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Date</label>
                <input type="date" v-model="fuelForm.date" class="form-control" required />
              </div>
              <div class="form-group">
                <label>Odometer Reading (km)</label>
                <input type="number" v-model.number="fuelForm.odometer_reading" class="form-control" required min="0" />
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Liters Refueled</label>
                <input type="number" v-model.number="fuelForm.liters" class="form-control" required min="0.01" step="0.01" />
              </div>
              <div class="form-group">
                <label>Total Cost ($)</label>
                <input type="number" v-model.number="fuelForm.cost" class="form-control" required min="0" step="0.01" />
              </div>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeFuelModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Fuel Log</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Expense Modal -->
    <div class="modal-backdrop" v-if="expenseModalOpen">
      <div class="modal-content">
        <div class="modal-header">
          <h3>💳 Log Other Expense</h3>
          <button class="modal-close" @click="closeExpenseModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveExpense">
            <div class="form-grid">
              <div class="form-group">
                <label>Vehicle</label>
                <select v-model="expenseForm.vehicle" class="form-control" required>
                  <option value="">Select Vehicle</option>
                  <option v-for="v in vehicles" :key="v.name" :value="v.name">
                    {{ v.name }} - {{ v.vehicle_name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Linked Trip (Optional)</label>
                <select v-model="expenseForm.trip" class="form-control">
                  <option value="">No linked trip</option>
                  <option v-for="t in trips" :key="t.name" :value="t.name">
                    {{ t.name }} ({{ t.source }} ➔ {{ t.destination }})
                  </option>
                </select>
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label>Expense Type</label>
                <select v-model="expenseForm.expense_type" class="form-control" required>
                  <option value="Toll">Toll</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Fine">Fine</option>
                  <option value="Parking">Parking</option>
                  <option value="Permit">Permit</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Date</label>
                <input type="date" v-model="expenseForm.date" class="form-control" required />
              </div>
            </div>

            <div class="form-group mb-16">
              <label>Amount ($)</label>
              <input type="number" v-model.number="expenseForm.amount" class="form-control" required min="0" step="0.01" />
            </div>

            <div class="form-group">
              <label>Description / Notes</label>
              <textarea v-model="expenseForm.description" class="form-control" rows="3" placeholder="Enter details about this expense..."></textarea>
            </div>
            
            <div class="modal-footer-form">
              <button type="button" class="btn btn-secondary" @click="closeExpenseModal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Expense</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Expenses',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'fuel',
      fuelLogs: [],
      expenses: [],
      vehicles: [],
      trips: [],
      fuelModalOpen: false,
      expenseModalOpen: false,
      errorMsg: '',
      fuelForm: {
        vehicle: '',
        trip: '',
        date: '',
        odometer_reading: 0,
        liters: 0,
        cost: 0
      },
      expenseForm: {
        vehicle: '',
        trip: '',
        expense_type: 'Toll',
        date: '',
        amount: 0,
        description: ''
      }
    }
  },
  computed: {
    canDeleteLogs() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('Financial Analyst') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchFuelLogs()
    this.fetchExpenses()
    this.fetchVehicles()
    this.fetchTrips()
  },
  methods: {
    async fetchFuelLogs() {
      try {
        const response = await fetch('/api/resource/Fuel Log?fields=["*"]&limit_page_length=100&order_by=date desc')
        if (response.ok) {
          const res = await response.json()
          this.fuelLogs = res.data || []
        }
      } catch (err) {
        console.error('Error fetching fuel logs:', err)
      }
    },
    async fetchExpenses() {
      try {
        const response = await fetch('/api/resource/Expense?fields=["*"]&limit_page_length=100&order_by=date desc')
        if (response.ok) {
          const res = await response.json()
          this.expenses = res.data || []
        }
      } catch (err) {
        console.error('Error fetching expenses:', err)
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
    async fetchTrips() {
      try {
        const response = await fetch('/api/resource/Trip?fields=["name","source","destination"]&limit_page_length=200')
        if (response.ok) {
          const res = await response.json()
          this.trips = res.data || []
        }
      } catch (err) {
        console.error('Error fetching trips:', err)
      }
    },
    openFuelModal() {
      this.fuelForm = {
        vehicle: '',
        trip: '',
        date: new Date().toISOString().substring(0, 10),
        odometer_reading: 0,
        liters: 10,
        cost: 15
      }
      this.fuelModalOpen = true
    },
    closeFuelModal() {
      this.fuelModalOpen = false
      this.errorMsg = ''
    },
    async saveFuelLog() {
      try {
        const response = await fetch('/api/resource/Fuel Log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify(this.fuelForm)
        })

        if (response.ok) {
          this.closeFuelModal()
          this.fetchFuelLogs()
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Error while saving fuel log.'
        }
      } catch (err) {
        this.errorMsg = 'Connection issue.'
      }
    },
    openExpenseModal() {
      this.expenseForm = {
        vehicle: '',
        trip: '',
        expense_type: 'Toll',
        date: new Date().toISOString().substring(0, 10),
        amount: 5,
        description: ''
      }
      this.expenseModalOpen = true
    },
    closeExpenseModal() {
      this.expenseModalOpen = false
      this.errorMsg = ''
    },
    async saveExpense() {
      try {
        const response = await fetch('/api/resource/Expense', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify(this.expenseForm)
        })

        if (response.ok) {
          this.closeExpenseModal()
          this.fetchExpenses()
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Error while saving expense details.'
        }
      } catch (err) {
        this.errorMsg = 'Connection issue.'
      }
    },
    async deleteFuelLog(log) {
      if (!confirm('Are you sure you want to delete this fuel log?')) return
      try {
        const response = await fetch(`/api/resource/Fuel Log/${encodeURIComponent(log.name)}`, {
          method: 'DELETE',
          headers: { 'X-Frappe-CSRF-Token': window.csrf_token }
        })
        if (response.ok) this.fetchFuelLogs()
      } catch (err) {
        console.error(err)
      }
    },
    async deleteExpense(exp) {
      if (!confirm('Are you sure you want to delete this expense log?')) return
      try {
        const response = await fetch(`/api/resource/Expense/${encodeURIComponent(exp.name)}`, {
          method: 'DELETE',
          headers: { 'X-Frappe-CSRF-Token': window.csrf_token }
        })
        if (response.ok) this.fetchExpenses()
      } catch (err) {
        console.error(err)
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

.text-danger {
  color: #ef4444;
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
}

.btn-icon:hover {
  background-color: #1f2937;
}

.view-header-tabbed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 12px;
}

.tabs-container {
  display: flex;
  gap: 16px;
}

.tab-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #ffffff;
  background-color: #1f2937;
}

.tab-btn.active {
  color: #3b82f6;
  background-color: #1e293b;
  border: 1px solid rgba(59, 130, 246, 0.2);
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
