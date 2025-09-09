import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faReply, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import chatWebSocket from '../../utils/chatWebSocket';
import { makeAuthenticatedRequest } from '../../utils/auth';
import MessageActionsModal from '../MessageActionsModal/MessageActionsModal';
import './SimpleChat.css';

const SimpleChat = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [clickedMessageId, setClickedMessageId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadChatMessages();
      setupWebSocket();
    }

    return () => {
      // Очистка при размонтировании
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // chatWebSocket.leaveChat(); // Отключено для отладки
    };
  }, [userId]);

  const setupWebSocket = () => {
    // Временно отключаем WebSocket для отладки
    console.log('WebSocket setup skipped for debugging');
    return;
    
    // Подключаемся к WebSocket
    chatWebSocket.connect();

    // Присоединяемся к чату
    chatWebSocket.joinChat(userId);

    // Обработчики сообщений
    chatWebSocket.onMessage('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    chatWebSocket.onMessage('user_typing', (data) => {
      if (data.user_id !== getCurrentUserId()) {
        setTypingUser(data.user_name);
        setIsTyping(true);
        
        // Автоматически скрываем индикатор через 3 секунды
        setTimeout(() => {
          setIsTyping(false);
          setTypingUser(null);
        }, 3000);
      }
    });

    chatWebSocket.onMessage('user_stop_typing', (data) => {
      if (data.user_id !== getCurrentUserId()) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });
  };

  const getCurrentUserId = () => {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        return parseInt(userData.id);
      } catch (error) {
        console.error('Ошибка парсинга userData:', error);
      }
    }
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAvatarClick = (senderId) => {
    // Переходим на страницу профиля пользователя
    navigate(`/user/${senderId}`);
  };

  const loadUserData = async () => {
    try {
      const response = await makeAuthenticatedRequest(`http://93.183.80.220/users/${userId}/`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await makeAuthenticatedRequest(`http://93.183.80.220/api/users/async/chats/${userId}/messages/`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      console.log('Отправляем сообщение:', messageContent, 'пользователю:', userId);
      
      // Отправляем сообщение через API
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/async/chats/${userId}/messages/create/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            message_type: 'text',
            reply_to: replyToMessage ? replyToMessage.id : null
          })
        }
      );

      console.log('Ответ сервера:', response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Данные ответа:', data);
        if (data.success && data.message) {
          // Добавляем сообщение в локальное состояние
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
          console.log('Сообщение добавлено в состояние');
          
          // Сбрасываем ответ на сообщение
          if (replyToMessage) {
            setReplyToMessage(null);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Ошибка отправки сообщения:', response.status, errorText);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
    
    // Останавливаем индикатор печати (отключено для отладки)
    // chatWebSocket.stopTyping(userId);
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Управление индикатором печати (отключено для отладки)
    // if (e.target.value.trim()) {
    //   chatWebSocket.startTyping(userId);
    //   
    //   // Очищаем предыдущий таймаут
    //   if (typingTimeoutRef.current) {
    //     clearTimeout(typingTimeoutRef.current);
    //   }
    //   
    //   // Устанавливаем новый таймаут для остановки индикатора
    //   typingTimeoutRef.current = setTimeout(() => {
    //     chatWebSocket.stopTyping(userId);
    //   }, 1000);
    // } else {
    //   chatWebSocket.stopTyping(userId);
    //   if (typingTimeoutRef.current) {
    //     clearTimeout(typingTimeoutRef.current);
    //   }
    // }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/async/chats/${userId}/messages/${messageId}/`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        // Удаляем сообщение из локального состояния
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setClickedMessageId(null);
      } else {
        console.error('Ошибка удаления сообщения:', response.status);
      }
    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyToMessage(message);
    setClickedMessageId(null);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleMessageClick = useCallback((message) => {
    setSelectedMessage(message);
    setShowActionsModal(true);
  }, []);

  const closeMessageMenu = () => {
    setClickedMessageId(null);
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      console.log('Редактирование сообщения в SimpleChat:', { messageId, newContent });
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/async/messages/${messageId}/update/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newContent
          })
        }
      );

      console.log('Ответ сервера SimpleChat:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Данные ответа SimpleChat:', data);
        if (data.success && data.message) {
          // Обновляем сообщение в локальном состоянии
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, content: newContent, is_edited: true } : msg
          ));
          console.log('Сообщение обновлено в SimpleChat');
        }
      } else {
        console.error('Ошибка редактирования сообщения SimpleChat:', response.status);
        const errorData = await response.text();
        console.error('Детали ошибки SimpleChat:', errorData);
      }
    } catch (error) {
      console.error('Ошибка редактирования сообщения SimpleChat:', error);
    }
  };

  const closeActionsModal = useCallback(() => {
    setShowActionsModal(false);
    setSelectedMessage(null);
  }, []);

  const displayName = user ? 
    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 
     user.first_name || user.username || 'Пользователь') : 
    'Пользователь';

  return (
    <div className="simple-chat">
      <div className="chat-header">
        <div className="chat-user-info">
          <h3 className="user-name">{displayName}</h3>
        </div>
      </div>

      <div className="messages-container" onClick={closeMessageMenu}>
        {messages.length === 0 ? (
          <div className="empty-messages">
            <p className="empty-title">Сообщений нет.</p>
            <p className="empty-subtitle">Собеседник не видит эту переписку.</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => {
              // Получаем ID пользователя из userData
              const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
              let currentUserId = null;
              if (userDataString) {
                try {
                  const userData = JSON.parse(userDataString);
                  currentUserId = parseInt(userData.id);
                } catch (error) {
                  console.error('Ошибка парсинга userData:', error);
                }
              }
              
              const messageSenderId = parseInt(message.sender);
              const isMyMessage = messageSenderId === currentUserId;
              
              // Получаем информацию об отправителе
              const senderInfo = message.sender_info || {};
              const senderName = senderInfo.first_name && senderInfo.last_name 
                ? `${senderInfo.first_name} ${senderInfo.last_name}`
                : senderInfo.first_name || senderInfo.username || 'Пользователь';
              const senderAvatar = senderInfo.avatar || '/images/default-avatar.svg';

              return (
                <div 
                  key={message.id} 
                  className={`message ${isMyMessage ? 'my-message' : 'incoming-message'}`}
                  onClick={() => handleMessageClick(message)}
                >
                  {!isMyMessage && (
                    <div 
                      className="message-avatar clickable-avatar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvatarClick(messageSenderId);
                      }}
                      title={`Перейти к профилю ${senderName}`}
                    >
                      <img 
                        src={senderAvatar} 
                        alt={senderName}
                        onError={(e) => {
                          e.target.src = '/images/default-avatar.svg';
                        }}
                      />
                    </div>
                  )}
                  <div className="message-wrapper">
                    {!isMyMessage && (
                      <div 
                        className="message-sender-name clickable-name"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAvatarClick(messageSenderId);
                        }}
                        title={`Перейти к профилю ${senderName}`}
                      >
                        {senderName}
                      </div>
                    )}
                    <div className="message-content" style={isMyMessage ? {backgroundColor: '#007bff', color: 'white'} : {backgroundColor: '#ffffff', color: 'black'}}>
                      {/* Ответ на сообщение */}
                      {message.reply_to && (
                        <div className="reply-preview">
                          <div className="reply-line"></div>
                          <div className="reply-content">
                            <span className="reply-author">
                              {message.reply_to.sender_info?.first_name || 'Пользователь'}
                            </span>
                            <span className="reply-text">{message.reply_to.content}</span>
                          </div>
                        </div>
                      )}
                      
                      <p>{message.content}</p>
                      <div className="message-footer">
                        <span className="message-time">
                          {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {message.is_edited && <span className="edited-indicator"> (изменено)</span>}
                        </span>
                        
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Индикатор печати */}
            {isTyping && typingUser && (
              <div className="typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="typing-text">{typingUser} печатает...</span>
              </div>
            )}
            
            {/* Элемент для автоматической прокрутки */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="message-input-container">
        {/* Ответ на сообщение */}
        {replyToMessage && (
          <div className="reply-to-message">
            <div className="reply-to-content">
              <span className="reply-to-label">Ответ на:</span>
              <span className="reply-to-text">{replyToMessage.content}</span>
            </div>
            <button className="cancel-reply" onClick={cancelReply}>
              ×
            </button>
          </div>
        )}
        
        <div className="message-input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder={replyToMessage ? "Ответить на сообщение..." : "Ваше сообщение"}
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
          />
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || loading}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Отправить</span>
          </button>
        </div>
      </div>

      {/* Модальное окно действий с сообщением */}
      <MessageActionsModal
        isOpen={showActionsModal}
        onClose={closeActionsModal}
        message={selectedMessage}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        isMyMessage={selectedMessage ? parseInt(selectedMessage.sender) === getCurrentUserId() : false}
      />
    </div>
  );
};

// Мемоизируем компонент для предотвращения ненужных ререндеров
export default memo(SimpleChat);
