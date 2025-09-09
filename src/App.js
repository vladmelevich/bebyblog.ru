import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MainContent from './components/MainContent/MainContent';
import PostPage from './components/PostPage/PostPage';
import PostDetail from './components/PostDetail/PostDetail';
import CategoryPage from './components/CategoryPage/CategoryPage';
import AuthPage from './components/AuthPage/AuthPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import CreatePost from './components/CreatePost/CreatePost';
import EditPost from './components/EditPost/EditPost';
import ArchivePage from './components/ArchivePage/ArchivePage';

import AllPosts from './components/AllPosts/AllPosts';
import UserProfilePage from './components/UserProfilePage/UserProfilePage';
import FriendsPage from './components/FriendsPage/FriendsPage';
import ChatsPage from './components/ChatsPage/ChatsPage';
import SimpleChat from './components/SimpleChat/SimpleChat';
import PregnancyCalculator from './components/PregnancyCalculator/PregnancyCalculator';

import { checkAuthOnLoad } from './utils/auth';
 
function App() {
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkAuthOnLoad();
      } catch (error) {
        console.error('Ошибка при проверке авторизации:', error);
      } finally {
        setIsAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  if (!isAuthChecked) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <div className="main-container">
          <Sidebar />
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            <Route path="/post-detail/:slug" element={<PostDetail />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/user/:userId" element={<UserProfilePage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/chat/:userId" element={<SimpleChat />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/edit-post/:slug" element={<EditPost />} />
              <Route path="/archive" element={<ArchivePage />} />

              <Route path="/posts" element={<AllPosts />} />
              <Route path="/pregnancy-calculator" element={<PregnancyCalculator />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
