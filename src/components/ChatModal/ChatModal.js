import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faTrash, faReply } from '@fortawesome/free-solid-svg-icons';
import chatWebSocket from '../../utils/chatWebSocket';
import { makeAuthenticatedRequest } from '../../utils/auth';
import MessageActionsModal from '../MessageActionsModal/MessageActionsModal';
import './ChatModal.css';

const ChatModal = ({ isOpen, onClose, userId, userName, onChatCreated }) => {
  const navigate = useNavigate();
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
  const chatIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && userId) {
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
  }, [isOpen, userId]);

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


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAvatarClick = (senderId) => {
    // Закрываем модальное окно и переходим на страницу профиля пользователя
    onClose();
    navigate(`/user/${senderId}`);
  };


  const handleReplyToMessage = (message) => {
    setReplyToMessage(message);
    setClickedMessageId(null);
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleMessageClick = (message) => {
    console.log('Клик по сообщению в ChatModal:', message);
    setSelectedMessage(message);
    setShowActionsModal(true);
  };

  const closeMessageMenu = () => {
    setClickedMessageId(null);
  };

  const closeActionsModal = () => {
    setShowActionsModal(false);
    setSelectedMessage(null);
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      console.log('Редактирование сообщения:', { messageId, newContent });
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

      console.log('Ответ сервера:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Данные ответа:', data);
        if (data.success && data.message) {
          // Обновляем сообщение в локальном состоянии
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, content: newContent, is_edited: true } : msg
          ));
          console.log('Сообщение обновлено в локальном состоянии');
        }
      } else {
        console.error('Ошибка редактирования сообщения:', response.status);
        const errorData = await response.text();
        console.error('Детали ошибки:', errorData);
      }
    } catch (error) {
      console.error('Ошибка редактирования сообщения:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await makeAuthenticatedRequest(
        `http://93.183.80.220/api/users/async/messages/${messageId}/delete/`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Удаляем сообщение из локального состояния
          setMessages(prev => prev.filter(msg => msg.id !== messageId));
        }
      } else {
        console.error('Ошибка удаления сообщения:', response.status);
      }
    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
    }
  };

  const getCurrentUserId = () => {
    const userDataString = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        return parseInt(userData.id);
      } catch (error) {
        console.error('Ошибка парсинга userData:', error);
        return null;
      }
    }
    return null;
  };

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const response = await fetch(`http://93.183.80.220/api/users/${userId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
      console.log('Loading chat messages...');
      
      // Сначала проверяем, есть ли уже чат с этим пользователем
      const chatResponse = await makeAuthenticatedRequest(`http://93.183.80.220/api/users/async/chats/`);

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('Chat data received:', chatData);
        const existingChat = chatData.chats.find(chat => 
          chat.participants.some(p => p.id === parseInt(userId))
        );
        
        if (existingChat) {
          chatIdRef.current = existingChat.id;
          // Загружаем сообщения существующего чата
          const messagesResponse = await makeAuthenticatedRequest(`http://93.183.80.220/api/users/async/chats/${userId}/messages/`);
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('Загружены сообщения:', messagesData);
            if (messagesData.success && messagesData.messages) {
              setMessages(messagesData.messages);
            }
          } else {
            console.error('Ошибка загрузки сообщений:', messagesResponse.status, await messagesResponse.text());
          }
        } else {
          // Чат не существует, показываем пустой список
          setMessages([]);
        }
      } else {
        console.error('Ошибка загрузки чатов:', chatResponse.status, await chatResponse.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
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

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.message) {
          // Добавляем сообщение в локальное состояние
          setMessages(prev => [...prev, data.message]);
          scrollToBottom();
          
          // Сбрасываем ответ на сообщение
          if (replyToMessage) {
            setReplyToMessage(null);
          }
        }
      } else {
        console.error('Ошибка отправки сообщения:', response.status);
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

  if (!isOpen) return null;

  const displayName = user ? 
    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 
     user.first_name || user.username || 'Пользователь') : 
    userName || 'Пользователь';

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Заголовок модального окна */}
        <div className="chat-modal-header">
          <div className="chat-user-info">
            <h3 className="user-name">{displayName}</h3>
            <p className="user-status">Была онлайн: 3 м</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Контейнер сообщений */}
        <div className="chat-modal-messages" onClick={closeMessageMenu}>
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
                    className={`message ${isMyMessage ? 'my-message' : 'incoming-message'} ${clickedMessageId === message.id ? 'message-selected' : ''}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    {!isMyMessage && (
                      <div 
                        className="message-avatar clickable-avatar"
                        onClick={() => handleAvatarClick(messageSenderId)}
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
                          onClick={() => handleAvatarClick(messageSenderId)}
                          title={`Перейти к профилю ${senderName}`}
                        >
                          {senderName}
                        </div>
                      )}
                      <div className="message-content" style={isMyMessage ? {backgroundColor: '#007bff', color: 'white'} : {backgroundColor: '#ffffff', color: 'black'}}>
                        <p>{message.content}</p>
                        <div className="message-footer">
                          <span className="message-time">
                            {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {message.is_edited && <span className="edited-indicator"> (изменено)</span>}
                          </span>
                          
                          {/* Кнопки действий */}
                          {clickedMessageId === message.id && (
                            <div className="message-actions">
                              <button 
                                className="action-button reply-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplyToMessage(message);
                                }}
                                title="Ответить"
                              >
                                <FontAwesomeIcon icon={faReply} />
                              </button>
                              
                              {isMyMessage && (
                                <button 
                                  className="action-button delete-button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(message.id);
                                  }}
                                  title="Удалить"
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          )}
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

        {/* Поле ввода сообщения */}
        <div className="chat-modal-input">
          <div className="message-input-wrapper">
            <input
              type="text"
              className="message-input"
              placeholder="Ваше сообщение"
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

export default ChatModal;
