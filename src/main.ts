import { createApp } from 'vue';
import App from './App.vue';
import { naive } from './utilities/naiveUI';
import { startLoop } from './composables/useLoop'; 

const app = createApp(App);
app.use(naive);

startLoop();

app.mount('#app');