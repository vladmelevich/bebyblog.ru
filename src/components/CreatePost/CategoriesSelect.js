import React from 'react';

const CategoriesSelect = ({ value, onChange, className, error }) => {
  const categories = [
    { id: 1, name: 'Беременность', icon: '🤰' },
    { id: 2, name: 'Роды', icon: '👶' },
    { id: 3, name: 'Новорожденные', icon: '🍼' },
    { id: 4, name: 'Дети 1-3 года', icon: '🧸' },
    { id: 5, name: 'Дети 3-7 лет', icon: '🎨' },
    { id: 6, name: 'Школьники', icon: '📚' },
    { id: 7, name: 'Здоровье', icon: '🏥' },
    { id: 8, name: 'Питание', icon: '🍎' },
    { id: 9, name: 'Воспитание', icon: '👨‍👩‍👧‍👦' },
    { id: 10, name: 'Семья', icon: '❤️' }
  ];

  console.log('CategoriesSelect: рендерим категории:', categories);
  console.log('CategoriesSelect: текущее значение:', value);

  return (
    <select
      id="category"
      name="category"
      value={value}
      onChange={onChange}
      className={className}
    >
      <option value="">Выберите категорию</option>
      {categories.map(category => (
        <option key={category.id} value={category.id}>
          {category.icon} {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategoriesSelect;
