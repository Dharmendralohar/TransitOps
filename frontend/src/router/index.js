import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Vehicles from '../views/Vehicles.vue'
import Drivers from '../views/Drivers.vue'
import Trips from '../views/Trips.vue'
import Maintenance from '../views/Maintenance.vue'
import Expenses from '../views/Expenses.vue'
import Reports from '../views/Reports.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/vehicles', name: 'Vehicles', component: Vehicles },
  { path: '/drivers', name: 'Drivers', component: Drivers },
  { path: '/trips', name: 'Trips', component: Trips },
  { path: '/maintenance', name: 'Maintenance', component: Maintenance },
  { path: '/expenses', name: 'Expenses', component: Expenses },
  { path: '/reports', name: 'Reports', component: Reports },
  { path: '/settings', name: 'Settings', component: Settings }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
