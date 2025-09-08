import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './PostPage.css';
import postsData from '../../data/posts_fixed.json';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const foundPost = postsData.find(p => p.id === parseInt(id));
    setPost(foundPost);
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!post) {
    return <div className="error">Пост не найден</div>;
  }

  const renderContent = (content) => {
    return content.map((item, index) => {
      switch (item.type) {
        case 'text':
          return <p key={index} className="post-text">{item.content}</p>;
        case 'heading':
          return <h2 key={index} className="post-heading">{item.content}</h2>;
        case 'image':
          return (
            <div key={index} className="post-image-container">
              <img 
                src={item.src} 
                alt={item.alt} 
                className="post-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="image-placeholder" style={{display: 'none'}}>
                <div className="placeholder-content">
                  <span className="placeholder-icon">📷</span>
                  <p>{item.description}</p>
                </div>
              </div>
            </div>
          );
        case 'list':
          return (
            <ul key={index} className="post-list">
              {item.items.map((listItem, listIndex) => (
                <li key={listIndex}>{listItem}</li>
              ))}
            </ul>
          );
        default:
          return null;
      }
    });
  };

  return (
    <div className="post-page">
      {/* Рекламный баннер */}
      <div className="ad-banner">
        <div className="ad-content">
          <span className="ad-text">Реклама</span>
          <div className="ad-placeholder">
            <span>Рекламный блок</span>
          </div>
        </div>
      </div>

      {/* Хлебные крошки */}
      {post.breadcrumbs && post.breadcrumbs.length > 0 && (
        <div className="breadcrumbs">
          {post.breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && <span className="breadcrumb-separator"> > </span>}
              <a href="#" className="breadcrumb-link">{crumb}</a>
            </span>
          ))}
        </div>
      )}

      {/* Основной контент */}
      <div className="post-content-wrapper">
        <article className="post-article">
          <header className="post-header">
            <h1 className="post-title">{post.title}</h1>
            <div className="post-meta">
              <span className="post-date">Дата обновления статьи: {post.date}</span>
            </div>
          </header>

          <div className="post-body">
            {renderContent(post.content)}
          </div>
        </article>

        {/* Боковая панель с рекламой */}
        <aside className="post-sidebar">
          <div className="sidebar-ad">
            <div className="ad-placeholder vertical">
              <span>Реклама</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Похожие посты */}
      <section className="related-posts">
        <h3 className="related-title">Похожие статьи</h3>
        <div className="related-grid">
          {post.relatedPosts.map((relatedPost) => (
            <div key={relatedPost.id} className="related-card">
              <div className="related-card-content">
                <h4 className="related-card-title">{relatedPost.title}</h4>
                <span className="related-card-category">{relatedPost.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PostPage;







