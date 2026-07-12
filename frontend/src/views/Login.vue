<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Sign in to console</h1>
        <p class="login-subtitle">Access role-based dispatcher, fleet and maintenance dashboards.</p>
      </div>

      <!-- Error State Box -->
      <div v-if="errorMsg" class="error-box">
        <div class="error-icon">❌</div>
        <div class="error-text">
          <strong>Invalid credentials.</strong><br/>
          {{ errorMsg }}
        </div>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group mb-20">
          <label class="input-label">OPERATOR EMAIL ADDRESS</label>
          <div class="input-wrapper">
            <span class="input-icon">📧</span>
            <input 
              type="text" 
              v-model="usr" 
              class="form-control-login" 
              placeholder="jenkins@transitops.com" 
              required 
              :disabled="loading"
            />
          </div>
        </div>

        <div class="form-group mb-12">
          <label class="input-label">ACCESS PASSWORD</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input 
              type="password" 
              v-model="pwd" 
              class="form-control-login" 
              placeholder="••••••••" 
              required 
              :disabled="loading"
            />
          </div>
        </div>

        <p class="demo-bypass-text mb-20">Demo Mode: Enter any value to bypass verification.</p>

        <button type="submit" class="btn-login-submit" :disabled="loading">
          <span v-if="loading" class="spinner-btn"></span>
          <span>{{ loading ? "Authenticating..." : "Authenticate Credentials" }}</span>
        </button>
      </form>

      <!-- Quick Switcher Access Section -->
      <div class="switcher-divider">
        <span class="divider-line"></span>
        <span class="divider-text">QUICK SWITCHER ACCESS</span>
        <span class="divider-line"></span>
      </div>

      <div class="switcher-list">
        <div 
          v-for="profile in switcherProfiles" 
          :key="profile.email" 
          class="switcher-card" 
          @click="useQuickSwitcher(profile.email, profile.role)"
        >
          <div class="profile-avatar" :style="{ background: profile.avatarBg }">
            {{ profile.initial }}
          </div>
          <div class="profile-details">
            <div class="profile-name">{{ profile.name }}</div>
            <div class="profile-email">{{ profile.email }}</div>
          </div>
          <div class="profile-role-badge">
            {{ profile.role }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      usr: "",
      pwd: "",
      errorMsg: "",
      loading: false,
      switcherProfiles: [
        {
          name: "Daniel Jenkins",
          email: "d.jenkins@transitops.com",
          role: "Dispatcher",
          initial: "D",
          avatarBg: "linear-gradient(135deg, #a855f7, #6366f1)"
        },
        {
          name: "Lori Collins",
          email: "l.collins@transitops.com",
          role: "Fleet Manager",
          initial: "L",
          avatarBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)"
        },
        {
          name: "David Chen",
          email: "d.chen@transitops.com",
          role: "Safety Officer",
          initial: "D",
          avatarBg: "linear-gradient(135deg, #0ea5e9, #2563eb)"
        },
        {
          name: "Marcus Sterling",
          email: "m.sterling@transitops.com",
          role: "Financial Analyst",
          initial: "M",
          avatarBg: "linear-gradient(135deg, #6366f1, #4f46e5)"
        }
      ]
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.errorMsg = ""
      try {
        const response = await fetch("/api/method/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usr: this.usr,
            pwd: this.pwd
          })
        })

        if (response.ok) {
          // Set role display simulation
          let role = "Fleet Manager"
          const matchingProfile = this.switcherProfiles.find(p => p.email.toLowerCase() === this.usr.toLowerCase())
          if (matchingProfile) {
            role = matchingProfile.role
          } else if (this.usr.includes("manager")) {
            role = "Fleet Manager"
          } else if (this.usr.includes("safety")) {
            role = "Safety Officer"
          } else if (this.usr.includes("finance")) {
            role = "Financial Analyst"
          }
          localStorage.setItem("active_role", role)
          
          this.$emit("refresh-user")
          this.$router.push("/")
        } else {
          const res = await response.json()
          this.errorMsg = res.message || "Check username and password."
        }
      } catch (err) {
        this.errorMsg = "Failed to connect to the login server."
      } finally {
        this.loading = false
      }
    },
    useQuickSwitcher(email, role) {
      if (this.loading) return
      this.usr = email
      this.pwd = "password"
      this.handleLogin()
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background-color: #0b0f19;
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 16px;
  width: 100%;
  max-width: 460px;
  padding: 40px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-family: 'Outfit', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
}

.error-box {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.error-icon {
  font-size: 16px;
}

.error-text {
  font-size: 13px;
  color: #ef4444;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.75px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 15px;
  color: #6b7280;
  pointer-events: none;
}

.form-control-login {
  background-color: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 12px 14px 12px 42px;
  color: #ffffff;
  font-size: 15px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control-login:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.demo-bypass-text {
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.btn-login-submit {
  width: 100%;
  background-color: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background-color 0.2s, transform 0.1s;
}

.btn-login-submit:hover {
  background-color: #4338ca;
}

.btn-login-submit:active {
  transform: scale(0.99);
}

.btn-login-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-btn {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.switcher-divider {
  display: flex;
  align-items: center;
  margin: 32px 0 20px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background-color: #1f2937;
}

.divider-text {
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  color: #4b5563;
  letter-spacing: 1px;
}

.switcher-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.switcher-card {
  display: flex;
  align-items: center;
  background-color: rgba(17, 24, 39, 0.5);
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, transform 0.15s;
}

.switcher-card:hover {
  background-color: #1f2937;
  border-color: #374151;
  transform: translateY(-1px);
}

.switcher-card:active {
  transform: translateY(0);
}

.profile-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #ffffff;
  font-size: 14px;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.profile-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.profile-email {
  font-size: 11px;
  color: #9ca3af;
}

.profile-role-badge {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 3px 8px;
  background-color: rgba(31, 41, 55, 0.5);
  text-transform: capitalize;
}

.mb-12 { margin-bottom: 12px; }
.mb-20 { margin-bottom: 20px; }
</style>
