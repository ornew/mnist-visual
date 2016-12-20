
const chart = require('chart.js');
const ons = require('onsenui');

const ons_css = require('onsenui/css/onsenui');
const ons_cmp_css = require('onsenui/css/onsen-css-components');
const main_page = require('layout/main');
const train_page = require('layout/train');
const main_style = require('style/main');


var context: any;
var canvas: any;
var step_seekbar: HTMLInputElement;
var step_display: HTMLElement;
var chart_results: typeof chart;
var mf = false;
var ox = 0;
var oy = 0;
var x = 0;
var y = 0;
var step = 1000;

var evalute_button: HTMLInputElement;
var progress: HTMLElement;

function onDown(event: any){
  mf=true;
  ox=event.touches[0].pageX-event.target.getBoundingClientRect().left;
  oy=event.touches[0].pageY-event.target.getBoundingClientRect().top;
  event.stopPropagation();
}

function onMove(event: any){
  if(mf){
    x=event.touches[0].pageX-event.target.getBoundingClientRect().left;
    y=event.touches[0].pageY-event.target.getBoundingClientRect().top;
    drawLine();
    ox=x;
    oy=y;
    event.preventDefault();
    event.stopPropagation();
  }
}

function onUp(event: any){
  mf=false;
  event.stopPropagation();
}

function onMouseDown(event: any){
  ox=event.clientX-event.target.getBoundingClientRect().left;
  oy=event.clientY-event.target.getBoundingClientRect().top ;
  mf=true;
}

function onMouseMove(event: any){
  if(mf){
    x=event.clientX-event.target.getBoundingClientRect().left;
    y=event.clientY-event.target.getBoundingClientRect().top ;
    drawLine();
    ox=x;
    oy=y;
  }
}

function onMouseUp(event: any){
  mf=false;
}

function drawLine(){
  context.beginPath();
  context.moveTo(ox,oy);
  context.lineTo(x,y);
  context.stroke();
}

function clearCanvas(){
  context.fillStyle = "rgb(255,255,255)";
  context.fillRect( 0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height );
}

function getPixels(){
  var pixels = context.getImageData(0, 0, 28, 28).data;
  var result: number[] = [];
  for(var y = 0; y < 28; ++y) {
    for(var x = 0; x < 28; ++x) {
      var i = (y * 28 + x) * 4;
      result.push((255 - pixels[i]) / 255);
    }
  }
  return result;
}

function print(m: any) {
  var log = document.createElement('p');
  log.innerHTML = m;
  document.getElementById("log").appendChild(log);
}

function error(m: any) {
  var now = new Date();
  var log = document.createElement('p');
  log.className = 'error';
  log.innerHTML = '<time>[' + now.toDateString() + ' ' + now.toLocaleTimeString() + ']</time>' + m;
  document.getElementById("log").appendChild(log);
}

function evalute() {
  evalute_button.disabled = true;
  progress.style.opacity = '1';
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4){
      switch(this.status) {
        case 200:
          console.log(this.responseText);
          var response = JSON.parse(this.responseText);
          if('error' in response) {
            error(response['error']);
            break;
          }
          document.getElementById("inference").innerHTML = response['inference'];
          for(var i = 0; i < 10; ++i) {
            chart_results.data.datasets[0].data[i] = response['results'][i];
          }
          chart_results.update();
          break;
      }
      progress.style.opacity = '0';
      evalute_button.disabled = false;
    }
  };
  xhttp.open('POST', '/api/evalute.json', true);
  xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhttp.send('payload=' + JSON.stringify({
    'data': getPixels(),
    'step': step
  }));
}

function onSeekStepConfig(){
  step = parseInt(step_seekbar.value);
  step_display.innerHTML = step_seekbar.value;
}


function aaa(){
  canvas = document.getElementById("canvas");
  canvas.addEventListener("touchstart",onDown,false);
  canvas.addEventListener("touchmove",onMove,false);
  canvas.addEventListener("touchend",onUp,false);
  canvas.addEventListener("mousedown",onMouseDown,false);
  canvas.addEventListener("mousemove",onMouseMove,false);
  canvas.addEventListener("mouseup",onMouseUp,false);
  canvas.setAttribute("width", 28);
  canvas.setAttribute("height", 28);

  const clear_button = document.getElementById("clear");
  clear_button.addEventListener("click", clearCanvas);

  evalute_button = <HTMLInputElement> document.getElementById("evalute");
  evalute_button.addEventListener("click", evalute);

  progress = document.getElementById("progress");
  progress.style.opacity = '0';

  context = canvas.getContext( "2d" );
  context.scale(0.1, 0.1);
  context.strokeStyle="#000000";
  context.lineWidth = 10;
  context.lineJoin  = "round";
  context.lineCap   = "round";
  clearCanvas();

  step_seekbar = <HTMLInputElement> document.getElementById("step-seekbar");
  step_display = document.getElementById("step-display");
  step_seekbar.addEventListener("input", onSeekStepConfig);

  chart_results = new chart(document.getElementById("results"), {
    type: 'bar',
    data: {
      labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      datasets: [{
        label: 'Predicted distribution',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            max: 15,
            min: -15,
            stepSize: 5
          }
        }]
      }
    }
  });
}

const Session = require('script/session').Session;

class App {

}

class Logger {
  private log: HTMLElement;
  constructor(log: HTMLElement){
    this.log = log;
  }
  print(message: string){
    let now = new Date();
    let log = document.createElement('p');
    log.innerHTML
      = '<time>[' + now.toDateString() + ' ' + now.toLocaleTimeString() + ']</time>'
      + '<span>' + message + '</span>';
    this.log.appendChild(log);
    return log;
  }
  debug(message: string){
    this.print(message).classList.add('debug');
  }
  error(message: string){
    this.print(message).classList.add('error');
  }
}

window.onload = function(){
  document.body.innerHTML = train_page;
  const samples = <HTMLElement> document.getElementById('test_sample');
  let frag = document.createDocumentFragment();
  let test: {
    labels: number[];
    sample: {
      size: number;
      imgs: HTMLElement[];
      inferences: HTMLElement[];
    };
  } = {
    labels: [],
    sample: {
      size: 200,
      imgs: [],
      inferences: []
    }
  };
  const start = 0;
  for(let i = start; i < test.sample.size; ++i){
    let div = document.createElement('div');
    let span = document.createElement('span');
    let img = document.createElement('img');
    img.src = '/img/test/' + i + '.png';
    span.textContent = '-';
    test.sample.imgs.push(img);
    test.sample.inferences.push(span);
    div.appendChild(img);
    div.appendChild(span);
    frag.appendChild(div);
  }
  samples.appendChild(frag);
  const canvas = <HTMLCanvasElement> document.getElementById('canvas_test_results');
  const accuracy = document.getElementById('accuracy');
  canvas.setAttribute('width', '100');
  canvas.setAttribute('height', '100');
  const context = canvas.getContext( "2d" );
  const update = (results: number[]) => {
    let image = context.getImageData(0, 0, 100, 100);
    let pixels = image.data;
    for(let n = 0; n < 10000; ++n) {
      let i = n * 4;
      if(results[n] == test.labels[n]){
        pixels[i] = 0;
        pixels[i+1] = 255;
        pixels[i+2] = 0;
      } else {
        pixels[i] = 255;
        pixels[i+1] = 0;
        pixels[i+2] = 0;
      }
      pixels[i+3] = 255;
    }
    context.putImageData(image, 0, 0);
    for(let n = start; n < test.sample.size; ++n) {
      let e = test.sample.inferences[n];
      e.textContent = String(results[n]);
      e.parentElement.className = (test.labels[n] == results[n] ? 'true' : 'false');
    }
  };
  const log = new Logger(document.getElementById('log'));
  const session = new Session('ws://' + location.host + '/streaming')
  session.add_listener('message', (event: MessageEvent) => {
    console.log(event.data);
    let json = JSON.parse(event.data);
    switch(json.event){
      case 'open':
        button_start.disabled = false;
        log.debug('Session ID: ' + json.id);
        break;
      case 'start':
        log.debug('Training started...');
        test.labels = json.data.test_labels;
        break;
      case 'test':
        update(json.data.inference);
        accuracy.innerHTML = Math.floor(json.data.accuracy * 10000) / 100 + '% (step ' + json.data.step + ')';
        break;
    }
  });
  session.add_listener('close', (event: CloseEvent) => {
    log.error('Connection closed: ' + event.code + ' - ' + event.reason);
  });
  session.add_listener('error', (event: Event) => {
    log.error('' + event);
  });
  const button_start = <HTMLInputElement> document.getElementById("button_start");
  button_start.addEventListener("click", () => {
    session.send('start', null);
    button_start.disabled = true;
  });
  const button_cancel = <HTMLInputElement> document.getElementById("button_cancel");
  button_cancel.addEventListener("click", () => {
    session.send('cancel', null);
  });
}

