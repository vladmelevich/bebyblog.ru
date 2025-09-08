class WebSocketClient {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.currentChatId = null;
    this.messageHandlers = new Map();
    this.typingTimeout = null;
  }

  connect(userId) {
    this.userId = userId;
    this.ws = new WebSocket(`ws://46.149.70.4/ws/${userId}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Переподключение через 3 секунды
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.userId = null;
    this.currentChatId = null;
  }

  joinChat(chatId) {
    this.currentChatId = chatId;
    this.send({
      type: 'join_chat',
      chat_id: chatId
    });
  }

  leaveChat(chatId) {
    this.send({
      type: 'leave_chat',
      chat_id: chatId
    });
    if (this.currentChatId === chatId) {
      this.currentChatId = null;
    }
  }

  sendTyping(isTyping) {
    if (this.currentChatId) {
      this.send({
        type: 'typing',
        chat_id: this.currentChatId,
        is_typing: isTyping
      });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    const handlers = this.messageHandlers.get(data.type) || [];
    handlers.forEach(handler => handler(data));
  }

  onMessage(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  offMessage(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Утилиты для индикатора набора текста
  startTyping() {
    this.sendTyping(true);
    
    // Останавливаем набор через 2 секунды
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    this.sendTyping(false);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }
}

export const wsClient = new WebSocketClient();







