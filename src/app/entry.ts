

// Import Library Module
const Vue = require('vue');
//const D3 = require("d3");
const Session = require('script/session').Session;

// Import CSS
const main_style = require('style/main');

// Import HTML layout (Vue like)
const train_page = require('layout/train');

interface Log {
  type: string;
  message: string;
}

interface TestResult {
  step: number;
  accuracy: number;
  inference: number[];
}

interface AppData {
  title: string;
  ui: {
    buttons: {
      start: boolean;
      cancel: boolean;
    };
    sample: {
      start: number;
      size: number;
    };
  };
  test: {
    labels: number[];
    logs: TestResult[];
  };
  logs: Log[];
}

class Logger {
  private logs: Log[];
  constructor(logs: Log[]){
    this.logs = logs;
  }
  public debug(m: string){ this.logs.push({type: 'debug', message: m}); }
  public error(m: string){ this.logs.push({type: 'error', message: m}); }
}

class App {
  private session: typeof Session;
  private el: string | HTMLElement;
  public data: AppData;
  private root: typeof Vue;
  public logger: Logger;
  private methods: any;
  public watcher: any;
  constructor(el: string | HTMLElement){
    this.el = el;
    this.data = {
      title: 'MNIST Visualize Example',
      ui: {
        buttons: {
          start: true,
          cancel: true
        },
        sample: {
          start: 0,
          size: 200,
        },
      },
      test: {
        labels: [],
        logs: []
      },
      logs: []
    };
    this.methods = {
      start_training: (event: Event) => {
        this.data.ui.buttons.start  = true;
        this.data.ui.buttons.cancel = false;
        this.session.send('start', null);
      },
      cancel_training: (event: Event) => {
        this.session.send('cancel', null);
      },
    };
    this.root = new Vue({
      el: this.el,
      data: this.data,
      methods: this.methods,
      watch: this.watcher,
      computed: {
        sampleTestData: () => {
          return this.data.test.logs[this.data.test.logs.length - 1].inference.slice(
            this.data.ui.sample.start,
            this.data.ui.sample.start + this.data.ui.sample.size);
        },
      },
    });
    this.logger = new Logger(this.data.logs);
    this.session = new Session('ws://' + location.host + '/streaming')
      .add_listener('message', this.on_session_message.bind(this))
      .add_listener('close', this.on_session_close.bind(this))
      .add_listener('error', this.on_session_error.bind(this));
  }
  private on_session_message(event: MessageEvent){
    console.log(event.data);
    let json = JSON.parse(event.data);
    switch(json.event){
      case 'open':
        this.data.ui.buttons.start = false;
        this.logger.debug('Session ID: ' + json.id);
        break;
      case 'start':
        this.logger.debug('Training started...');
        this.data.test.labels = json.data.test_labels;
        break;
      case 'test':
        this.data.test.logs.push({
          step: json.data.step,
          accuracy: Math.floor(json.data.accuracy * 10000) / 100,
          inference: json.data.inference,
        });
        break;
    }
  }
  private on_session_close(event: CloseEvent){
    this.logger.error('Connection closed: ' + event.code + ' - ' + event.reason);
  }
  private on_session_error(event: Event){
    this.logger.error('' + event);
  }
}


window.onload = function(){
  document.body.innerHTML = train_page;
  const app = new App('#app');
}

