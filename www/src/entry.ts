
const chart = require('chart.js');
const ons = require('onsenui');

const ons_css = require('../node_modules/onsenui/css/onsenui');
const ons_cmp_css = require('../node_modules/onsenui/css/onsen-css-components');
const main_page = require('layout/main');
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
            return;
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
  xhttp.open("POST", "cgi-bin/evalute.py", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send("payload=" + JSON.stringify({
    'data': getPixels(),
    'step': step
  }));
}

function update_table(step: number){
  const tables = document.getElementById('test-results').children;
  if(tables){
    for(let i = 0; i < tables.length; ++i){
      if(i + 1 == step / 1000){
        (<HTMLElement> tables[i]).style.display = 'table';
      } else {
        (<HTMLElement> tables[i]).style.display = 'none';
      }
    }
  }
}

function onSeekStepConfig(){
  step = parseInt(step_seekbar.value);
  step_display.innerHTML = step_seekbar.value;
  update_table(step);
}

function load_test_results(){
  const loss_maps = document.getElementById('test-results');
  const loading: any = document.createElement('ons-progress-circular');
  loss_maps.appendChild(loading);

  const request = new XMLHttpRequest();
  request.responseType = 'json';
  request.addEventListener('progress', (event: ProgressEvent) => {
    if(event.lengthComputable){
      loading.value = event.loaded * 100. /event.total;
    } else {
      loading.setAttribute('indeterminate', '');
    }
  });
  request.addEventListener('load', (event: Event) => {
    if(request.status == 200){
      const json: any = request.response;
      if(json){
        const frag_loss_maps = document.createDocumentFragment();
        for(let n = 0; n < json.length; ++n){
          const table = document.createElement('table');
          const frag_table = document.createDocumentFragment();
          const thead = document.createElement('thead');
          const tbody = document.createElement('tbody');
          const frag_thead = document.createDocumentFragment();
          const frag_tbody = document.createDocumentFragment();
          {
            const tr = document.createElement('tr');
            const frag_tr = document.createDocumentFragment();
            frag_tr.appendChild(document.createElement('th'));
            for(let i = 0; i < 10; ++i){
              const th = document.createElement('th');
              th.textContent = '' + i;
              frag_tr.appendChild(th);
            }
            tr.appendChild(frag_tr);
            frag_table.appendChild(tr);
          }
          for(let i = 0; i < 10; ++i){
            let frag_tr = document.createDocumentFragment();
            let tr = document.createElement('tr');
            let th = document.createElement('th');
            th.textContent = '' + i;
            frag_tr.appendChild(th);
            for(let j = 0; j < 10; ++j){
              const p = json[n][i][j];
              let v = p / 20;
              if(v > 1){
                v = 1;
              }
              const td = document.createElement('td');
              td.textContent = '' + p;
              td.style.opacity = String(v);
              frag_tr.appendChild(td);
            }
            tr.appendChild(frag_tr);
            frag_tbody.appendChild(tr);
          }
          tbody.appendChild(frag_tbody);
          frag_table.appendChild(tbody);
          table.appendChild(frag_table);
          frag_loss_maps.appendChild(table);
          table.style.display = 'none';
        }
        loss_maps.appendChild(frag_loss_maps);
        window.setTimeout(() => { onSeekStepConfig(); }, 0);
      }
    } else {
      error('テストデータの取得に失敗しました: ' + request.status + ' ' + request.statusText);
    }
    loading.remove();
  });
  request.addEventListener('error', (event: ProgressEvent) => {
  });
  request.open('GET', 'test_results.json');
  request.send();
}

window.onload = function(){
  document.body.innerHTML = main_page;
  if(ons.platform.isIOS()){
    ons.platform.select('ios');
    error('ios');
  } else if(ons.platform.isAndroid()){
    ons.platform.select('android');
    error('android');
  } else {
    ons.platform.select('android');
    error('other');
  }
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

  load_test_results();
}

