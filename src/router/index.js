import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path:'/',            name:'landing',     component:()=>import('@/views/LandingView.vue'),         meta:{guest:true}  },
  { path:'/login',       name:'login',       component:()=>import('@/views/LoginView.vue'),            meta:{guest:true}  },
  { path:'/register',    name:'register',    component:()=>import('@/views/RegisterView.vue'),         meta:{guest:true}  },
  { path:'/dashboard',   name:'dashboard',   component:()=>import('@/views/DashboardView.vue'),        meta:{auth:true,userOnly:true}  },
  { path:'/matching',    name:'matching',    component:()=>import('@/views/MatchingView.vue'),         meta:{auth:true,userOnly:true}  },
  { path:'/chat',        name:'chat',        component:()=>import('@/views/ChatView.vue'),             meta:{auth:true,userOnly:true}  },
  { path:'/chat/:id',    name:'chat-room',   component:()=>import('@/views/ChatView.vue'),             meta:{auth:true,userOnly:true}  },
  { path:'/profile',     name:'profile',     component:()=>import('@/views/ProfileView.vue'),          meta:{auth:true}   },
  { path:'/profile/:id', name:'user-profile',component:()=>import('@/views/ProfileView.vue'),          meta:{auth:true}   },
  { path:'/sessions',    name:'sessions',    component:()=>import('@/views/SessionView.vue'),          meta:{auth:true,userOnly:true}  },
  { path:'/leaderboard', name:'leaderboard', component:()=>import('@/views/LeaderboardView.vue'),      meta:{auth:true}   },
  { path:'/rewards',     name:'rewards',     component:()=>import('@/views/RewardsView.vue'),          meta:{auth:true,userOnly:true}  },
  { path:'/premium',     name:'premium',     component:()=>import('@/views/PremiumView.vue'),          meta:{auth:true,userOnly:true}  },
  { path:'/reports',     name:'reports',     component:()=>import('@/views/ReportView.vue'),           meta:{auth:true,userOnly:true}  },
  { path:'/admin',       name:'admin',       component:()=>import('@/views/admin/AdminDashboard.vue'), meta:{auth:true,admin:true}     },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth  && !auth.isAuth)          return { name:'login' }
  if (to.meta.guest && auth.isAuth)           return auth.homeRoute
  if (to.meta.userOnly && auth.isAdmin)       return { name:'admin' }
  if (to.meta.admin  && !auth.isAdmin)        return { name:'dashboard' }
})

export default router
