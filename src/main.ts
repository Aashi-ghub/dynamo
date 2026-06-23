import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './assets/tailwind.css';
import App from './App.vue';
import { authService } from './services/authService';
import { useAuthStore } from './stores/authStore';

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);

  const authStore = useAuthStore(pinia);
  const callbackSession = await authService.handleSignInCallback();
  if (callbackSession) {
    authStore.setAuth(callbackSession.token, callbackSession.user);
  } else {
    await authStore.hydrate();
  }

  app.mount('#app');
}

bootstrap();
