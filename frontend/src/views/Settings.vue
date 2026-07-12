<template>
  <div class="settings-view">
    <div class="view-header">
      <h2 class="view-title">⚙️ System Settings</h2>
    </div>

    <!-- Alert Messages -->
    <div v-if="successMsg" class="alert alert-success">
      {{ successMsg }}
      <button class="alert-close" @click="successMsg = ''">×</button>
    </div>
    <div v-if="errorMsg" class="alert alert-danger">
      {{ errorMsg }}
      <button class="alert-close" @click="errorMsg = ''">×</button>
    </div>

    <!-- Settings Card -->
    <div class="settings-card">
      <div v-if="!canManageSettings" class="alert alert-warning">
        🔒 You do not have permission to modify system settings. Displayed in Read-Only mode.
      </div>

      <form @submit.prevent="saveSettings">
        <!-- General Settings Section -->
        <h3 class="section-title">General Settings</h3>
        
        <div class="form-group mb-20">
          <label>Depot Name</label>
          <input 
            type="text" 
            v-model="settings.depot_name" 
            class="form-control" 
            placeholder="e.g. Gandhinagar" 
            :disabled="!canManageSettings" 
          />
          <p class="help-text">Set the default depot or base of operations name.</p>
        </div>

        <div class="form-group mb-20">
          <label>Currency</label>
          <select v-model="settings.currency" class="form-control" :disabled="!canManageSettings">
            <option value="INR">INR (Rs.)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
          <p class="help-text">Select system currency for pricing and cost computations.</p>
        </div>

        <div class="form-group mb-20">
          <label>Distance Unit</label>
          <select v-model="settings.distance_unit" class="form-control" :disabled="!canManageSettings">
            <option value="Kilometers">Kilometers</option>
            <option value="Miles">Miles</option>
          </select>
          <p class="help-text">Choose unit of measure for vehicle odometer tracking.</p>
        </div>

        <!-- Compliance & Reminders Section -->
        <h3 class="section-title mt-30">Compliance & Reminders</h3>

        <div class="form-group mb-24">
          <label class="checkbox-label">
            <input type="checkbox" v-model="settings.enable_license_reminders" :disabled="!canManageSettings" />
            <span class="checkbox-text">Enable Driver & Vehicle License Expiry Reminders</span>
          </label>
          <p class="help-text">When checked, the system will run a daily background check and email alerts for drivers and vehicles with upcoming or expired licenses.</p>
        </div>

        <div class="form-group mb-24" v-if="settings.enable_license_reminders">
          <label>Reminder Period (Days before expiry)</label>
          <input type="number" v-model.number="settings.license_reminder_days" class="form-control" required min="1" :disabled="!canManageSettings" />
          <p class="help-text">Configure how many days in advance of expiration notifications should be sent (default is 30 days).</p>
        </div>

        <div class="form-group mb-24" v-if="settings.enable_license_reminders">
          <label>Reminder Recipients (Comma-separated email addresses)</label>
          <textarea v-model="settings.reminder_recipients" class="form-control" rows="3" placeholder="e.g. manager@example.com, safety@example.com" :disabled="!canManageSettings"></textarea>
          <p class="help-text">Leave blank to automatically email all users with the "Safety Officer" role.</p>
        </div>

        <div class="settings-actions" v-if="canManageSettings">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Saving Settings...' : 'Save Configuration' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Settings',
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      saving: false,
      successMsg: '',
      errorMsg: '',
      settings: {
        depot_name: 'Gandhinagar',
        currency: 'INR',
        distance_unit: 'Kilometers',
        enable_license_reminders: 1,
        license_reminder_days: 30,
        reminder_recipients: ''
      }
    }
  },
  computed: {
    canManageSettings() {
      const roles = this.user.roles || []
      return roles.includes('Fleet Manager') || roles.includes('System Manager')
    }
  },
  created() {
    this.fetchSettings()
  },
  methods: {
    async fetchSettings() {
      try {
        const response = await fetch('/api/resource/TransitOps Settings/TransitOps Settings')
        if (response.ok) {
          const res = await response.json()
          if (res.data) {
            this.settings = { ...this.settings, ...res.data }
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      }
    },
    async saveSettings() {
      this.saving = true
      this.successMsg = ''
      this.errorMsg = ''
      try {
        const response = await fetch('/api/resource/TransitOps Settings/TransitOps Settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': window.csrf_token
          },
          body: JSON.stringify(this.settings)
        })

        if (response.ok) {
          this.successMsg = 'System settings updated successfully.'
          this.fetchSettings()
        } else {
          const res = await response.json()
          this.errorMsg = res._server_messages 
            ? JSON.parse(res._server_messages).map(m => JSON.parse(m).message).join(', ')
            : 'Failed to update system settings.'
        }
      } catch (err) {
        this.errorMsg = 'Failed to connect to the server.'
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.settings-view {
  padding: 8px;
}

.view-header {
  margin-bottom: 24px;
}

.view-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.settings-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 32px;
  max-width: 650px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 20px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 8px;
}

.mt-30 {
  margin-top: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.help-text {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

.mb-24 {
  margin-bottom: 24px;
}

.settings-actions {
  display: flex;
  justify-content: flex-start;
  margin-top: 32px;
  border-top: 1px solid #1f2937;
  padding-top: 24px;
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

.alert-success {
  background-color: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.alert-warning {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
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
