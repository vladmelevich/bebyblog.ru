// Категории для постов
export const categories = [
  {
    id: 1,
    name: 'Беременность',
    slug: 'beremennost',
    description: 'Вопросы о беременности',
    icon: '🤰'
  },
  {
    id: 2,
    name: 'Роды',
    slug: 'rody',
    description: 'Подготовка к родам и роды',
    icon: '👶'
  },
  {
    id: 3,
    name: 'Новорожденные',
    slug: 'novorozhdennye',
    description: 'Уход за новорожденными',
    icon: '🍼'
  },
  {
    id: 4,
    name: 'Дети 1-3 года',
    slug: 'deti-1-3-goda',
    description: 'Развитие детей от 1 до 3 лет',
    icon: '🧸'
  },
  {
    id: 5,
    name: 'Дети 3-7 лет',
    slug: 'deti-3-7-let',
    description: 'Развитие детей от 3 до 7 лет',
    icon: '🎨'
  },
  {
    id: 6,
    name: 'Школьники',
    slug: 'shkolniki',
    description: 'Вопросы о школьниках',
    icon: '📚'
  },
  {
    id: 7,
    name: 'Здоровье',
    slug: 'zdorove',
    description: 'Здоровье детей и мам',
    icon: '🏥'
  },
  {
    id: 8,
    name: 'Питание',
    slug: 'pitanie',
    description: 'Питание детей и мам',
    icon: '🍎'
  },
  {
    id: 9,
    name: 'Воспитание',
    slug: 'vospitanie',
    description: 'Вопросы воспитания',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 10,
    name: 'Семья',
    slug: 'semya',
    description: 'Семейные отношения',
    icon: '❤️'
  }
];

// Функция для получения категории по ID
export const getCategoryById = (id) => {
  return categories.find(category => category.id === id);
};

// Функция для получения категории по slug
export const getCategoryBySlug = (slug) => {
  return categories.find(category => category.slug === slug);
};

// Функция для получения всех категорий
export const getAllCategories = () => {
  return categories;
};
