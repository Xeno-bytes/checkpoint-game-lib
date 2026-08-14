import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './index.css' // Make sure your styles are imported here!

const app = createApp(App)

app.use(router) // <-- Registers the router
app.mount('#app')