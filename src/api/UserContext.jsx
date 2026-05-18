import { createContext, useContext, useState, useEffect } from 'react';
import { createAuthClient } from '@neondatabase/auth';
import { 
  fetchWatchHistory, addToHistory as dbAddToHistory, clearWatchHistory as dbClearWatchHistory,
  fetchContinueWatching, updateContinueWatching as dbUpdateContinueWatching,
  fetchLikedItems, toggleLikeItem as dbToggleLike,
  updateUserProfile as dbUpdateUserProfile,
  syncGoogleUserToDb,
  initDatabase
} from './db';

const authClient = createAuthClient('https://ep-lively-surf-apnkb5f1.neonauth.c-7.us-east-1.aws.neon.tech/neondb/auth');

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vault_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [history, setHistory] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [likes, setLikes] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'signup'

  // Initialize DB tables and listen for Neon Auth session
  useEffect(() => {
    initDatabase();
    
    async function checkGoogleSession() {
      try {
        const { data, error } = await authClient.getSession();
        if (data?.session && data?.user) {
          const syncRes = await syncGoogleUserToDb(
            data.user.email,
            data.user.name || data.user.email,
            data.user.image
          );
          if (syncRes.success) {
            setUser(syncRes.user);
          }
        }
      } catch (err) {
        console.error('Failed to sync Neon Auth google session:', err);
      }
    }

    checkGoogleSession();
  }, []);

  // Fetch all user specific data when logged in
  useEffect(() => {
    if (user) {
      localStorage.setItem('vault_user', JSON.stringify(user));
      syncUserData();
    } else {
      localStorage.removeItem('vault_user');
      setHistory([]);
      setContinueWatching([]);
      setLikes([]);
    }
  }, [user]);

  const syncUserData = async () => {
    if (!user) return;
    try {
      const [histData, contData, likedData] = await Promise.all([
        fetchWatchHistory(user.id),
        fetchContinueWatching(user.id),
        fetchLikedItems(user.id)
      ]);
      setHistory(histData || []);
      setContinueWatching(contData || []);
      setLikes(likedData || []);
    } catch (err) {
      console.error('Failed to sync user data:', err);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.error('Sign out failed from Neon Auth:', e);
    }
    setUser(null);
  };

  const addToHistory = async (mediaId, mediaType, mediaTitle, mediaPoster) => {
    if (!user) return false;
    const success = await dbAddToHistory(user.id, mediaId, mediaType, mediaTitle, mediaPoster);
    if (success) {
      syncUserData();
    }
    return success;
  };

  const clearHistory = async () => {
    if (!user) return false;
    const success = await dbClearWatchHistory(user.id);
    if (success) {
      setHistory([]);
    }
    return success;
  };

  const updateContinueWatching = async (mediaId, mediaType, mediaTitle, mediaPoster, season, episode, progress = 0, duration = 0) => {
    if (!user) return false;
    const success = await dbUpdateContinueWatching(
      user.id, mediaId, mediaType, mediaTitle, mediaPoster, season, episode, progress, duration
    );
    if (success) {
      syncUserData();
    }
    return success;
  };

  const toggleLike = async (mediaId, mediaType, mediaTitle, mediaPoster) => {
    if (!user) {
      // Trigger login prompt
      setAuthTab('login');
      setShowAuthModal(true);
      return { promptLogin: true };
    }
    const result = await dbToggleLike(user.id, mediaId, mediaType, mediaTitle, mediaPoster);
    if (!result.error) {
      syncUserData();
    }
    return result;
  };

  const isLiked = (mediaId, mediaType) => {
    return likes.some(item => String(item.media_id) === String(mediaId) && item.media_type === mediaType);
  };

  const updateProfile = async (avatarUrl, bannerUrl) => {
    if (!user) return false;
    const res = await dbUpdateUserProfile(user.id, avatarUrl, bannerUrl);
    if (res.success) {
      setUser(res.user);
      localStorage.setItem('vault_user', JSON.stringify(res.user));
      return true;
    }
    return false;
  };

  return (
    <UserContext.Provider value={{
      user,
      history,
      continueWatching,
      likes,
      showAuthModal,
      authTab,
      setShowAuthModal,
      setAuthTab,
      login,
      logout,
      syncUserData,
      addToHistory,
      clearHistory,
      updateContinueWatching,
      toggleLike,
      isLiked,
      updateProfile
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
