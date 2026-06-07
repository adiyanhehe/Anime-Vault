
// Check if we're in a browser or server environment
const isBrowser = typeof window !== 'undefined';

// ---------------------- BROWSER FALLBACK (LOCALSTORAGE) ----------------------
const BROWSER_STORAGE = {
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
  COLLECTION_FOLLOWERS: 'animevault_collection_followers'
};

// Initialize localStorage storage
function initLocalStorage() {
  if (!isBrowser) return;
  const defaults = {
    [BROWSER_STORAGE.USERS]: [],
    [BROWSER_STORAGE.HISTORY]: [],
    [BROWSER_STORAGE.CONTINUE_WATCHING]: [],
    [BROWSER_STORAGE.LIKED_ITEMS]: [],
    [BROWSER_STORAGE.COMMENTS]: [],
    [BROWSER_STORAGE.REMINDERS]: [],
    [BROWSER_STORAGE.COLLECTIONS]: [],
    [BROWSER_STORAGE.COLLECTION_ITEMS]: [],
    [BROWSER_STORAGE.COLLECTION_LIKES]: [],
    [BROWSER_STORAGE.COLLECTION_FOLLOWERS]: [],
    [BROWSER_STORAGE.SETTINGS]: {
      announcement: '🎉 Welcome to AnimeVault!',
      maintenance: 'false',
      trending_override: '[]'
    }
  };
  Object.entries(defaults).forEach(([key, value]) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

// Helper to get/set localStorage
function getLS(key) { return JSON.parse(localStorage.getItem(key) || '[]'); }
function setLS(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ---------------------- SERVER (NEON DB) SETUP ----------------------
let sql = null;
if (!isBrowser) {
  // Wrap in async IIFE to avoid top-level await (Vite target es2020 doesn't support it).
  // This block only runs on the server (isBrowser is false), so the deferred import
  // is safe and the in-browser bundle never evaluates it.
  (async () => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const DATABASE_URL = 'postgresql://neondb_owner:npg_cprHoA5wBt0Z@ep-lively-surf-apnkb5f1.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';
      sql = neon(DATABASE_URL);
    } catch (e) {
      console.log('Neon not available, using localStorage only');
    }
  })();
}

// Initialize database tables (server-side only)
export async function initDatabase() {
  if (isBrowser) {
    initLocalStorage();
    return;
  }
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
    // Auto-migrate columns
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner TEXT`; } catch (e) {}
    try { await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`; } catch (e) {}
    // Site settings table
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    // Seed default settings
    await sql`
      INSERT INTO site_settings (key, value)
      VALUES 
        ('announcement', '🎉 Welcome to AnimeVault V2 - Brand New Database & Synced Accounts Integrated!'),
        ('maintenance', 'false'),
        ('trending_override', '[]')
      ON CONFLICT (key) DO NOTHING
    `;
    console.log('Neon Database Initialized Successfully.');
  } catch (err) {
    console.error('Failed to initialize database tables:', err);
  }
}

/* ==========================================================================
   USER MANAGEMENT
   ========================================================================== */

export async function userSignup(username, password) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) return { success: false, message: 'All fields are required.' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
  if (trimmedUser.length < 3) return { success: false, message: 'Username must be at least 3 characters.' };

  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS);
    if (users.find(u => u.username === trimmedUser)) return { success: false, message: 'Username already taken.' };
    const isAdmin = trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase().includes('admin');
    const newUser = {
      id: Date.now(),
      username: trimmedUser,
      password: password,
      avatar: null,
      banner: null,
      is_admin: isAdmin,
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    setLS(BROWSER_STORAGE.USERS, users);
    return { success: true, user: newUser };
  }

  if (!sql) return { success: false, message: 'Server not available.' };
  // Server side: hash password (simple hash for demo)
  const hashedPassword = btoa(password);
  const isAdmin = trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase().includes('admin');
  try {
    const result = await sql`
      INSERT INTO users (username, password, is_admin) 
      VALUES (${trimmedUser}, ${hashedPassword}, ${isAdmin})
      RETURNING id, username, avatar, banner, is_admin
    `;
    return { success: true, user: result[0] };
  } catch (e) {
    if (e.message?.includes('duplicate')) return { success: false, message: 'Username already taken.' };
    return { success: false, message: e.message || 'Signup failed.' };
  }
}

export async function userLogin(username, password) {
  const trimmedUser = username.trim();
  if (!trimmedUser || !password) return { success: false, message: 'All fields are required.' };

  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS);
    const user = users.find(u => u.username === trimmedUser && u.password === password);
    if (!user) return { success: false, message: 'Invalid username or password.' };
    return { success: true, user };
  }

  if (!sql) return { success: false, message: 'Server not available.' };
  const hashedPassword = btoa(password);
  const result = await sql`
    SELECT id, username, password, avatar, banner, is_admin FROM users 
    WHERE username = ${trimmedUser}
  `;
  if (!result.length) return { success: false, message: 'Invalid username or password.' };
  if (result[0].password !== hashedPassword) return { success: false, message: 'Invalid username or password.' };
  const user = { ...result[0] };
  delete user.password;
  return { success: true, user };
}

export async function updateUserProfile(userId, avatarUrl, bannerUrl) {
  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].avatar = avatarUrl;
      users[idx].banner = bannerUrl;
      setLS(BROWSER_STORAGE.USERS, users);
      return { success: true, user: users[idx] };
    }
    return { success: false, message: 'User not found.' };
  }

  if (!sql) return { success: false, message: 'Server not available.' };
  const result = await sql`
    UPDATE users 
    SET avatar = ${avatarUrl}, banner = ${bannerUrl}
    WHERE id = ${userId}
    RETURNING id, username, avatar, banner, is_admin
  `;
  return { success: true, user: result[0] };
}

/* ==========================================================================
   HISTORY MANAGEMENT
   ========================================================================== */

export async function fetchWatchHistory(userId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.HISTORY).filter(h => h.user_id === userId);
  }
  if (!sql) return [];
  return await sql`
    SELECT media_id, media_type, media_title, media_poster, watched_at 
    FROM history WHERE user_id = ${userId}
    ORDER BY watched_at DESC
  `;
}

export async function addToHistory(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  if (isBrowser) {
    const history = getLS(BROWSER_STORAGE.HISTORY);
    const idx = history.findIndex(h => h.user_id === userId && h.media_id === mediaId && h.media_type === mediaType);
    const now = new Date().toISOString();
    if (idx !== -1) history[idx].watched_at = now;
    else history.push({ user_id: userId, media_id, media_type, media_title, media_poster, watched_at: now });
    setLS(BROWSER_STORAGE.HISTORY, history);
    return true;
  }
  if (!sql) return false;
  await sql`
    INSERT INTO history (user_id, media_id, media_type, media_title, media_poster, watched_at)
    VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())
    ON CONFLICT (user_id, media_id, media_type)
    DO UPDATE SET watched_at = NOW(), media_poster = EXCLUDED.media_poster, media_title = EXCLUDED.media_title
  `;
  return true;
}

export async function clearWatchHistory(userId) {
  if (isBrowser) {
    const history = getLS(BROWSER_STORAGE.HISTORY).filter(h => h.user_id !== userId);
    setLS(BROWSER_STORAGE.HISTORY, history);
    return true;
  }
  if (!sql) return false;
  await sql`DELETE FROM history WHERE user_id = ${userId}`;
  return true;
}

/* ==========================================================================
   CONTINUE WATCHING
   ========================================================================== */

export async function fetchContinueWatching(userId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.CONTINUE_WATCHING).filter(c => c.user_id === userId);
  }
  if (!sql) return [];
  return await sql`
    SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration, updated_at
    FROM continue_watching WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
}

export async function updateContinueWatching(userId, mediaId, mediaType, mediaTitle, mediaPoster, season = 1, episode = 1, progress = 0, duration = 0) {
  if (isBrowser) {
    const cw = getLS(BROWSER_STORAGE.CONTINUE_WATCHING);
    const idx = cw.findIndex(c => c.user_id === userId && c.media_id === mediaId && c.media_type === mediaType);
    const now = new Date().toISOString();
    const newItem = { user_id: userId, media_id, media_type, media_title, media_poster, season, episode, progress, duration, updated_at: now };
    if (idx !== -1) cw[idx] = newItem;
    else cw.push(newItem);
    setLS(BROWSER_STORAGE.CONTINUE_WATCHING, cw);
    return true;
  }
  if (!sql) return false;
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
}

export async function removeFromContinueWatching(userId, mediaId, mediaType) {
  if (isBrowser) {
    const cw = getLS(BROWSER_STORAGE.CONTINUE_WATCHING).filter(c => !(c.user_id === userId && c.media_id === mediaId && c.media_type === mediaType));
    setLS(BROWSER_STORAGE.CONTINUE_WATCHING, cw);
    return true;
  }
  if (!sql) return false;
  await sql`
    DELETE FROM continue_watching 
    WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}
  `;
  return true;
}

/* ==========================================================================
   LIKED ITEMS
   ========================================================================== */

export async function fetchLikedItems(userId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.LIKED_ITEMS).filter(l => l.user_id === userId);
  }
  if (!sql) return [];
  return await sql`
    SELECT media_id, media_type, media_title, media_poster, liked_at
    FROM liked_items WHERE user_id = ${userId}
    ORDER BY liked_at DESC
  `;
}

export async function toggleLikeItem(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  if (isBrowser) {
    const items = getLS(BROWSER_STORAGE.LIKED_ITEMS);
    const idx = items.findIndex(i => i.user_id === userId && i.media_id === mediaId && i.media_type === mediaType);
    if (idx !== -1) {
      items.splice(idx, 1);
      setLS(BROWSER_STORAGE.LIKED_ITEMS, items);
      return { liked: false };
    } else {
      items.push({ user_id: userId, media_id, media_type, media_title, media_poster, liked_at: new Date().toISOString() });
      setLS(BROWSER_STORAGE.LIKED_ITEMS, items);
      return { liked: true };
    }
  }

  if (!sql) return { error: true };
  const existing = await sql`
    SELECT id FROM liked_items 
    WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}
  `;
  if (existing.length > 0) {
    await sql`
      DELETE FROM liked_items 
      WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}
    `;
    return { liked: false };
  } else {
    await sql`
      INSERT INTO liked_items (user_id, media_id, media_type, media_title, media_poster, liked_at)
      VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())
    `;
    return { liked: true };
  }
}

/* ==========================================================================
   COMMENTS
   ========================================================================== */

export async function fetchMediaComments(mediaId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.COMMENTS).filter(c => c.media_id === mediaId);
  }
  if (!sql) return [];
  return await sql`
    SELECT id, username, comment_text, created_at 
    FROM comments WHERE media_id = ${mediaId}
    ORDER BY created_at DESC
  `;
}

export async function addMediaComment(userId, username, mediaId, commentText) {
  if (!commentText.trim()) return { success: false, message: 'Comment can\'t be empty.' };
  if (isBrowser) {
    const comments = getLS(BROWSER_STORAGE.COMMENTS);
    const newComment = { id: Date.now(), user_id: userId, username, media_id: mediaId, comment_text: commentText, created_at: new Date().toISOString() };
    comments.push(newComment);
    setLS(BROWSER_STORAGE.COMMENTS, comments);
    return { success: true, comment: newComment };
  }
  if (!sql) return { success: false, message: 'Server not available.' };
  const result = await sql`
    INSERT INTO comments (user_id, username, media_id, comment_text, created_at)
    VALUES (${userId}, ${username}, ${mediaId}, ${commentText}, NOW())
    RETURNING id, username, comment_text, created_at
  `;
  return { success: true, comment: result[0] };
}

export async function deleteMediaComment(commentId, userId) {
  if (isBrowser) {
    const comments = getLS(BROWSER_STORAGE.COMMENTS).filter(c => !(c.id === commentId && c.user_id === userId));
    setLS(BROWSER_STORAGE.COMMENTS, comments);
    return true;
  }
  if (!sql) return false;
  await sql`
    DELETE FROM comments 
    WHERE id = ${commentId} AND user_id = ${userId}
  `;
  return true;
}

/* ==========================================================================
   PUBLIC PROFILES & ADMIN
   ========================================================================== */

export async function fetchPublicUserProfile(username) {
  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS);
    const user = users.find(u => u.username === username);
    if (!user) return null;
    const userId = user.id;
    const likes = getLS(BROWSER_STORAGE.LIKED_ITEMS).filter(l => l.user_id === userId);
    const history = getLS(BROWSER_STORAGE.HISTORY).filter(h => h.user_id === userId);
    const continueWatching = getLS(BROWSER_STORAGE.CONTINUE_WATCHING).filter(c => c.user_id === userId);
    return { user, likes, history, continueWatching };
  }
  if (!sql) return null;
  const u = await sql`SELECT id, username, avatar, banner, is_admin, created_at FROM users WHERE username = ${username}`;
  if (!u.length) return null;
  const userId = u[0].id;
  const [likes, history, continueWatching] = await Promise.all([
    sql`SELECT media_id, media_type, media_title, media_poster FROM liked_items WHERE user_id = ${userId}`,
    sql`SELECT media_id, media_type, media_title, media_poster, watched_at FROM history WHERE user_id = ${userId} ORDER BY watched_at DESC`,
    sql`SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration FROM continue_watching WHERE user_id = ${userId} ORDER BY updated_at DESC`
  ]);
  return { user: u[0], likes, history, continueWatching };
}

export async function fetchAdminStats() {
  if (isBrowser) {
    return { totalUsers: getLS(BROWSER_STORAGE.USERS).length, totalComments: getLS(BROWSER_STORAGE.COMMENTS).length, totalLikes: getLS(BROWSER_STORAGE.LIKED_ITEMS).length, totalEpisodes: getLS(BROWSER_STORAGE.HISTORY).length };
  }
  if (!sql) return { totalUsers: 0, totalComments: 0, totalLikes: 0, totalEpisodes: 0 };
  const [users, comments, likes, history] = await Promise.all([
    sql`SELECT COUNT(*)::int as count FROM users`,
    sql`SELECT COUNT(*)::int as count FROM comments`,
    sql`SELECT COUNT(*)::int as count FROM liked_items`,
    sql`SELECT COUNT(*)::int as count FROM history`
  ]);
  return { totalUsers: users[0].count, totalComments: comments[0].count, totalLikes: likes[0].count, totalEpisodes: history[0].count };
}

export async function fetchAllUsers() {
  if (isBrowser) return getLS(BROWSER_STORAGE.USERS);
  if (!sql) return [];
  return await sql`SELECT id, username, avatar, is_admin, created_at FROM users ORDER BY created_at DESC`;
}

export async function toggleUserAdminStatus(userId) {
  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].is_admin = !users[idx].is_admin;
      setLS(BROWSER_STORAGE.USERS, users);
      return true;
    }
    return false;
  }
  if (!sql) return false;
  const current = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
  if (!current.length) return false;
  const next = !current[0].is_admin;
  await sql`UPDATE users SET is_admin = ${next} WHERE id = ${userId}`;
  return true;
}

export async function deleteUser(userId) {
  if (isBrowser) {
    const users = getLS(BROWSER_STORAGE.USERS).filter(u => u.id !== userId);
    setLS(BROWSER_STORAGE.USERS, users);
    setLS(BROWSER_STORAGE.HISTORY, getLS(BROWSER_STORAGE.HISTORY).filter(h => h.user_id !== userId));
    setLS(BROWSER_STORAGE.CONTINUE_WATCHING, getLS(BROWSER_STORAGE.CONTINUE_WATCHING).filter(c => c.user_id !== userId));
    setLS(BROWSER_STORAGE.LIKED_ITEMS, getLS(BROWSER_STORAGE.LIKED_ITEMS).filter(l => l.user_id !== userId));
    setLS(BROWSER_STORAGE.COMMENTS, getLS(BROWSER_STORAGE.COMMENTS).filter(c => c.user_id !== userId));
    return true;
  }
  if (!sql) return false;
  await Promise.all([
    sql`DELETE FROM history WHERE user_id = ${userId}`,
    sql`DELETE FROM continue_watching WHERE user_id = ${userId}`,
    sql`DELETE FROM liked_items WHERE user_id = ${userId}`,
    sql`DELETE FROM comments WHERE user_id = ${userId}`,
    sql`DELETE FROM users WHERE id = ${userId}`
  ]);
  return true;
}

export async function fetchAllComments() {
  if (isBrowser) return getLS(BROWSER_STORAGE.COMMENTS);
  if (!sql) return [];
  return await sql`SELECT id, user_id, username, media_id, comment_text, created_at FROM comments ORDER BY created_at DESC`;
}

export async function deleteCommentAdmin(commentId) {
  if (isBrowser) {
    const comments = getLS(BROWSER_STORAGE.COMMENTS).filter(c => c.id !== commentId);
    setLS(BROWSER_STORAGE.COMMENTS, comments);
    return true;
  }
  if (!sql) return false;
  await sql`DELETE FROM comments WHERE id = ${commentId}`;
  return true;
}

export async function fetchSiteSettings() {
  if (isBrowser) {
    return JSON.parse(localStorage.getItem(BROWSER_STORAGE.SETTINGS) || '{}');
  }
  if (!sql) return { announcement: '', maintenance: 'false', trending_override: '[]' };
  const res = await sql`SELECT key, value FROM site_settings`;
  const settings = {};
  res.forEach(item => { settings[item.key] = item.value; });
  return settings;
}

export async function updateSiteSetting(key, value) {
  if (isBrowser) {
    const settings = JSON.parse(localStorage.getItem(BROWSER_STORAGE.SETTINGS) || '{}');
    settings[key] = value;
    localStorage.setItem(BROWSER_STORAGE.SETTINGS, JSON.stringify(settings));
    return true;
  }
  if (!sql) return false;
  await sql`INSERT INTO site_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  return true;
}

/* ==========================================================================
   REMINDERS
   ========================================================================== */

export async function fetchReminders(userId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.REMINDERS).filter(r => r.user_id === userId).sort((a,b) => a.airing_at - b.airing_at);
  }
  if (!sql) return [];
  return await sql`
    SELECT * FROM reminders WHERE user_id = ${userId} ORDER BY airing_at ASC
  `;
}

export async function addReminder(userId, scheduleId, animeId, title, episode, airingAt, image) {
  if (isBrowser) {
    const reminders = getLS(BROWSER_STORAGE.REMINDERS);
    const exists = reminders.find(r => r.user_id === userId && r.schedule_id === scheduleId);
    if (exists) return exists;
    const newReminder = { user_id: userId, schedule_id: scheduleId, anime_id: animeId, title, episode, airing_at: airingAt, image, created_at: new Date().toISOString(), id: Date.now() };
    reminders.push(newReminder);
    setLS(BROWSER_STORAGE.REMINDERS, reminders);
    return newReminder;
  }

  if (!sql) return null;
  const result = await sql`
    INSERT INTO reminders (user_id, schedule_id, anime_id, title, episode, airing_at, image)
    VALUES (${userId}, ${scheduleId}, ${animeId}, ${title}, ${episode}, ${airingAt}, ${image})
    ON CONFLICT (user_id, schedule_id) DO NOTHING
    RETURNING *
  `;
  return result[0];
}

export async function removeReminder(userId, scheduleId) {
  if (isBrowser) {
    const reminders = getLS(BROWSER_STORAGE.REMINDERS).filter(r => !(r.user_id === userId && r.schedule_id === scheduleId));
    setLS(BROWSER_STORAGE.REMINDERS, reminders);
    return true;
  }
  if (!sql) return false;
  await sql`DELETE FROM reminders WHERE user_id = ${userId} AND schedule_id = ${scheduleId}`;
  return true;
}

/* ==========================================================================
   COLLECTIONS
   ========================================================================== */

export async function fetchAllCollections(userId = null) {
  if (isBrowser) {
    const collections = getLS(BROWSER_STORAGE.COLLECTIONS);
    return collections.filter(c => !c.is_private || (userId && c.user_id === userId));
  }
  if (!sql) return [];
  if (userId) {
    return await sql`
      SELECT * FROM collections 
      WHERE is_private = FALSE OR user_id = ${userId}
      ORDER BY created_at DESC
    `;
  }
  return await sql`
    SELECT * FROM collections 
    WHERE is_private = FALSE
    ORDER BY created_at DESC
  `;
}

export async function fetchUserCollections(userId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.COLLECTIONS).filter(c => c.user_id === userId);
  }
  if (!sql) return [];
  return await sql`
    SELECT * FROM collections 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
}

export async function fetchTrendingCollections(userId = null) {
  if (isBrowser) {
    const collections = getLS(BROWSER_STORAGE.COLLECTIONS);
    return collections.filter(c => !c.is_private).slice(0, 8);
  }
  if (!sql) return [];
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
}

export async function fetchCollectionById(collectionId, currentUserId = null) {
  if (isBrowser) {
    const collections = getLS(BROWSER_STORAGE.COLLECTIONS);
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return null;
    if (collection.is_private && (!currentUserId || collection.user_id !== currentUserId)) return null;
    const likes_count = getLS(BROWSER_STORAGE.COLLECTION_LIKES).filter(l => l.collection_id === collectionId).length;
    const followers_count = getLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS).filter(f => f.collection_id === collectionId).length;
    const is_liked = getLS(BROWSER_STORAGE.COLLECTION_LIKES).some(l => l.collection_id === collectionId && l.user_id === currentUserId);
    const is_following = getLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS).some(f => f.collection_id === collectionId && f.user_id === currentUserId);
    return { ...collection, likes_count, followers_count, is_liked, is_following };
  }
  if (!sql) return null;
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
}

export async function fetchCollectionItems(collectionId) {
  if (isBrowser) {
    return getLS(BROWSER_STORAGE.COLLECTION_ITEMS).filter(i => i.collection_id === collectionId);
  }
  if (!sql) return [];
  return await sql`
    SELECT * FROM collection_items 
    WHERE collection_id = ${collectionId}
    ORDER BY added_at DESC
  `;
}

export async function createCollection(userId, username, title, description, cover, isPrivate) {
  if (isBrowser) {
    const collections = getLS(BROWSER_STORAGE.COLLECTIONS);
    const newCollection = {
      id: Date.now(),
      user_id: userId,
      username,
      title,
      description,
      cover,
      is_private: isPrivate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    collections.push(newCollection);
    setLS(BROWSER_STORAGE.COLLECTIONS, collections);
    return newCollection;
  }
  if (!sql) return null;
  const result = await sql`
    INSERT INTO collections (user_id, username, title, description, cover, is_private)
    VALUES (${userId}, ${username}, ${title}, ${description}, ${cover}, ${isPrivate})
    RETURNING *
  `;
  return result[0];
}

export async function updateCollection(collectionId, userId, title, description, cover, isPrivate) {
  if (isBrowser) {
    const collections = getLS(BROWSER_STORAGE.COLLECTIONS);
    const idx = collections.findIndex(c => c.id === collectionId && c.user_id === userId);
    if (idx === -1) return null;
    collections[idx].title = title;
    collections[idx].description = description;
    collections[idx].cover = cover;
    collections[idx].is_private = isPrivate;
    collections[idx].updated_at = new Date().toISOString();
    setLS(BROWSER_STORAGE.COLLECTIONS, collections);
    return collections[idx];
  }
  if (!sql) return null;
  const result = await sql`
    UPDATE collections 
    SET title = ${title}, description = ${description}, cover = ${cover}, is_private = ${isPrivate}, updated_at = NOW()
    WHERE id = ${collectionId} AND user_id = ${userId}
    RETURNING *
  `;
  return result[0];
}

export async function deleteCollection(collectionId, userId) {
  if (isBrowser) {
    setLS(BROWSER_STORAGE.COLLECTIONS, getLS(BROWSER_STORAGE.COLLECTIONS).filter(c => !(c.id === collectionId && c.user_id === userId)));
    setLS(BROWSER_STORAGE.COLLECTION_ITEMS, getLS(BROWSER_STORAGE.COLLECTION_ITEMS).filter(i => i.collection_id !== collectionId));
    setLS(BROWSER_STORAGE.COLLECTION_LIKES, getLS(BROWSER_STORAGE.COLLECTION_LIKES).filter(l => l.collection_id !== collectionId));
    setLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS, getLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS).filter(f => f.collection_id !== collectionId));
    return true;
  }
  if (!sql) return false;
  await Promise.all([
    sql`DELETE FROM collection_items WHERE collection_id = ${collectionId}`,
    sql`DELETE FROM collection_likes WHERE collection_id = ${collectionId}`,
    sql`DELETE FROM collection_followers WHERE collection_id = ${collectionId}`,
    sql`DELETE FROM collections WHERE id = ${collectionId} AND user_id = ${userId}`
  ]);
  return true;
}

export async function addItemToCollection(collectionId, mediaId, mediaType, title, poster, score = null, status = null) {
  if (isBrowser) {
    const items = getLS(BROWSER_STORAGE.COLLECTION_ITEMS);
    const exists = items.find(i => i.collection_id === collectionId && i.media_id === mediaId && i.media_type === mediaType);
    if (exists) return exists;
    const newItem = {
      id: Date.now(),
      collection_id: collectionId,
      media_id: mediaId,
      media_type: mediaType,
      title,
      poster,
      score,
      status,
      added_at: new Date().toISOString()
    };
    items.push(newItem);
    setLS(BROWSER_STORAGE.COLLECTION_ITEMS, items);
    return newItem;
  }
  if (!sql) return null;
  const result = await sql`
    INSERT INTO collection_items (collection_id, media_id, media_type, title, poster, score, status)
    VALUES (${collectionId}, ${mediaId}, ${mediaType}, ${title}, ${poster}, ${score}, ${status})
    ON CONFLICT (collection_id, media_id, media_type) DO NOTHING
    RETURNING *
  `;
  return result[0];
}

export async function removeItemFromCollection(collectionId, itemId) {
  if (isBrowser) {
    setLS(BROWSER_STORAGE.COLLECTION_ITEMS, getLS(BROWSER_STORAGE.COLLECTION_ITEMS).filter(i => !(i.collection_id === collectionId && i.id === itemId)));
    return true;
  }
  if (!sql) return false;
  await sql`DELETE FROM collection_items WHERE collection_id = ${collectionId} AND id = ${itemId}`;
  return true;
}

export async function toggleLikeCollection(collectionId, userId) {
  if (isBrowser) {
    const likes = getLS(BROWSER_STORAGE.COLLECTION_LIKES);
    const idx = likes.findIndex(l => l.collection_id === collectionId && l.user_id === userId);
    if (idx !== -1) {
      likes.splice(idx, 1);
      setLS(BROWSER_STORAGE.COLLECTION_LIKES, likes);
      return { liked: false };
    }
    likes.push({ collection_id: collectionId, user_id: userId, liked_at: new Date().toISOString(), id: Date.now() });
    setLS(BROWSER_STORAGE.COLLECTION_LIKES, likes);
    return { liked: true };
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
    const followers = getLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS);
    const idx = followers.findIndex(f => f.collection_id === collectionId && f.user_id === userId);
    if (idx !== -1) {
      followers.splice(idx, 1);
      setLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS, followers);
      return { following: false };
    }
    followers.push({ collection_id: collectionId, user_id: userId, followed_at: new Date().toISOString(), id: Date.now() });
    setLS(BROWSER_STORAGE.COLLECTION_FOLLOWERS, followers);
    return { following: true };
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
  if (!original) return null;
  const newCollection = await createCollection(userId, username, original.title + ' (Copy)', original.description, original.cover, true);
  const items = await fetchCollectionItems(collectionId);
  for (const item of items) {
    await addItemToCollection(newCollection.id, item.media_id, item.media_type, item.title, item.poster, item.score, item.status);
  }
  return newCollection;
}

/* ==========================================================================
   GOOGLE SYNC (DISABLED FOR NOW)
   ========================================================================== */

export async function syncGoogleUserToDb(email, displayName, googleAvatar) {
  return { success: false, message: 'Google sync not available in this version' };
}

// Initialize storage on import
initLocalStorage();
