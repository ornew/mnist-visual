
// Import Library Module
import Vue from 'vue'
//const D3 = require("d3");
import Session from 'session'
// Import CSS
const css = require('style/app');

// Import HTML layout (Vue like)
import Train from 'components/train'

class App {
  constructor(el){
    this.el = el;
    this.root = new Vue({
      el: this.el,
      data: {
        session: null,
      },
      mounted(){
        this.$el.querySelectorAll('code').forEach((block) => {
          hljs.highlightBlock(block)
        })
      },
      components: {
        Train,
      },
    });
    this.root.$data.session = new Session('ws://' + location.host + '/streaming')
      .addEventListener('message', this.onMessage.bind(this))
  }
  onMessage(event){
    console.log(event.data);
    let json = JSON.parse(event.data);
    switch(json.event){
      case 'open':
        console.log('Session ID: ' + json.id)
        break
    }
  }
  onClose(event){
    console.error('Connection closed: ' + event.code + ' - ' + event.reason);
  }
  onError(event){
    console.error('' + event);
  }
}

window.onload = function(){
  const app = new App('#app');
}

