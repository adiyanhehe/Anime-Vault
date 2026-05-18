import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_cprHoA5wBt0Z@ep-lively-surf-apnkb5f1.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

// Automatically initialize database schema if not present
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        avatar TEXT,
        banner TEXT,
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
    
    // Auto-migrate tables with alter columns if already present
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS banner TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`;
    } catch (e) {
      console.log('Columns already present or migration skipped:', e.message);
    }

    // Initialize Site Settings Table
    await sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `;
    
    // Seed default settings if not exists
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

// Trigger initial setup
initDatabase();

/* ==========================================================================
   USER MANAGEMENT (SIGNUP / LOGIN)
   ========================================================================== */

export async function userSignup(username, password) {
  try {
    const trimmedUser = username.trim();
    if (!trimmedUser || !password) throw new Error('Username and password are required.');
    
    // Check if user already exists
    const existing = await sql`SELECT id FROM users WHERE username = ${trimmedUser}`;
    if (existing.length > 0) {
      return { success: false, message: 'Username is already taken' };
    }

    const isAdmin = trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase().includes('admin');

    const result = await sql`
      INSERT INTO users (username, password, is_admin) 
      VALUES (${trimmedUser}, ${password}, ${isAdmin})
      RETURNING id, username, avatar, banner, is_admin
    `;
    return { success: true, user: result[0] };
  } catch (err) {
    console.error('Database signup failed:', err);
    return { success: false, message: err.message || 'Signup failed' };
  }
}

export async function userLogin(username, password) {
  try {
    const trimmedUser = username.trim();
    const result = await sql`
      SELECT id, username, password, avatar, banner, is_admin FROM users 
      WHERE username = ${trimmedUser}
    `;
    
    if (result.length === 0 || result[0].password !== password) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    const user = { 
      id: result[0].id, 
      username: result[0].username, 
      avatar: result[0].avatar, 
      banner: result[0].banner,
      is_admin: result[0].is_admin
    };
    return { success: true, user };
  } catch (err) {
    console.error('Database login failed:', err);
    return { success: false, message: 'Login failed' };
  }
}

export async function updateUserProfile(userId, avatarUrl, bannerUrl) {
  try {
    const result = await sql`
      UPDATE users 
      SET avatar = ${avatarUrl}, banner = ${bannerUrl}
      WHERE id = ${userId}
      RETURNING id, username, avatar, banner, is_admin
    `;
    return { success: true, user: result[0] };
  } catch (err) {
    console.error('Failed to update user profile:', err);
    return { success: false, message: 'Failed to update profile' };
  }
}

/* ==========================================================================
   WATCH HISTORY
   ========================================================================== */

export async function fetchWatchHistory(userId) {
  try {
    return await sql`
      SELECT media_id, media_type, media_title, media_poster, watched_at 
      FROM history WHERE user_id = ${userId}
      ORDER BY watched_at DESC
    `;
  } catch (err) {
    console.error('Failed to fetch watch history:', err);
    return [];
  }
}

export async function addToHistory(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  try {
    await sql`
      INSERT INTO history (user_id, media_id, media_type, media_title, media_poster, watched_at)
      VALUES (${userId}, ${mediaId}, ${mediaType}, ${mediaTitle}, ${mediaPoster}, NOW())
      ON CONFLICT (user_id, media_id, media_type)
      DO UPDATE SET watched_at = NOW(), media_poster = EXCLUDED.media_poster, media_title = EXCLUDED.media_title
    `;
    return true;
  } catch (err) {
    console.error('Failed to add to history:', err);
    return false;
  }
}

export async function clearWatchHistory(userId) {
  try {
    await sql`DELETE FROM history WHERE user_id = ${userId}`;
    return true;
  } catch (err) {
    console.error('Failed to clear watch history:', err);
    return false;
  }
}

/* ==========================================================================
   CONTINUE WATCHING
   ========================================================================== */

export async function fetchContinueWatching(userId) {
  try {
    return await sql`
      SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration, updated_at
      FROM continue_watching WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;
  } catch (err) {
    console.error('Failed to fetch continue watching:', err);
    return [];
  }
}

export async function updateContinueWatching(userId, mediaId, mediaType, mediaTitle, mediaPoster, season, episode, progress, duration) {
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
  } catch (err) {
    console.error('Failed to update continue watching:', err);
    return false;
  }
}

export async function removeFromContinueWatching(userId, mediaId, mediaType) {
  try {
    await sql`
      DELETE FROM continue_watching 
      WHERE user_id = ${userId} AND media_id = ${mediaId} AND media_type = ${mediaType}
    `;
    return true;
  } catch (err) {
    console.error('Failed to remove from continue watching:', err);
    return false;
  }
}

/* ==========================================================================
   LIKED ITEMS (FAVORITES)
   ========================================================================== */

export async function fetchLikedItems(userId) {
  try {
    return await sql`
      SELECT media_id, media_type, media_title, media_poster, liked_at
      FROM liked_items WHERE user_id = ${userId}
      ORDER BY liked_at DESC
    `;
  } catch (err) {
    console.error('Failed to fetch liked items:', err);
    return [];
  }
}

export async function toggleLikeItem(userId, mediaId, mediaType, mediaTitle, mediaPoster) {
  try {
    // Check if already liked
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
  } catch (err) {
    console.error('Failed to toggle like item:', err);
    return { error: true };
  }
}

/* ==========================================================================
   COMMENTS System
   ========================================================================== */

export async function fetchMediaComments(mediaId) {
  try {
    return await sql`
      SELECT id, username, comment_text, created_at 
      FROM comments WHERE media_id = ${mediaId}
      ORDER BY created_at DESC
    `;
  } catch (err) {
    console.error('Failed to fetch media comments:', err);
    return [];
  }
}

export async function addMediaComment(userId, username, mediaId, commentText) {
  try {
    if (!commentText.trim()) throw new Error('Comment text cannot be empty.');
    
    const result = await sql`
      INSERT INTO comments (user_id, username, media_id, comment_text, created_at)
      VALUES (${userId}, ${username}, ${mediaId}, ${commentText}, NOW())
      RETURNING id, username, comment_text, created_at
    `;
    return { success: true, comment: result[0] };
  } catch (err) {
    console.error('Failed to add media comment:', err);
    return { success: false, message: 'Failed to post comment' };
  }
}

export async function deleteMediaComment(commentId, userId) {
  try {
    await sql`
      DELETE FROM comments 
      WHERE id = ${commentId} AND user_id = ${userId}
    `;
    return true;
  } catch (err) {
    console.error('Failed to delete comment:', err);
    return false;
  }
}

/* ==========================================================================
   PUBLIC PROFILES & ADMIN PORTAL SERVICES
   ========================================================================== */

export async function fetchPublicUserProfile(username) {
  try {
    const u = await sql`SELECT id, username, avatar, banner, is_admin, created_at FROM users WHERE username = ${username}`;
    if (u.length === 0) return null;
    const userId = u[0].id;
    const [likes, history, continueWatching] = await Promise.all([
      sql`SELECT media_id, media_type, media_title, media_poster FROM liked_items WHERE user_id = ${userId}`,
      sql`SELECT media_id, media_type, media_title, media_poster, watched_at FROM history WHERE user_id = ${userId} ORDER BY watched_at DESC`,
      sql`SELECT media_id, media_type, media_title, media_poster, season, episode, progress, duration FROM continue_watching WHERE user_id = ${userId} ORDER BY updated_at DESC`
    ]);
    return {
      user: u[0],
      likes,
      history,
      continueWatching
    };
  } catch (e) {
    console.error('Failed to load public profile:', e);
    return null;
  }
}

export async function fetchAdminStats() {
  try {
    const [users, comments, likes, history] = await Promise.all([
      sql`SELECT COUNT(*)::int as count FROM users`,
      sql`SELECT COUNT(*)::int as count FROM comments`,
      sql`SELECT COUNT(*)::int as count FROM liked_items`,
      sql`SELECT COUNT(*)::int as count FROM history`
    ]);
    return {
      totalUsers: users[0].count,
      totalComments: comments[0].count,
      totalLikes: likes[0].count,
      totalEpisodes: history[0].count
    };
  } catch (err) {
    console.error('Failed to load admin stats:', err);
    return { totalUsers: 0, totalComments: 0, totalLikes: 0, totalEpisodes: 0 };
  }
}

export async function fetchAllUsers() {
  try {
    return await sql`SELECT id, username, avatar, is_admin, created_at FROM users ORDER BY created_at DESC`;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function toggleUserAdminStatus(userId) {
  try {
    const current = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
    if (current.length === 0) return false;
    const next = !current[0].is_admin;
    await sql`UPDATE users SET is_admin = ${next} WHERE id = ${userId}`;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function deleteUser(userId) {
  try {
    await Promise.all([
      sql`DELETE FROM history WHERE user_id = ${userId}`,
      sql`DELETE FROM continue_watching WHERE user_id = ${userId}`,
      sql`DELETE FROM liked_items WHERE user_id = ${userId}`,
      sql`DELETE FROM comments WHERE user_id = ${userId}`,
      sql`DELETE FROM users WHERE id = ${userId}`
    ]);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function fetchAllComments() {
  try {
    return await sql`SELECT id, user_id, username, media_id, comment_text, created_at FROM comments ORDER BY created_at DESC`;
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function deleteCommentAdmin(commentId) {
  try {
    await sql`DELETE FROM comments WHERE id = ${commentId}`;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function fetchSiteSettings() {
  try {
    const res = await sql`SELECT key, value FROM site_settings`;
    const settings = {};
    res.forEach(item => { settings[item.key] = item.value; });
    return settings;
  } catch (e) {
    console.error(e);
    return { announcement: '', maintenance: 'false', trending_override: '[]' };
  }
}

export async function updateSiteSetting(key, value) {
  try {
    await sql`INSERT INTO site_settings (key, value) VALUES (${key}, ${value}) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

export async function syncGoogleUserToDb(email, displayName, googleAvatar) {
  try {
    const trimmedUser = email.trim();
    // Check if user already exists
    const existing = await sql`
      SELECT id, username, avatar, banner, is_admin, created_at
      FROM users WHERE username = ${trimmedUser}
    `;
    
    if (existing.length > 0) {
      // User exists, return user record
      return { success: true, user: existing[0] };
    }

    // User doesn't exist, create a new record!
    // If the email includes 'admin', let's make them an admin!
    const isAdmin = trimmedUser.toLowerCase().includes('admin') || trimmedUser.toLowerCase() === 'adiyanhehe@gmail.com'; 

    const result = await sql`
      INSERT INTO users (username, password, avatar, is_admin) 
      VALUES (${trimmedUser}, 'google_oauth_bypass', ${googleAvatar || ''}, ${isAdmin})
      RETURNING id, username, avatar, banner, is_admin, created_at
    `;
    return { success: true, user: result[0] };
  } catch (err) {
    console.error('Failed to sync Google user to database:', err);
    return { success: false, message: 'Sync failed' };
  }
}
