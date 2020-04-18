import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Chatroom from './views/Chatroom.vue'
import About from './views/About.vue'
import NotFound from './views/NotFound.vue'
import Echoroom from './views/Echoroom.vue'


Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/about',
      name: 'about',
      component: About
    },
    {
      path: '/echoraeume',
      name: 'echoraeume',
      component: Echoroom,
      props:true,
    },
    {
      path: '/:roombyName',
      name: 'chat',
      component: Chatroom,
      props:true,
      //meta: { transitionName: 'zoom' },
    },
/*    {
      path: '/gameview/:id',
      name: 'gameview',
      component: GameView,
      props:true
    },*/
    { path: '*', component: NotFound}
  ],
})
