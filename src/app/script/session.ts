
export class Session {
  private ws: WebSocket;
  private id: string = null;
  constructor(ws_url: string){
    this.ws = new WebSocket(ws_url);
    this.add_listener('message', (event: MessageEvent) => {
      let data = JSON.parse(event.data);
      switch(data['event']){
        case 'open':
          this.id = data['id'];
          break;
      }
    });
  }
  send(event: string, data: Object){
    if(this.id != null){
      this.ws.send(JSON.stringify({'event': event, 'data': data, 'id': this.id}))
    } else {
      console.log('error: The socket is not yet opened.')
    }
  }
  add_listener(type: string, listener: (event: Event) => any){
    this.ws.addEventListener(type, listener);
  }
}
