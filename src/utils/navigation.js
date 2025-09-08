// Утилиты для безопасной навигации

// Список проблематичных slug'ов
const PROBLEMATIC_SLUGS = [
  'post', 'api', 'admin', 'static', 'media', 'login', 'register', 'logout', 
  'create', 'edit', 'delete', 'profile', 'settings', 'dashboard', 'home',
  'about', 'contact', 'help', 'support', 'terms', 'privacy'
];

// Проверяет и исправляет slug для навигации к посту
export const getSafePostSlug = (post) => {
  if (!post) return null;
  
  // Если slug существует и не является проблематичным, используем его
  if (post.slug && 
      post.slug !== 'post' && 
      post.slug.trim() !== '' && 
      !PROBLEMATIC_SLUGS.includes(post.slug)) {
    return post.slug;
  }
  
  // Иначе используем ID
  return post.id;
};

// Безопасная навигация к посту
export const navigateToPost = (navigate, post) => {
  const safeSlug = getSafePostSlug(post);
  if (safeSlug) {
    navigate(`/post-detail/${safeSlug}`);
  } else {
    console.error('Невозможно определить slug или ID поста:', post);
  }
};

// Создает безопасную ссылку на пост
export const getPostDetailUrl = (post) => {
  const safeSlug = getSafePostSlug(post);
  return safeSlug ? `/post-detail/${safeSlug}` : '#';
};
