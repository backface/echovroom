import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Chatroom from './views/Chatroom.vue'
import About from './views/About.vue'
import NotFound from './views/NotFound.vue'
import Echoroom from './views/Echoroom.vue'
import Demoroom from './views/Demoroom.vue'
import Eventroom from './views/Eventroom.vue'

import VideoTest from './components/VideoTest.vue'
import VideoTest2 from './components/VideoTest2.vue'
import VideoTest3 from './components/VideoTest3.vue'
import VideoTest4 from './components/VideoTest4.vue'

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
      props: { room: 777 } //2577359740
    },
    {
      path: '/demoroom',
      name: 'demoroom',
      component: Demoroom,
      props: { room: 1234}
    },
    {
      path: '/embed/:roombyName',
      name: 'embed',
      component: Chatroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
          embed:true,
          hans:"zasdfasd",
      }),
    },
    {
      path: '/:roombyName',
      name: 'chat',
      component: Chatroom,
      props:true,
      //meta: { transitionName: 'zoom' },
    },

    {
      path: '/facetime/:roombyName',
      name: 'facetime',
      component: Chatroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
          facetime:true
      }),
    },

    {
      path: '/event',
      name: 'even',
      component: Eventroom,
    },

    {
      path: '/videotest',
      name: 'videotest',
      component: VideoTest,
    },
    {
      path: '/videotest2',
      name: 'videotest2',
      component: VideoTest2,
    },
    {
      path: '/videotest3',
      name: 'videotest3',
      component: VideoTest3,
    },
    {
      path: '/VideoTest4',
      name: 'videotest4',
      component: VideoTest4,
    },

    { path: '*', component: NotFound}
  ],
})
