import { createApp } from 'vue';
import App from './App.vue';
import { naive } from './utilities/naiveUI';
import { createPinia } from 'pinia';
import { piniaPlugin } from './utilities/piniaPlugin';
import { startLoop } from './composables/useLoop'; 

const pinia = createPinia();
pinia.use(piniaPlugin);

const app = createApp(App);
app.use(naive);
app.use(pinia);

startLoop();

app.mount('#app');