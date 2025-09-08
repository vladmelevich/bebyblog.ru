class ChatWebSocket {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.messageHandlers = new Map();
    this.notificationHandlers = new Map();
  }

  connect() {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    console.log('WebSocket token found:', token ? 'Yes' : 'No');
    if (!token) {
      console.error('No access token found');
      return;
    }
    
    // Проверяем, не истек ли токен
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.error('Token expired');
        return;
      }
    } catch (error) {
      console.error('Invalid token:', error);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:8000/ws/chat/?token=${token}`;
    
    console.log('Attempting to connect to WebSocket:', wsUrl);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = (event) => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket readyState:', this.socket.readyState);
    };
  }

  handleMessage(data) {
    console.log('WebSocket message received:', data);
    
    switch (data.type) {
      case 'connection_established':
        console.log('Connection established:', data.message);
        break;
      case 'chat_message':
        this.notifyMessageHandlers('new_message', data.message);
        break;
      case 'user_typing':
        this.notifyMessageHandlers('user_typing', data);
        break;
      case 'user_stop_typing':
        this.notifyMessageHandlers('user_stop_typing', data);
        break;
      case 'new_notification':
        this.notifyNotificationHandlers('new_notification', data.notification);
        break;
      case 'error':
        console.error('WebSocket error:', data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  send(data) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket not connected');
    }
  }

  joinChat(userId) {
    this.send({
      type: 'join_chat',
      user_id: userId
    });
  }

  leaveChat() {
    this.send({
      type: 'leave_chat'
    });
  }

  sendMessage(userId, content, messageType = 'text', replyTo = null) {
    this.send({
      type: 'send_message',
      user_id: userId,
      content: content,
      message_type: messageType,
      reply_to: replyTo
    });
  }

  startTyping(userId) {
    this.send({
      type: 'typing',
      user_id: userId
    });
  }

  stopTyping(userId) {
    this.send({
      type: 'stop_typing',
      user_id: userId
    });
  }

  onMessage(eventType, handler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType).push(handler);
  }

  offMessage(eventType, handler) {
    if (this.messageHandlers.has(eventType)) {
      const handlers = this.messageHandlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onNotification(eventType, handler) {
    if (!this.notificationHandlers.has(eventType)) {
      this.notificationHandlers.set(eventType, []);
    }
    this.notificationHandlers.get(eventType).push(handler);
  }

  offNotification(eventType, handler) {
    if (this.notificationHandlers.has(eventType)) {
      const handlers = this.notificationHandlers.get(eventType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  notifyMessageHandlers(eventType, data) {
    if (this.messageHandlers.has(eventType)) {
      this.messageHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  notifyNotificationHandlers(eventType, data) {
    if (this.notificationHandlers.has(eventType)) {
      this.notificationHandlers.get(eventType).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in notification handler:', error);
        }
      });
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Создаем глобальный экземпляр
const chatWebSocket = new ChatWebSocket();

export default chatWebSocket;
