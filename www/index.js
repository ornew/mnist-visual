var context;
var canvas;
var mf = false;
var ox = 0;
var oy = 0;
var x = 0;
var y = 0;
var step = 100;

function onDown(event){
  mf=true;
  ox=event.touches[0].pageX-event.target.getBoundingClientRect().left;
  oy=event.touches[0].pageY-event.target.getBoundingClientRect().top;
  event.stopPropagation();
}

function onMove(event){
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

function onUp(event){
  mf=false;
  event.stopPropagation();
}

function onMouseDown(event){
  ox=event.clientX-event.target.getBoundingClientRect().left;
  oy=event.clientY-event.target.getBoundingClientRect().top ;
  mf=true;
}

function onMouseMove(event){
  if(mf){
    x=event.clientX-event.target.getBoundingClientRect().left;
    y=event.clientY-event.target.getBoundingClientRect().top ;
    drawLine();
    ox=x;
    oy=y;
  }
}

function onMouseUp(event){
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
  var result = [];
  for(var y = 0; y < 28; ++y) {
    for(var x = 0; x < 28; ++x) {
      var i = (y * 28 + x) * 4;
      result.push((255 - pixels[i]) / 255);
    }
  }
  return result;
}

function print(m) {
  var log = document.createElement('p');
  log.innerHTML = m;
  document.getElementById("log").appendChild(log);
}

function error(m) {
  var now = new Date();
  var log = document.createElement('p');
  log.className = 'error';
  log.innerHTML = '<time>[' + now.toDateString() + ' ' + now.toLocaleTimeString() + ']</time>' + m;
  document.getElementById("log").appendChild(log);
}

function evalute() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log(this.responseText);
      response = JSON.parse(this.responseText);
      if('error' in response) {
        error(response['error']);
        return;
      }
      document.getElementById("inference").innerHTML = response['inference'];
      for(var i = 0; i < 10; ++i) {
        document.getElementById("inference-" + i).innerHTML = Math.round(response['results'][i]);
      }
    }
  };
  xhttp.open("POST", "cgi-bin/evalute.py", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send("payload=" + JSON.stringify({
    'data': getPixels(),
    'step': parseInt(step)
  }));
}

window.onload = function(){
  canvas = document.getElementById("canvas");
  canvas.addEventListener("touchstart",onDown,false);
  canvas.addEventListener("touchmove",onMove,false);
  canvas.addEventListener("touchend",onUp,false);
  canvas.addEventListener("mousedown",onMouseDown,false);
  canvas.addEventListener("mousemove",onMouseMove,false);
  canvas.addEventListener("mouseup",onMouseUp,false);
  canvas.setAttribute("width", 28);
  canvas.setAttribute("height", 28);

  clear_button = document.getElementById("clear");
  clear_button.addEventListener("click", clearCanvas);

  evalute_button = document.getElementById("evalute");
  evalute_button.addEventListener("click", evalute);

  context = canvas.getContext( "2d" );
  context.scale(0.1, 0.1);
  context.strokeStyle="#000000";
  context.lineWidth = 10;
  context.lineJoin  = "round";
  context.lineCap   = "round";
  clearCanvas();

  function onSeek(){
    step = step_seekbar.value;
    step_display.innerHTML = step;
  }
  step_seekbar = document.getElementById("step_seekbar");
  step_display = document.getElementById("step_display");
  step_seekbar.addEventListener("input", onSeek);
  onSeek();
}

