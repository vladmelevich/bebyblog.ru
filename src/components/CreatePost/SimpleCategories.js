import React from 'react';

const SimpleCategories = () => {
  console.log('SimpleCategories: компонент загружен');
  
  return (
    <div>
      <label htmlFor="category">Категория *</label>
      <select id="category" name="category">
        <option value="">Выберите категорию</option>
        <option value="1">🤰 Беременность</option>
        <option value="2">👶 Роды</option>
        <option value="3">🍼 Новорожденные</option>
        <option value="4">🧸 Дети 1-3 года</option>
        <option value="5">🎨 Дети 3-7 лет</option>
        <option value="6">📚 Школьники</option>
        <option value="7">🏥 Здоровье</option>
        <option value="8">🍎 Питание</option>
        <option value="9">👨‍👩‍👧‍👦 Воспитание</option>
        <option value="10">❤️ Семья</option>
      </select>
    </div>
  );
};

export default SimpleCategories;
