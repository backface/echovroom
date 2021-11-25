import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Chatroom from './views/Chatroom.vue'
import Mixer from './views/Mixer.vue'
import About from './views/About.vue'
import Monitor from './views/Monitor.vue'
import NotFound from './views/NotFound.vue'
import Echoroom from './views/Echoroom.vue'
import TextChat from './views/TextChat.vue'

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
      path: '/monitor',
      name: 'monitor',
      component: Monitor
    },
    {
      path: '/text/:roombyName',
      name: 'text',
      component: TextChat,
      props: (route) => ({
          roombyName: route.params.roombyName,
          embed:true,
      }),
    },
    {
      path: '/echoraeume',
      name: 'echoraeume',
      component: Echoroom,
      props: { roombyNamed: "echoraeume" } //2577359740
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
      path: '/vr/:roombyName',
      name: 'vr',
      component: Chatroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
          enterVR:true
      }),
    },
    {
      path: '/mix/:roombyName',
      name: 'mix',
      component: Mixer,
      props: (route) => ({
          roombyName: route.params.roombyName,
      }),
    },
    {
      path: '/embed/:roombyName',
      name: 'embed',
      component: Chatroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
          embed:true,
      }),
    },
    {
      path: '/present/:roombyName',
      name: 'present',
      component: Chatroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
          present:true,
      }),
    },

    // main chat
    {
      path: '/:roombyName',
      name: 'chat',
      component: Chatroom,
      props:true,
      //meta: { transitionName: 'zoom' },
    },

    { path: '*', component: NotFound}


    /*
    // various testing stuff

    {
      path: '/testing/:roombyName',
      name: 'vr',
      component: Testroom,
      props: (route) => ({
          roombyName: route.params.roombyName,
      }),
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
      path: '/D3test',
      name: 'D3test',
      component: D3test,
    },

    */


  ],
})
