import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faUserFriends, 
  faBookmark, 
  faCheck,
  faSearch,
  faShare,
  faHeart
} from '@fortawesome/free-solid-svg-icons';
import './ShareModal.css';

const ShareModal = ({ isOpen, onClose, post }) => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' или 'archive'
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isInArchive, setIsInArchive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      checkArchiveStatus();
      // Авто-закрытие через 30 секунд
      const timer = setTimeout(() => {
        onClose();
      }, 30000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/users/friends/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.results || data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    }
  };

  const checkArchiveStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      console.log('🔍 Проверка статуса архива для поста:', post?.title);
      console.log('Токен:', token ? 'Есть' : 'Нет');
      if (!token || !post) return;

      const response = await fetch(`http://localhost:8000/api/posts/${post.slug}/archive-status/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Статус архива:', data);
        setIsInArchive(data.is_in_archive || false);
      } else {
        console.error('❌ Ошибка проверки статуса архива:', response.status);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса архива:', error);
    }
  };

  const handleShareToFriends = async () => {
    if (selectedFriends.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      const promises = selectedFriends.map(friendId => 
        fetch('http://localhost:8000/api/users/send-post/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            recipient_id: friendId,
            post_slug: post.slug,
            message: message
          })
        })
      );

      await Promise.all(promises);
      setSuccessMessage(`Пост успешно отправлен ${selectedFriends.length} другу!`);
      setSelectedFriends([]);
      setMessage('');
      
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Ошибка отправки поста:', error);
      setSuccessMessage('Ошибка при отправке поста');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToArchive = async () => {
    if (isInArchive) return; // Не позволяем удалять из архива

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:8000/api/posts/${post.slug}/toggle-archive/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsInArchive(true);
        setSuccessMessage('Пост добавлен в архив!');
        
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка работы с архивом:', error);
      setSuccessMessage('Ошибка при добавлении в архив');
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(friend => 
    friend.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="share-modal-title">
            <FontAwesomeIcon icon={faShare} className="share-icon" />
            <h3>Поделиться постом</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            <FontAwesomeIcon icon={faCheck} />
            {successMessage}
          </div>
        )}

        <div className="share-modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <FontAwesomeIcon icon={faUserFriends} />
            Отправить другу
          </button>
          <button 
            className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveTab('archive')}
          >
            <FontAwesomeIcon icon={faBookmark} />
            Сохранить
          </button>
        </div>

        {activeTab === 'friends' && (
          <div className="share-friends-tab">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Поиск друзей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="friends-list">
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <div 
                    key={friend.id} 
                    className={`friend-item ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                    onClick={() => toggleFriendSelection(friend.id)}
                  >
                    <div className="friend-avatar">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.first_name} />
                      ) : (
                        <div className="friend-initials">
                          {`${friend.first_name?.charAt(0) || ''}${friend.last_name?.charAt(0) || ''}`}
                        </div>
                      )}
                    </div>
                    <div className="friend-info">
                      <div className="friend-name">
                        {friend.first_name} {friend.last_name}
                      </div>
                      <div className="friend-username">
                        @{friend.username}
                      </div>
                    </div>
                    {selectedFriends.includes(friend.id) && (
                      <FontAwesomeIcon icon={faCheck} className="check-icon" />
                    )}
                  </div>
                ))
              ) : (
                <div className="no-friends">
                  <FontAwesomeIcon icon={faUserFriends} className="no-friends-icon" />
                  <p>У вас пока нет друзей</p>
                  <span>Добавьте друзей, чтобы делиться постами</span>
                </div>
              )}
            </div>

            {selectedFriends.length > 0 && (
              <div className="share-actions">
                <textarea
                  placeholder="Добавить сообщение (необязательно)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="message-input"
                  rows="3"
                />
                <button 
                  className="share-btn"
                  onClick={handleShareToFriends}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Отправка...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faShare} />
                      Отправить {selectedFriends.length} другу
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'archive' && (
          <div className="share-archive-tab">
            <div className="archive-info">
              <FontAwesomeIcon icon={faBookmark} className="archive-icon" />
              <h4>Сохранение в архив</h4>
              <p>
                {isInArchive 
                  ? 'Этот пост уже сохранен в вашем архиве. Вы можете найти его в разделе "Архив".'
                  : 'Сохраните этот пост в свой архив, чтобы легко найти его позже.'
                }
              </p>
            </div>
            
            {!isInArchive && (
              <button 
                className="archive-btn add"
                onClick={handleAddToArchive}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Добавление...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faBookmark} />
                    Добавить в архив
                  </>
                )}
              </button>
            )}
            
            {isInArchive && (
              <div className="already-archived">
                <FontAwesomeIcon icon={faCheck} />
                <span>Пост уже в архиве</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
