
export default class Session {
  constructor(ws_url){
    this.ws = new WebSocket(ws_url);
    this.addEventListener('message', (event) => {
      let data = JSON.parse(event.data);
      switch(data['event']){
        case 'open':
          this.id = data['id'];
          break;
      }
    });
  }
  send(event, data){
    if(this.id != null){
      this.ws.send(JSON.stringify({'event': event, 'data': data, 'id': this.id}))
    } else {
      console.log('error: The socket is not yet opened.')
    }
  }
  addEventListener(type, listener){
    this.ws.addEventListener(type, listener);
    return this;
  }
}
