import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './index.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Wait for Firebase auth status before mounting
const authStore = useAuthStore();
authStore.initAuth().then(() => {
  app.mount('#app');
});