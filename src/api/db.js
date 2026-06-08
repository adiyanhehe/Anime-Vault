
// AnimeVault Database Layer
// Uses @neondatabase/serverless (HTTP fetch in browser, WebSocket in Node) so the
// same code works in GitHub Pages, Electron, and any other environment.
// localStorage is used as an offline cache / fallback only.

import { neon } from '@neondatabase/serverless';

const isBrowser = typeof window !== 'undefined';

// ---------------------- CONFIG ----------------------
const DATABASE_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_DATABASE_URL)
  || 'postgresql://neondb_owner:npg_cprHoA5wBt0Z@ep-lively-surf-apnkb5f1.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Single shared SQL tag. Works in browser (HTTP) and Node (WebSocket).
let sql = null;
try {
  sql = neon(DATABASE_URL);
} catch (e) {
  console.warn('Neon SQL initialization failed, will use localStorage only:', e?.message);
}

// ---------------------- LOCALSTORAGE CACHE ----------------------
const LS_KEYS = {
  USERS: 'animevault_users',
  HISTORY: 'animevault_history',
  CONTINUE_WATCHING: 'animevault_continue_watching',
  LIKED_ITEMS: 'animevault_liked_items',
  COMMENTS: 'animevault_comments',
  REMINDERS: 'animevault_reminders',
  SETTINGS: 'animevault_site_settings',
  COLLECTIONS: 'animevault_collections',
  COLLECTION_ITEMS: 'animevault_collection_items',
  COLLECTION_LIKES: 'animevault_collection_likes',
  COLLECTION_FOLLOWERS: 'animevault_collection_followers',
  CURRENT_USER: 'vault_user'
};

function getLS(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function setLS(key, value) {
  if (!isBrowser) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota */ }
}

function initLocalStorage() {
  if (!isBrowser) return;
  const defaults = {
    [LS_KEYS.USERS]: [],
    [LS_KEYS.HISTORY]: [],
    [LS_KEYS.CONTINUE_WATCHING]: [],
    [LS_KEYS.LIKED_ITEMS]: [],
    [LS_KEYS.COMMENTS]: [],
    [LS_KEYS.REMINDERS]: [],
    [LS_KEYS.COLLECTIONS]: [],
    [LS_KEYS.COLLECTION_ITEMS]: [],
    [LS_KEYS.COLLECTION_LIKES]: [],
    [LS_KEYS.COLLECTION_FOLLOWERS]: [],
    [LS_KEYS.SETTINGS]: {
      announcement: '🎉 Welcome to AnimeVault V2 - Brand New Database & Synced Accounts Integrated!',
      maintenance: 'false',
      trending_override: '[]'
    }
  };
  Object.entries(defaults).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

// ---------------------- INIT ----------------------
export async function initDatabase() {
  initLocalStorage();
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar TEXT,
        banner TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        media_id VARCHAR(50) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        media_title VARCHAR(255) NOT NULL,
        media_poster TEXT,
        watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_history UNIQUE(user_id, media_id, media_type)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS continue_watching (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        media_id VARCHAR(50) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        media_title VARCHAR(255) NOT NULL,
        media_poster TEXT,
        season INT DEFAULT 1,
        episode INT DEFAULT 1,
        progress INT DEFAULT 0,
        duration INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_continue UNIQUE(user_id, media_id, media_type)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS liked_items (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        media_id VARCHAR(50) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        media_title VARCHAR(255) NOT NULL,
        media_poster TEXT,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_liked UNIQUE(user_id, media_id, media_type)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        media_id VARCHAR(50) NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        schedule_id TEXT NOT NULL,
        anime_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        episode INTEGER NOT NULL,
        airing_at BIGINT NOT NULL,
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_reminder UNIQUE(user_id, schedule_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        cover TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS collection_items (
        id SERIAL PRIMARY KEY,
        collection_id INT NOT NULL,
        media_id VARCHAR(50) NOT NULL,
        media_type VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        poster TEXT,
        score DECIMAL(3,1),
        status VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS collection_likes (
        id SERIAL PRIMARY KEY,
        collection_id INT NOT NULL,
        user_id INT NOT NULL,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_like UNIQUE(collection_id, user_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS collection_followers (
        id SERIAL PRIMARY KEY,
        collection_id INT NOT NULL,
        user_id INT NOT NULL,
        followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_follower UNIQUE(collection_id, user_id)
      )
    `;
    // Idempotent column adds (safe to run repeatedly)
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`; } catch (e) {}

    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES
        ('announcement', '🎉 Welcome to AnimeVault V2 - Brand New Database & Synced Accounts Integrated!'),
        ('maintenance', 'false'),
        ('trending_override', '[]')
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('[AnimeVault DB] Neon database initialized successfully.');
  } catch (err) {
    console.error('[AnimeVault DB] Failed to initialize database tables, using localStorage only:', err);
  }
}

/* ==========================================================================
   USER MANAGEMENT
   ========================================================================== */

export async function userSignup(username, password) {
  const trimmedUser = (username || '').trim();
  if (!trimmedUser || !password) return { success: false, message: 'All fields are required.' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
  if (trimmedUser.length < 3) return { success: false, message: 'Username must be at least 3 characters.' };

  // Try Neon first
  if (sql) {
    try {
      const hashedPassword = btoa(password);
      const isAdmin = trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase().includes('admin');
      const result = await sql`
        INSERT INTO users (username, password, is_admin)
        VALUES (${trimmedUser}, ${hashedPassword}, ${isAdmin})
        RETURNING id, username, avatar, banner, is_admin
      `;
      const user = result[0];
      // Cache locally for offline access
      if (isBrowser) {
        const users = getLS(LS_KEYS.USERS, []);
        users.push({ ...user, password: hashedPassword });
        setLS(LS_KEYS.USERS, users);
      }
      return { success: true, user };
    } catch (e) {
      const msg = e?.message || '';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        return { success: false, message: 'Username already taken.' };
      }
      console.warn('[AnimeVault DB] Signup via Neon failed, falling back to localStorage:', msg);
      // fall through to localStorage fallback
    }
  }

  // localStorage fallback
  const users = getLS(LS_KEYS.USERS, []);
  if (users.find(u => u.username === trimmedUser)) return { success: false, message: 'Username already taken.' };
  const isAdmin = trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase().includes('admin');
  const newUser = {
    id: Date.now(),
    username: trimmedUser,
    password: btoa(password),
    avatar: null,
    banner: null,
    is_admin: isAdmin,
    created_at: new Date().toISOString()
  };
  users.push(newUser);
  setLS(LS_KEYS.USERS, users);
  return { success: true, user: newUser };
}

export async function userLogin(username, password) {
  const trimmedUser = (username || '').trim();
  if (!trimmedUser || !password) return { success: false, message: 'All fields are required.' };

  // Try Neon first
  if (sql) {
    try {
      const hashedPassword = btoa(password);
      const result = await sql`
        SELECT id, username, password, avatar, banner, is_admin FROM users
        WHERE username = ${trimmedUser}
      `;
      if (!result.length) {
        // fall through to localStorage
      } else {
        if (result[0].password !== hashedPassword) {
          return { success: false, message: 'Invalid username or password.' };
        }
        const user = { ...result[0] };
        delete user.password;
        return { success: true, user };
      }
    } catch (e) {
      console.warn('[AnimeVault DB] Login via Neon failed, falling back to localStorage:', e?.message);
    }
  }

  // localStorage fallback
  const users = getLS(LS_KEYS.USERS, []);
  const hashed = btoa(password);
  const user = users.find(u => u.username === trimmedUser && u.password === hashed);
  if (!user) return { success: false, message: 'Invalid username or password.' };
  const safeUser = { ...user };
  delete safeUser.password;
  return { success: true, user: safeUser };
}

export async function updateUserProfile(userId, avatarUrl, bannerUrl) {
  if (sql) {
    try {
      const result = await sql`
        UPDATE users
        SET avatar = ${avatarUrl}, banner = ${bannerUrl}
        WHERE id = ${userId}
        RETURNING id, username, avatar, banner, is_admin
      `;
      if (result && result.length) {
        // Update local cache
        if (isBrowser) {
          const users = getLS(LS_KEYS.USERS, []);
          const idx = users.findIndex(u => u.id === userId);
          if (idx !== -1) {
            users[idx].avatar = avatarUrl;
            users[idx].banner = bannerUrl;
            setLS(LS_KEYS.USERS, users);
          }
        }
        return { success: true, user: result[0] };
      }
    } catch (e) {
      console.warn('[AnimeVault DB] updateUserProfile via Neon failed, falling back to localStorage:', e?.message);
    }
  }

  // localStorage fallback
  const users = getLS(LS_KEYS.USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].avatar = avatarUrl;
    users[idx].banner = bannerUrl;
    setLS(LS_KEYS.USERS, users);
    return { success: true, user: users[idx] };
  }
  return { success: false, message: 'User not found.' };
}

/* ==========================================================================
   HISTORY
   ========================================================================== */

export async function fetchWatchHistory(userId) {
  if (sql) {
    try {
      const res = await sql`
        SELECT media_id, media_type, media_title, media_poster, watched_at
        FROM history WHERE user_id = ${userId}
        ORDER BY watched_at DESC
      `;
      return res;
    } catch (e) {
      console.warn('[AnimeVault DB] fetchWatchHistory via Neon failed, falling back to localStorage:', e?.message);
    }
  }
  return getLS(LS_KEYS.HISTORY, []).filter(h => h.user_id === userId);
}

export async function addToHistory(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  // Update local cache immediately
  if (isBrowser) {
    const history = getLS(LS_KEYS.HISTORY, []);
    const idx = history.findIndex(h => h.user_id === userId && h.media_id === mediaId && h.media_type === mediaType);
    const now = new Date().toISOString();
    if (idx !== -1) history[idx].watched_at = now;
    else history.push({ user_id: userId, media_id: mediaId, media_type: mediaType, media_title: mediaTitle, media_poster: mediaPoster, watched_at: now });
    setLS(LS_KEYS.HISTORY, history);
  }
  if (sql) {
    try {
      await sql`
        INSERT INTO history (user_id, media_id, media_type, media_title, media_poster, watched_at)
        VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())
        ON CONFLICT (user_id, media_id, media_type)
        DO UPDATE SET watched_at = NOW(), media_poster = EXCLUDED.media_poster, media_title = EXCLUDED.media_title
      `;
      return true;
    } catch (e) {
      console.warn('[AnimeVault DB] addToHistory via Neon failed:', e?.message);
    }
  }
  return true;
}

export async function clearWatchHistory(userId) {
  if (isBrowser) {
    const history = getLS(LS_KEYS.HISTORY, []).filter(h => h.user_id !== userId);
    setLS(LS_KEYS.HISTORY, history);
  }
  if (sql) {
    try { await sql`DELETE FROM history WHERE user_id = ${userId}`; return true; }
    catch (e) { console.warn('[AnimeVault DB] clearWatchHistory via Neon failed:', e?.message); }
  }
  return true;
}

/* ==========================================================================
   CONTINUE WATCHING
   ========================================================================== */

export async function fetchContinueWatching(userId) {
  if (sql) {
    try {
      const res = await sql`
        SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration, updated_at
        FROM continue_watching WHERE user_id = ${userId}
        ORDER BY updated_at DESC
      `;
      return res;
    } catch (e) {
      console.warn('[AnimeVault DB] fetchContinueWatching via Neon failed, falling back to localStorage:', e?.message);
    }
  }
  return getLS(LS_KEYS.CONTINUE_WATCHING, []).filter(c => c.user_id === userId);
}

export async function updateContinueWatching(userId, mediaId, mediaType, mediaTitle, mediaPoster, season = 1, episode = 1, progress = 0, duration = 0) {
  if (isBrowser) {
    const cw = getLS(LS_KEYS.CONTINUE_WATCHING, []);
    const idx = cw.findIndex(c => c.user_id === userId && c.media_id === mediaId && c.media_type === mediaType);
    const now = new Date().toISOString();
    const newItem = { user_id: userId, media_id: mediaId, media_type: mediaType, media_title: mediaTitle, media_poster: mediaPoster, season, episode, progress, duration, updated_at: now };
    if (idx !== -1) cw[idx] = newItem;
    else cw.push(newItem);
    setLS(LS_KEYS.CONTINUE_WATCHING, cw);
  }
  if (sql) {
    try {
      await sql`
        INSERT INTO continue_watching (user_id, media_id, media_type, media_title, media_poster, season, episode, progress, duration, updated_at)
        VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, ${season}, ${episode}, ${progress}, ${duration}, NOW())
        ON CONFLICT (user_id, media_id, media_type)
        DO UPDATE SET
          season = EXCLUDED.season,
          episode = EXCLUDED.episode,
          progress = EXCLUDED.progress,
          duration = EXCLUDED.duration,
          updated_at = NOW(),
          media_poster = EXCLUDED.media_poster,
          media_title = EXCLUDED.media_title
      `;
      return true;
    } catch (e) {
      console.warn('[AnimeVault DB] updateContinueWatching via Neon failed:', e?.message);
    }
  }
  return true;
}

export async function removeFromContinueWatching(userId, mediaId, mediaType) {
  if (isBrowser) {
    const cw = getLS(LS_KEYS.CONTINUE_WATCHING, []).filter(c => !(c.user_id === userId && c.media_id === mediaId && c.media_type === mediaType));
    setLS(LS_KEYS.CONTINUE_WATCHING, cw);
  }
  if (sql) {
    try {
      await sql`DELETE FROM continue_watching WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}`;
      return true;
    } catch (e) { console.warn('[AnimeVault DB] removeFromContinueWatching via Neon failed:', e?.message); }
  }
  return true;
}

/* ==========================================================================
   LIKED ITEMS
   ========================================================================== */

export async function fetchLikedItems(userId) {
  if (sql) {
    try {
      const res = await sql`
        SELECT media_id, media_type, media_title, media_poster, liked_at
        FROM liked_items WHERE user_id = ${userId}
        ORDER BY liked_at DESC
      `;
      return res;
    } catch (e) { console.warn('[AnimeVault DB] fetchLikedItems via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.LIKED_ITEMS, []).filter(l => l.user_id === userId);
}

export async function toggleLikeItem(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  if (isBrowser) {
    const items = getLS(LS_KEYS.LIKED_ITEMS, []);
    const idx = items.findIndex(i => i.user_id === userId && i.media_id === mediaId && i.media_type === mediaType);
    let isLikedNow = false;
    if (idx !== -1) {
      items.splice(idx, 1);
      isLikedNow = false;
    } else {
      items.push({ user_id: userId, media_id: mediaId, media_type: mediaType, media_title: mediaTitle, media_poster: mediaPoster, liked_at: new Date().toISOString() });
      isLikedNow = true;
    }
    setLS(LS_KEYS.LIKED_ITEMS, items);
    if (sql) {
      try {
        if (!isLikedNow) {
          await sql`DELETE FROM liked_items WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}`;
        } else {
          await sql`
            INSERT INTO liked_items (user_id, media_id, media_type, media_title, media_poster, liked_at)
            VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())
            ON CONFLICT (user_id, media_id, media_type) DO NOTHING
          `;
        }
        return { liked: isLikedNow, action: isLikedNow ? 'liked' : 'unliked' };
      } catch (e) {
        console.warn('[AnimeVault DB] toggleLikeItem via Neon failed:', e?.message);
        return { liked: isLikedNow, action: isLikedNow ? 'liked' : 'unliked' };
      }
    }
    return { liked: isLikedNow, action: isLikedNow ? 'liked' : 'unliked' };
  }

  // Server-only path
  if (!sql) return { error: true };
  const existing = await sql`SELECT id FROM liked_items WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}`;
  if (existing.length > 0) {
    await sql`DELETE FROM liked_items WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}`;
    return { liked: false, action: 'unliked' };
  }
  await sql`INSERT INTO liked_items (user_id, media_id, media_type, media_title, media_poster, liked_at) VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())`;
  return { liked: true, action: 'liked' };
}

/* ==========================================================================
   COMMENTS
   ========================================================================== */

export async function fetchMediaComments(mediaId) {
  if (sql) {
    try {
      const res = await sql`SELECT id, username, comment_text, created_at FROM comments WHERE media_id = ${mediaId} ORDER BY created_at DESC`;
      return res;
    } catch (e) { console.warn('[AnimeVault DB] fetchMediaComments via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.COMMENTS, []).filter(c => c.media_id === mediaId);
}

export async function addMediaComment(userId, username, mediaId, commentText) {
  if (!commentText || !commentText.trim()) return { success: false, message: "Comment can't be empty." };
  const newComment = { id: Date.now(), user_id: userId, username, media_id: mediaId, comment_text: commentText, created_at: new Date().toISOString() };
  if (isBrowser) {
    const comments = getLS(LS_KEYS.COMMENTS, []);
    comments.push(newComment);
    setLS(LS_KEYS.COMMENTS, comments);
  }
  if (sql) {
    try {
      const result = await sql`
        INSERT INTO comments (user_id, username, media_id, comment_text, created_at)
        VALUES (${userId}, ${username}, ${mediaId}, ${commentText}, NOW())
        RETURNING id, username, comment_text, created_at
      `;
      return { success: true, comment: result[0] };
    } catch (e) { console.warn('[AnimeVault DB] addMediaComment via Neon failed:', e?.message); }
  }
  return { success: true, comment: newComment };
}

export async function deleteMediaComment(commentId, userId) {
  if (isBrowser) {
    const comments = getLS(LS_KEYS.COMMENTS, []).filter(c => !(c.id === commentId && c.user_id === userId));
    setLS(LS_KEYS.COMMENTS, comments);
  }
  if (sql) {
    try { await sql`DELETE FROM comments WHERE id = ${commentId} AND user_id = ${userId}`; return true; }
    catch (e) { console.warn('[AnimeVault DB] deleteMediaComment via Neon failed:', e?.message); }
  }
  return true;
}

/* ==========================================================================
   PUBLIC PROFILES & ADMIN
   ========================================================================== */

export async function fetchPublicUserProfile(username) {
  if (sql) {
    try {
      const u = await sql`SELECT id, username, avatar, banner, is_admin, created_at FROM users WHERE username = ${username}`;
      if (!u.length) {
        // fall through to localStorage
      } else {
        const userId = u[0].id;
        const [likes, history, continueWatching] = await Promise.all([
          sql`SELECT media_id, media_type, media_title, media_poster FROM liked_items WHERE user_id = ${userId}`,
          sql`SELECT media_id, media_type, media_title, media_poster, watched_at FROM history WHERE user_id = ${userId} ORDER BY watched_at DESC`,
          sql`SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration FROM continue_watching WHERE user_id = ${userId} ORDER BY updated_at DESC`
        ]);
        return { user: u[0], likes, history, continueWatching };
      }
    } catch (e) { console.warn('[AnimeVault DB] fetchPublicUserProfile via Neon failed, falling back to localStorage:', e?.message); }
  }
  const users = getLS(LS_KEYS.USERS, []);
  const user = users.find(u => u.username === username);
  if (!user) return null;
  const userId = user.id;
  return {
    user,
    likes: getLS(LS_KEYS.LIKED_ITEMS, []).filter(l => l.user_id === userId),
    history: getLS(LS_KEYS.HISTORY, []).filter(h => h.user_id === userId),
    continueWatching: getLS(LS_KEYS.CONTINUE_WATCHING, []).filter(c => c.user_id === userId)
  };
}

export async function fetchAdminStats() {
  if (sql) {
    try {
      const [users, comments, likes, history] = await Promise.all([
        sql`SELECT COUNT(*)::int as count FROM users`,
        sql`SELECT COUNT(*)::int as count FROM comments`,
        sql`SELECT COUNT(*)::int as count FROM liked_items`,
        sql`SELECT COUNT(*)::int as count FROM history`
      ]);
      return { totalUsers: users[0].count, totalComments: comments[0].count, totalLikes: likes[0].count, totalEpisodes: history[0].count };
    } catch (e) { console.warn('[AnimeVault DB] fetchAdminStats via Neon failed, falling back to localStorage:', e?.message); }
  }
  return {
    totalUsers: getLS(LS_KEYS.USERS, []).length,
    totalComments: getLS(LS_KEYS.COMMENTS, []).length,
    totalLikes: getLS(LS_KEYS.LIKED_ITEMS, []).length,
    totalEpisodes: getLS(LS_KEYS.HISTORY, []).length
  };
}

export async function fetchAllUsers() {
  if (sql) {
    try {
      const res = await sql`SELECT id, username, avatar, is_admin, created_at FROM users ORDER BY created_at DESC`;
      return res;
    } catch (e) { console.warn('[AnimeVault DB] fetchAllUsers via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.USERS, []);
}

export async function toggleUserAdminStatus(userId) {
  if (sql) {
    try {
      const current = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
      if (!current.length) return false;
      const next = !current[0].is_admin;
      await sql`UPDATE users SET is_admin = ${next} WHERE id = ${userId}`;
      if (isBrowser) {
        const users = getLS(LS_KEYS.USERS, []);
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) { users[idx].is_admin = next; setLS(LS_KEYS.USERS, users); }
      }
      return true;
    } catch (e) { console.warn('[AnimeVault DB] toggleUserAdminStatus via Neon failed:', e?.message); }
  }
  const users = getLS(LS_KEYS.USERS, []);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) { users[idx].is_admin = !users[idx].is_admin; setLS(LS_KEYS.USERS, users); return true; }
  return false;
}

export async function deleteUser(userId) {
  if (isBrowser) {
    setLS(LS_KEYS.USERS, getLS(LS_KEYS.USERS, []).filter(u => u.id !== userId));
    setLS(LS_KEYS.HISTORY, getLS(LS_KEYS.HISTORY, []).filter(h => h.user_id !== userId));
    setLS(LS_KEYS.CONTINUE_WATCHING, getLS(LS_KEYS.CONTINUE_WATCHING, []).filter(c => c.user_id !== userId));
    setLS(LS_KEYS.LIKED_ITEMS, getLS(LS_KEYS.LIKED_ITEMS, []).filter(l => l.user_id !== userId));
    setLS(LS_KEYS.COMMENTS, getLS(LS_KEYS.COMMENTS, []).filter(c => c.user_id !== userId));
  }
  if (sql) {
    try {
      await Promise.all([
        sql`DELETE FROM history WHERE user_id = ${userId}`,
        sql`DELETE FROM continue_watching WHERE user_id = ${userId}`,
        sql`DELETE FROM liked_items WHERE user_id = ${userId}`,
        sql`DELETE FROM comments WHERE user_id = ${userId}`,
        sql`DELETE FROM users WHERE id = ${userId}`
      ]);
      return true;
    } catch (e) { console.warn('[AnimeVault DB] deleteUser via Neon failed:', e?.message); }
  }
  return true;
}

export async function fetchAllComments() {
  if (sql) {
    try {
      const res = await sql`SELECT id, user_id, username, media_id, comment_text, created_at FROM comments ORDER BY created_at DESC`;
      return res;
    } catch (e) { console.warn('[AnimeVault DB] fetchAllComments via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.COMMENTS, []);
}

export async function deleteCommentAdmin(commentId) {
  if (isBrowser) {
    setLS(LS_KEYS.COMMENTS, getLS(LS_KEYS.COMMENTS, []).filter(c => c.id !== commentId));
  }
  if (sql) {
    try { await sql`DELETE FROM comments WHERE id = ${commentId}`; return true; }
    catch (e) { console.warn('[AnimeVault DB] deleteCommentAdmin via Neon failed:', e?.message); }
  }
  return true;
}

export async function fetchSiteSettings() {
  if (sql) {
    try {
      const res = await sql`SELECT key, value FROM site_settings`;
      const settings = {};
      res.forEach(item => { settings[item.key] = item.value; });
      return settings;
    } catch (e) { console.warn('[AnimeVault DB] fetchSiteSettings via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.SETTINGS, { announcement: '', maintenance: 'false', trending_override: '[]' });
}

export async function updateSiteSetting(key, value) {
  if (isBrowser) {
    const settings = getLS(LS_KEYS.SETTINGS, {});
    settings[key] = value;
    setLS(LS_KEYS.SETTINGS, settings);
  }
  if (sql) {
    try {
      await sql`INSERT INTO site_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
      return true;
    } catch (e) { console.warn('[AnimeVault DB] updateSiteSetting via Neon failed:', e?.message); }
  }
  return true;
}

/* ==========================================================================
   REMINDERS
   ========================================================================== */

export async function fetchReminders(userId) {
  if (sql) {
    try {
      const res = await sql`SELECT * FROM reminders WHERE user_id = ${userId} ORDER BY airing_at ASC`;
      return res;
    } catch (e) { console.warn('[AnimeVault DB] fetchReminders via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.REMINDERS, []).filter(r => r.user_id === userId).sort((a, b) => a.airing_at - b.airing_at);
}

export async function addReminder(userId, scheduleId, animeId, title, episode, airingAt, image) {
  if (isBrowser) {
    const reminders = getLS(LS_KEYS.REMINDERS, []);
    const exists = reminders.find(r => r.user_id === userId && r.schedule_id === scheduleId);
    if (exists) return exists;
    const newReminder = { id: Date.now(), user_id: userId, schedule_id: scheduleId, anime_id: animeId, title, episode, airing_at: airingAt, image, created_at: new Date().toISOString() };
    reminders.push(newReminder);
    setLS(LS_KEYS.REMINDERS, reminders);
    if (sql) {
      try {
        const res = await sql`INSERT INTO reminders (user_id, schedule_id, anime_id, title, episode, airing_at, image) VALUES (${userId}, ${scheduleId}, ${animeId}, ${title}, ${episode}, ${airingAt}, ${image}) ON CONFLICT (user_id, schedule_id) DO NOTHING RETURNING *`;
        return res[0] || newReminder;
      } catch (e) { console.warn('[AnimeVault DB] addReminder via Neon failed:', e?.message); return newReminder; }
    }
    return newReminder;
  }
  if (!sql) return null;
  const res = await sql`INSERT INTO reminders (user_id, schedule_id, anime_id, title, episode, airing_at, image) VALUES (${userId}, ${scheduleId}, ${animeId}, ${title}, ${episode}, ${airingAt}, ${image}) ON CONFLICT (user_id, schedule_id) DO NOTHING RETURNING *`;
  return res[0];
}

export async function removeReminder(userId, scheduleId) {
  if (isBrowser) {
    setLS(LS_KEYS.REMINDERS, getLS(LS_KEYS.REMINDERS, []).filter(r => !(r.user_id === userId && r.schedule_id === scheduleId)));
  }
  if (sql) {
    try { await sql`DELETE FROM reminders WHERE user_id = ${userId} AND schedule_id = ${scheduleId}`; return true; }
    catch (e) { console.warn('[AnimeVault DB] removeReminder via Neon failed:', e?.message); }
  }
  return true;
}

/* ==========================================================================
   COLLECTIONS
   ========================================================================== */

export async function fetchAllCollections(userId = null) {
  if (sql) {
    try {
      if (userId) {
        return await sql`SELECT * FROM collections WHERE is_private = FALSE OR user_id = ${userId} ORDER BY created_at DESC`;
      }
      return await sql`SELECT * FROM collections WHERE is_private = FALSE ORDER BY created_at DESC`;
    } catch (e) { console.warn('[AnimeVault DB] fetchAllCollections via Neon failed, falling back to localStorage:', e?.message); }
  }
  const collections = getLS(LS_KEYS.COLLECTIONS, []);
  return collections.filter(c => !c.is_private || (userId && c.user_id === userId));
}

export async function fetchUserCollections(userId) {
  if (sql) {
    try { return await sql`SELECT * FROM collections WHERE user_id = ${userId} ORDER BY created_at DESC`; }
    catch (e) { console.warn('[AnimeVault DB] fetchUserCollections via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.COLLECTIONS, []).filter(c => c.user_id === userId);
}

export async function fetchTrendingCollections(userId = null) {
  if (sql) {
    try {
      return await sql`
        SELECT c.*,
          COUNT(DISTINCT cl.id) as likes_count,
          COUNT(DISTINCT cf.id) as followers_count
        FROM collections c
        LEFT JOIN collection_likes cl ON c.id = cl.collection_id
        LEFT JOIN collection_followers cf ON c.id = cf.collection_id
        WHERE c.is_private = FALSE
        GROUP BY c.id
        ORDER BY likes_count DESC, followers_count DESC
        LIMIT 8
      `;
    } catch (e) { console.warn('[AnimeVault DB] fetchTrendingCollections via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.COLLECTIONS, []).filter(c => !c.is_private).slice(0, 8);
}

export async function fetchCollectionById(collectionId, currentUserId = null) {
  if (sql) {
    try {
      const result = await sql`
        SELECT c.*,
          COUNT(DISTINCT cl.id) as likes_count,
          COUNT(DISTINCT cf.id) as followers_count,
          EXISTS(SELECT 1 FROM collection_likes WHERE collection_id = c.id AND user_id = ${currentUserId}) as is_liked,
          EXISTS(SELECT 1 FROM collection_followers WHERE collection_id = c.id AND user_id = ${currentUserId}) as is_following
        FROM collections c
        LEFT JOIN collection_likes cl ON c.id = cl.collection_id
        LEFT JOIN collection_followers cf ON c.id = cf.collection_id
        WHERE c.id = ${collectionId}
        GROUP BY c.id
      `;
      if (!result.length) return null;
      const collection = result[0];
      if (collection.is_private && (!currentUserId || collection.user_id !== currentUserId)) return null;
      return collection;
    } catch (e) { console.warn('[AnimeVault DB] fetchCollectionById via Neon failed, falling back to localStorage:', e?.message); }
  }
  const collections = getLS(LS_KEYS.COLLECTIONS, []);
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return null;
  if (collection.is_private && (!currentUserId || collection.user_id !== currentUserId)) return null;
  const likes_count = getLS(LS_KEYS.COLLECTION_LIKES, []).filter(l => l.collection_id === collectionId).length;
  const followers_count = getLS(LS_KEYS.COLLECTION_FOLLOWERS, []).filter(f => f.collection_id === collectionId).length;
  const is_liked = getLS(LS_KEYS.COLLECTION_LIKES, []).some(l => l.collection_id === collectionId && l.user_id === currentUserId);
  const is_following = getLS(LS_KEYS.COLLECTION_FOLLOWERS, []).some(f => f.collection_id === collectionId && f.user_id === currentUserId);
  return { ...collection, likes_count, followers_count, is_liked, is_following };
}

export async function fetchCollectionItems(collectionId) {
  if (sql) {
    try { return await sql`SELECT * FROM collection_items WHERE collection_id = ${collectionId} ORDER BY added_at DESC`; }
    catch (e) { console.warn('[AnimeVault DB] fetchCollectionItems via Neon failed, falling back to localStorage:', e?.message); }
  }
  return getLS(LS_KEYS.COLLECTION_ITEMS, []).filter(i => i.collection_id === collectionId);
}

export async function createCollection(userId, username, title, description, cover, isPrivate) {
  if (isBrowser) {
    const collections = getLS(LS_KEYS.COLLECTIONS, []);
    const newCollection = { id: Date.now(), user_id: userId, username, title, description, cover, is_private: isPrivate, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    collections.push(newCollection);
    setLS(LS_KEYS.COLLECTIONS, collections);
    if (sql) {
      try {
        const res = await sql`INSERT INTO collections (user_id, username, title, description, cover, is_private) VALUES (${userId}, ${username}, ${title}, ${description}, ${cover}, ${isPrivate}) RETURNING *`;
        return res[0] || newCollection;
      } catch (e) { console.warn('[AnimeVault DB] createCollection via Neon failed:', e?.message); return newCollection; }
    }
    return newCollection;
  }
  if (!sql) return null;
  const res = await sql`INSERT INTO collections (user_id, username, title, description, cover, is_private) VALUES (${userId}, ${username}, ${title}, ${description}, ${cover}, ${isPrivate}) RETURNING *`;
  return res[0];
}

export async function updateCollection(collectionId, userId, title, description, cover, isPrivate) {
  if (isBrowser) {
    const collections = getLS(LS_KEYS.COLLECTIONS, []);
    const idx = collections.findIndex(c => c.id === collectionId && c.user_id === userId);
    if (idx === -1) return null;
    collections[idx].title = title;
    collections[idx].description = description;
    collections[idx].cover = cover;
    collections[idx].is_private = isPrivate;
    collections[idx].updated_at = new Date().toISOString();
    setLS(LS_KEYS.COLLECTIONS, collections);
    if (sql) {
      try {
        const res = await sql`UPDATE collections SET title = ${title}, description = ${description}, cover = ${cover}, is_private = ${isPrivate}, updated_at = NOW() WHERE id = ${collectionId} AND user_id = ${userId} RETURNING *`;
        return res[0] || collections[idx];
      } catch (e) { console.warn('[AnimeVault DB] updateCollection via Neon failed:', e?.message); return collections[idx]; }
    }
    return collections[idx];
  }
  if (!sql) return null;
  const res = await sql`UPDATE collections SET title = ${title}, description = ${description}, cover = ${cover}, is_private = ${isPrivate}, updated_at = NOW() WHERE id = ${collectionId} AND user_id = ${userId} RETURNING *`;
  return res[0];
}

export async function deleteCollection(collectionId, userId) {
  if (isBrowser) {
    setLS(LS_KEYS.COLLECTIONS, getLS(LS_KEYS.COLLECTIONS, []).filter(c => !(c.id === collectionId && c.user_id === userId)));
    setLS(LS_KEYS.COLLECTION_ITEMS, getLS(LS_KEYS.COLLECTION_ITEMS, []).filter(i => i.collection_id !== collectionId));
    setLS(LS_KEYS.COLLECTION_LIKES, getLS(LS_KEYS.COLLECTION_LIKES, []).filter(l => l.collection_id !== collectionId));
    setLS(LS_KEYS.COLLECTION_FOLLOWERS, getLS(LS_KEYS.COLLECTION_FOLLOWERS, []).filter(f => f.collection_id !== collectionId));
  }
  if (sql) {
    try {
      await Promise.all([
        sql`DELETE FROM collection_items WHERE collection_id = ${collectionId}`,
        sql`DELETE FROM collection_likes WHERE collection_id = ${collectionId}`,
        sql`DELETE FROM collection_followers WHERE collection_id = ${collectionId}`,
        sql`DELETE FROM collections WHERE id = ${collectionId} AND user_id = ${userId}`
      ]);
      return true;
    } catch (e) { console.warn('[AnimeVault DB] deleteCollection via Neon failed:', e?.message); }
  }
  return true;
}

export async function addItemToCollection(collectionId, mediaId, mediaType, title, poster, score = null, status = null) {
  if (isBrowser) {
    const items = getLS(LS_KEYS.COLLECTION_ITEMS, []);
    const exists = items.find(i => i.collection_id === collectionId && i.media_id === mediaId && i.media_type === mediaType);
    if (exists) return exists;
    const newItem = { id: Date.now(), collection_id: collectionId, media_id: mediaId, media_type: mediaType, title, poster, score, status, added_at: new Date().toISOString() };
    items.push(newItem);
    setLS(LS_KEYS.COLLECTION_ITEMS, items);
    if (sql) {
      try {
        const res = await sql`INSERT INTO collection_items (collection_id, media_id, media_type, title, poster, score, status) VALUES (${collectionId}, ${mediaId}, ${mediaType}, ${title}, ${poster}, ${score}, ${status}) ON CONFLICT (collection_id, media_id, media_type) DO NOTHING RETURNING *`;
        return res[0] || newItem;
      } catch (e) { console.warn('[AnimeVault DB] addItemToCollection via Neon failed:', e?.message); return newItem; }
    }
    return newItem;
  }
  if (!sql) return null;
  const res = await sql`INSERT INTO collection_items (collection_id, media_id, media_type, title, poster, score, status) VALUES (${collectionId}, ${mediaId}, ${mediaType}, ${title}, ${poster}, ${score}, ${status}) ON CONFLICT (collection_id, media_id, media_type) DO NOTHING RETURNING *`;
  return res[0];
}

export async function removeItemFromCollection(collectionId, itemId) {
  if (isBrowser) {
    setLS(LS_KEYS.COLLECTION_ITEMS, getLS(LS_KEYS.COLLECTION_ITEMS, []).filter(i => !(i.collection_id === collectionId && i.id === itemId)));
  }
  if (sql) {
    try { await sql`DELETE FROM collection_items WHERE collection_id = ${collectionId} AND id = ${itemId}`; return true; }
    catch (e) { console.warn('[AnimeVault DB] removeItemFromCollection via Neon failed:', e?.message); }
  }
  return true;
}

export async function toggleLikeCollection(collectionId, userId) {
  if (isBrowser) {
    const likes = getLS(LS_KEYS.COLLECTION_LIKES, []);
    const idx = likes.findIndex(l => l.collection_id === collectionId && l.user_id === userId);
    let now = false;
    if (idx !== -1) { likes.splice(idx, 1); now = false; }
    else { likes.push({ collection_id: collectionId, user_id: userId, liked_at: new Date().toISOString(), id: Date.now() }); now = true; }
    setLS(LS_KEYS.COLLECTION_LIKES, likes);
    if (sql) {
      try {
        if (!now) await sql`DELETE FROM collection_likes WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
        else await sql`INSERT INTO collection_likes (collection_id, user_id) VALUES (${collectionId}, ${userId}) ON CONFLICT DO NOTHING`;
        return { liked: now };
      } catch (e) { console.warn('[AnimeVault DB] toggleLikeCollection via Neon failed:', e?.message); return { liked: now }; }
    }
    return { liked: now };
  }
  if (!sql) return { error: true };
  const existing = await sql`SELECT id FROM collection_likes WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM collection_likes WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
    return { liked: false };
  }
  await sql`INSERT INTO collection_likes (collection_id, user_id) VALUES (${collectionId}, ${userId})`;
  return { liked: true };
}

export async function toggleFollowCollection(collectionId, userId) {
  if (isBrowser) {
    const followers = getLS(LS_KEYS.COLLECTION_FOLLOWERS, []);
    const idx = followers.findIndex(f => f.collection_id === collectionId && f.user_id === userId);
    let now = false;
    if (idx !== -1) { followers.splice(idx, 1); now = false; }
    else { followers.push({ collection_id: collectionId, user_id: userId, followed_at: new Date().toISOString(), id: Date.now() }); now = true; }
    setLS(LS_KEYS.COLLECTION_FOLLOWERS, followers);
    if (sql) {
      try {
        if (!now) await sql`DELETE FROM collection_followers WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
        else await sql`INSERT INTO collection_followers (collection_id, user_id) VALUES (${collectionId}, ${userId}) ON CONFLICT DO NOTHING`;
        return { following: now };
      } catch (e) { console.warn('[AnimeVault DB] toggleFollowCollection via Neon failed:', e?.message); return { following: now }; }
    }
    return { following: now };
  }
  if (!sql) return { error: true };
  const existing = await sql`SELECT id FROM collection_followers WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
  if (existing.length > 0) {
    await sql`DELETE FROM collection_followers WHERE collection_id = ${collectionId} AND user_id = ${userId}`;
    return { following: false };
  }
  await sql`INSERT INTO collection_followers (collection_id, user_id) VALUES (${collectionId}, ${userId})`;
  return { following: true };
}

export async function duplicateCollection(collectionId, userId, username) {
  const original = await fetchCollectionById(collectionId, userId);
  if (!original) return null

  const newCollection = await createCollection(
    userId, username,
    (original.title || 'Untitled') + ' (Copy)',
    original.description, original.cover, true
  );
  if (!newCollection) return null;
  const items = await fetchCollectionItems(collectionId);
  for (const item of items) {
    await addItemToCollection(
      newCollection.id, item.media_id, item.media_type,
      item.title, item.poster, item.score, item.status
    );
  }
  return newCollection;
}

export async function syncGoogleUserToDb(email, displayName, googleAvatar) {
  return { success: false, message: 'Google sync not available in this version' };
}

if (isBrowser) {
  initLocalStorage();
}
