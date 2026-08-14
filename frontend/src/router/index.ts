import { createRouter, createWebHistory } from 'vue-router'
import DiscoverView from '../views/DiscoverView.vue'
import SearchView from '../views/SearchView.vue'
import LibraryView from '../views/LibraryView.vue'

const routes = [
  { path: '/', name: 'discover', component: DiscoverView },
  { path: '/search', name: 'search', component: SearchView },
  { path: '/library', name: 'library', component: LibraryView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router