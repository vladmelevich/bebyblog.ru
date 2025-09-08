import React, { Suspense, lazy } from 'react';
import './MainContent.css';
import HeroSection from './HeroSection/HeroSection';

// Ленивая загрузка компонентов для улучшения производительности
const FeaturedCards = lazy(() => import('./FeaturedCards/FeaturedCards'));
const CategoryButtons = lazy(() => import('./CategoryButtons/CategoryButtons'));
const LatestPosts = lazy(() => import('./LatestPosts/LatestPosts'));

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>Загрузка...</p>
  </div>
);

const MainContent = () => {
  return (
    <main className="main-content">
      <HeroSection />
      <Suspense fallback={<LoadingSpinner />}>
        <FeaturedCards />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <CategoryButtons />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <LatestPosts />
      </Suspense>
    </main>
  );
};

export default MainContent;
