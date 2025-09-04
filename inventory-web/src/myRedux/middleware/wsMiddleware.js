// src/myRedux/middleware/wsMiddleware.js

import {
  wsConnectStart,
  wsConnectSuccess,
  wsConnectError,
  wsDisconnect,
  wsMessageSend,
  wsMessageReceive,
} from '../action/wsActions.js';

const wsMiddleware = () => {
  let socket = null;
  let reconnectAttempts = 0;
  const maxReconnects = 5;
  const reconnectDelay = 3000; // 3 seconds

  return (store) => (next) => (action) => {
    const connect = (url) => {
    socket = new WebSocket(url);
    console.log('Websocket is initialized');

    socket.onopen = () => {
      reconnectAttempts = 0; // Reset attempts on successful connection
      store.dispatch(wsConnectSuccess());
      console.log('Websocket is connected')
    };

    socket.onclose = () => {
      console.log(`Socket is closed, and attempt is: ${reconnectAttempts}`)
      store.dispatch(wsConnectError());
      
      // Reconnection logic
      if (reconnectAttempts < maxReconnects) {
        reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnects})...`);
          connect(url); // Call the connect function to retry
        }, reconnectDelay);
      } else {
        console.log('Max reconnection attempts reached. Giving up.');
        // Optionally dispatch a persistent error state here
      }
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(`Receive message: ${message}`);
      store.dispatch(wsMessageReceive(message));
      };
    };
    switch (action.type) {
      case wsConnectStart.type:
        // Close any existing connection first
        if (socket !== null) {
          socket.close();
        }
        connect(action.payload.url);
        break;

      case wsMessageSend.type:
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(action.payload));
        }
        break;

      case wsDisconnect.type:
        if (socket !== null) {
          socket.close();
        }
        socket = null;
        break;

      default:
        return next(action);
    }
  };
};

export default wsMiddleware();