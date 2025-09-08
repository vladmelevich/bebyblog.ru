import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PostsList from '../PostsList/PostsList';
import './AllPosts.css';

const AllPosts = () => {
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories] = useState([
    { id: null, name: 'Все категории' },
    { id: 'zachatie', name: 'Зачатие' },
    { id: 'beremennost', name: 'Беременность' },
    { id: 'vsyo-o-detyah', name: 'Всё о детях' },
    { id: 'poleznye-stati', name: 'Полезные статьи' },
    { id: 'vospitanie', name: 'Воспитание' }
  ]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  const clearSearch = () => {
    setSearchQuery('');
    // Очищаем URL параметры
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  };

  return (
    <div className="all-posts">
      <div className="all-posts-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              {searchQuery ? `Результаты поиска: "${searchQuery}"` : 'Все посты'}
            </h1>
            <p>
              {searchQuery 
                ? `Найдено постов по запросу "${searchQuery}"` 
                : 'Найдите интересные статьи и поделитесь своим опытом'
              }
            </p>
          </div>
          {searchQuery && (
            <button className="clear-search-btn" onClick={clearSearch}>
              Очистить поиск
            </button>
          )}
        </div>
      </div>
      
      <div className="posts-filters">
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="posts-content">
        <PostsList category={selectedCategory} searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default AllPosts;






