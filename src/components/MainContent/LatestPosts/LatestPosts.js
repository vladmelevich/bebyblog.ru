import React from 'react';
import { Link } from 'react-router-dom';
import BebyBlogPosts from './BabyBlogPosts';
import './LatestPosts.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';

const LatestPosts = () => {
  return (
    <div className="latest-posts">
      <div className="posts-header">
        <h3>📝 Последние посты сообщества</h3>
        <p>Присоединяйтесь к обсуждениям и делитесь своим опытом</p>
      </div>
      
      <BebyBlogPosts limit={4} />
      
      <div className="posts-footer">
        <Link to="/posts" className="btn-view-all">Смотреть все посты</Link>
        <Link to="/create-post" className="btn-write-post">
          <FontAwesomeIcon icon={faPen} />
          Написать пост
        </Link>
      </div>
    </div>
  );
};

export default LatestPosts;
