class Network {
  constructor(onMessage) {
    this.onMessage = onMessage;
    this.isOpen = false;
    try {
      const host = window.location.hostname || 'localhost';
      this.ws = new WebSocket(`ws://${host}:8080`);
      this.ws.addEventListener('open', () => {
        this.isOpen = true;
        console.log('Connected to network server');
      });
      this.ws.addEventListener('message', ev => {
        try {
          const data = JSON.parse(ev.data);
          if (this.onMessage) this.onMessage(data);
        } catch (err) {
          console.warn('Bad network message', err);
        }
      });
      this.ws.addEventListener('close', () => {
        this.isOpen = false;
        console.log('Disconnected from network server');
      });
    } catch (err) {
      console.warn('WebSocket unsupported', err);
    }
  }

  send(msg) {
    if (this.ws && this.isOpen) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  sendState(state) {
    this.send({ type: 'state', ...state });
  }

  handleKey(code, down) {
    if (!down) return;
    if (code === 'KeyE' || code === 'Slash') this.send({ type: 'action' });
    if (code === 'KeyQ' || code === 'Period') this.send({ type: 'cycle' });
  }

  disconnect() {
    if (this.ws) this.ws.close();
  }
}

window.Network = Network;
