import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faMessage
} from '@fortawesome/free-solid-svg-icons';
import { makeAuthenticatedRequest } from '../../utils/auth';
import ChatModal from '../ChatModal/ChatModal';
import './ChatsPage.css';

const ChatsPage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      // Получаем чаты из API с правильной аутентификацией
      const response = await makeAuthenticatedRequest('http://localhost:8000/api/users/async/chats/');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.chats) {
          setChats(data.chats);
        } else {
          console.error('Ошибка загрузки чатов:', data.message);
          setChats([]);
        }
      } else {
        console.error('Ошибка загрузки чатов:', response.status, await response.text());
        setChats([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chat) => {
    // Открываем модальное окно чата
    const otherUser = chat.other_participant;
    if (otherUser) {
      setSelectedUser({
        id: otherUser.id,
        name: `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.username || 'Пользователь'
      });
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    // Обновляем список чатов после закрытия модального окна
    fetchChats();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const otherUser = chat.other_participant;
    const userName = `${otherUser?.first_name} ${otherUser?.last_name}`.trim() || otherUser?.username || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="chats-page">
      <div className="chats-header">
        <h1>Чаты</h1>
      </div>

      <div className="chats-search">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="chats-list">
        {loading ? (
          <div className="loading">Загрузка чатов...</div>
        ) : filteredChats.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faMessage} className="empty-icon" />
            <p>Чатов пока нет</p>
            <span>Начните общение с друзьями</span>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const otherUser = chat.other_participant;
            const userName = `${otherUser?.first_name} ${otherUser?.last_name}`.trim() || otherUser?.username || 'Пользователь';
            const lastMessage = chat.last_message;
            
            return (
              <div key={chat.id} className="chat-item" onClick={() => handleChatClick(chat)}>
                <div className="chat-avatar">
                  {otherUser?.avatar && (
                    <img src={otherUser.avatar} alt={userName} />
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-header">
                    <h3 className="chat-name">{userName}</h3>
                    {lastMessage && (
                      <span className="chat-time">{formatTime(lastMessage.created_at)}</span>
                    )}
                  </div>
                  <div className="chat-preview">
                    {lastMessage ? (
                      <p className="last-message">{lastMessage.content}</p>
                    ) : (
                      <p className="no-messages">Сообщений нет</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно чата */}
      <ChatModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        userId={selectedUser?.id}
        userName={selectedUser?.name}
      />
    </div>
  );
};

export default ChatsPage;
