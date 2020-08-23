<template>
  <div class="monitor">

    <div class="" v-if="!logged_in">
      ACCESS DENIED
    </div>

    <div v-for="info in nested_infos" :key="info.key" class="m">
      {{ info.key }} ( {{ info.values.length }}) <br/>
      <LineChart :data="info.series" :length="info.series.length" />
    </div>

    <login-dialog ref="login"></login-dialog>
    <alert-dialog ref="alert"></alert-dialog>
  </div>
</template>

<script>
import Janus from '../janus';
import * as d3 from 'd3';

import LoginDialog from '@/components/dialogs/LoginDialog'
import AlertDialog from '@/components/dialogs/AlertDialog'
import LineChart from '@/components/LineChart'

export default {
  name: 'About',

  components: {
    LoginDialog, AlertDialog, LineChart
  },

  data() {
    return {
      url: "https://" +  window.location.hostname + ":7889/admin",
      password: null,
      infos: [],
      nested_infos: [],
      series: [],
      logged_in: false
    }
  },

  mounted () {
    let self = this;
    this.$refs.login.open("Login?", {
      with_password: true,
      with_name:false,
    } ).then((r) => {
      this.password = r.pin;

      let request = { "janus": "list_sessions", "transaction": Janus.randomString(12), "admin_secret": this.password };

      d3.json(this.url,
           { method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
           body: JSON.stringify(request)
       }).then( (d) => {
         console.log(d);
         if (d.error) {
           self.$refs.alert.open(d.error.reason);
           this.logged_in =false;
         } else {
           this.logged_in = true;
           setTimeout(function () { self.update() }, 1000)
         }
      })
    })
  },

  destroyed () {
  },

  methods: {
    update_infos() {
      let self = this;
      let new_infos = [];
      let request = { "janus": "list_sessions", "transaction": Janus.randomString(12), "admin_secret": this.password };

      d3.json(this.url,
           { method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
           body: JSON.stringify(request)
       }).then( (d) => {
         if (d.error) {
           self.$refs.alert.open(d.error.reason);
         } else {
           d.sessions.forEach( (session) => {
             let request = { "janus": "list_handles", "transaction": Janus.randomString(12), "admin_secret": this.password };
             d3.json(this.url  + "/" + session,
                  { method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
                  body: JSON.stringify(request)
              }).then( (d) => {
                  let request = { "janus": "handle_info", "transaction": Janus.randomString(12), "admin_secret": this.password };
                   d.handles.forEach( (handle) => {
                     d3.json(this.url  + "/" + session + "/" + handle,
                          {  method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
                          body: JSON.stringify(request)
                      }).then( (d) => {
                        new_infos.push(d.info);
                      })
                   })
              })
           })
         }
      });
    },


    async asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    },

    async update() {
      let self = this;
      let new_infos = [];
      let request = { "janus": "list_sessions", "transaction": Janus.randomString(12), "admin_secret": self.password };

      var d = await d3.json(self.url,
        {
          method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
          body: JSON.stringify(request)
       }
      )

      await self.asyncForEach(d.sessions, async (session) => {
        let request = { "janus": "list_handles", "transaction": Janus.randomString(12), "admin_secret": self.password };
        let d = await d3.json(self.url  + "/" + session,
          {
            method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
            body: JSON.stringify(request)
          }
        );
        await self.asyncForEach(d.handles, async (handle) => {
          let request = { "janus": "handle_info", "transaction": Janus.randomString(12), "admin_secret": self.password };
          let d = await d3.json(self.url  + "/" + session + "/" + handle  ,
            {
              method: 'POST', headers: { "Content-type": "application/json; charset=UTF-8" },
              body: JSON.stringify(request)
            }
          );
          new_infos.push(d.info)
        });
      });

      self.infos = new_infos
      self.nested_infos = d3.nest()
        .key(function(d) { return d.plugin; })
        .entries(new_infos);
      setTimeout(function () { self.update() }, 3000)

      self.nested_infos.forEach( (info) => {
        if (info.key in self.series) {
          //
        } else {
          self.series[info.key] = []
        }

        self.series[info.key].push(info.values.length)
        //self.series[info.key].push(Math.random()* 100)
        info.series = self.series[info.key]
      })
      console.log(self.nested_infos);
    }
  }

}
</script>

<style>
.about a { text-decoration: underline; color:black !important}
.about h1.title { margin-bottom: 3rem}
.about { text-align: left}
.m { float: left; }
</style>
