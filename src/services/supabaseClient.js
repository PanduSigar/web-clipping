// Supabase REST client with LocalStorage simulation fallback
// To avoid npm install overhead, this calls Supabase's standard REST API directly.

// Load settings from localStorage if user sets custom keys
const getSupabaseConfig = () => {
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: url.trim(),
    key: key.trim(),
    isConfigured: url.trim().startsWith('https://') && key.trim().length > 10
  };
};

// SIMULATION DATABASE (LocalStorage helper)
const getLocalUsers = () => JSON.parse(localStorage.getItem('sim_users') || '{}');
const saveLocalUsers = (users) => localStorage.setItem('sim_users', JSON.stringify(users));

const getLocalProfiles = () => JSON.parse(localStorage.getItem('sim_profiles') || '{}');
const saveLocalProfiles = (profiles) => localStorage.setItem('sim_profiles', JSON.stringify(profiles));

// Initialize a simulated profile if missing
const getOrCreateLocalProfile = (userId, email) => {
  const profiles = getLocalProfiles();
  if (!profiles[userId]) {
    profiles[userId] = {
      id: userId,
      email: email,
      token_limit: 15000, // free starter limit: 15k tokens
      token_used: 0,
      created_at: new Date().toISOString()
    };
    saveLocalProfiles(profiles);
  }
  return profiles[userId];
};

// -------------------------------------------------------------
// PUBLIC METHODS (Auto-detect simulated vs production Supabase)
// -------------------------------------------------------------

/**
 * Sign up a new user with email and password
 */
export async function signUpUser(email, password) {
  if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
    const res = await fetch('/api/db/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mendaftar.');
    return data;
  }

  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    // SIMULATION MODE
    await new Promise(r => setTimeout(r, 800)); // mock network delay
    const users = getLocalUsers();
    
    if (users[email]) {
      throw new Error('Email sudah terdaftar.');
    }

    const userId = `sim-user-${Date.now()}`;
    users[email] = { userId, password };
    saveLocalUsers(users);

    const profile = getOrCreateLocalProfile(userId, email);
    const userRole = email.toLowerCase() === 'admin@dataflow.com' ? 'admin' : 'user';
    return { user: { id: userId, email, role: userRole }, profile, isSimulation: true };
  }

  // PRODUCTION MODE (REST API)
  const res = await fetch(`${config.url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.key
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || data.error_description || 'Gagal mendaftar.');

  // Create initial profile in profiles table
  const profile = await createProductionProfile(data.id || data.user?.id, email, config);
  return { user: data.user || data, profile, isSimulation: false };
}

/**
 * Sign in an existing user
 */
export async function signInUser(email, password) {
  if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
    const res = await fetch('/api/db/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email atau kata sandi salah.');
    return data;
  }

  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    // SIMULATION MODE
    await new Promise(r => setTimeout(r, 800));
    const users = getLocalUsers();
    const user = users[email];

    if (!user || user.password !== password) {
      throw new Error('Email atau kata sandi salah.');
    }

    const profile = getOrCreateLocalProfile(user.userId, email);
    const userRole = email.toLowerCase() === 'admin@dataflow.com' ? 'admin' : 'user';
    return { user: { id: user.userId, email, role: userRole }, profile, isSimulation: true };
  }

  // PRODUCTION MODE (REST API)
  const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.key
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Email atau kata sandi salah.');

  const userId = data.user?.id || data.id;
  const profile = await getOrCreateProductionProfile(userId, email, config);

  return { 
    user: data.user, 
    token: data.access_token, 
    profile, 
    isSimulation: false 
  };
}

/**
 * Fetch profile details (token quotas)
 */
export async function getUserProfile(userId, email) {
  if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
    const res = await fetch(`/api/db/profile?userId=${userId}&email=${email}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mengambil profil.');
    return data;
  }

  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return getOrCreateLocalProfile(userId, email);
  }

  try {
    return await getOrCreateProductionProfile(userId, email, config);
  } catch (err) {
    console.error('Error fetching production profile, falling back to empty:', err);
    return { id: userId, email, token_limit: 15000, token_used: 0 };
  }
}

/**
 * Add tokens to a user (after payment success)
 */
export async function updateUserQuota(userId, tokensToAdd) {
  console.log(`[Database Client] Menambah ${tokensToAdd} token untuk user ${userId}`);

  if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
    const res = await fetch('/api/db/update-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tokensToAdd })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menambah kuota.');
    return data;
  }

  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    // SIMULATION
    const profiles = getLocalProfiles();
    if (profiles[userId]) {
      profiles[userId].token_limit = (profiles[userId].token_limit || 0) + Number(tokensToAdd);
      saveLocalProfiles(profiles);
      return profiles[userId];
    }
    return null;
  }

  // PRODUCTION (REST API PATCH)
  const current = await getOrCreateProductionProfile(userId, '', config);
  const newLimit = (current.token_limit || 0) + Number(tokensToAdd);

  const res = await fetch(`${config.url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ token_limit: newLimit })
  });

  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Deduct tokens after successful Gemini API call
 */
export async function deductUserTokens(userId, tokensUsed) {
  if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
    try {
      const res = await fetch('/api/db/deduct-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tokensUsed })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mendebet token.');
      return data;
    } catch (err) {
      console.error('Failed to deduct tokens in local MySQL DB:', err);
    }
    return null;
  }

  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    // SIMULATION
    const profiles = getLocalProfiles();
    if (profiles[userId]) {
      profiles[userId].token_used = (profiles[userId].token_used || 0) + Number(tokensUsed);
      saveLocalProfiles(profiles);
      return profiles[userId];
    }
    return null;
  }

  // PRODUCTION (REST API PATCH)
  try {
    const current = await getOrCreateProductionProfile(userId, '', config);
    const newUsed = (current.token_used || 0) + Number(tokensUsed);

    const res = await fetch(`${config.url}/rest/v1/profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ token_used: newUsed })
    });
    
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error('Failed to deduct tokens in DB:', err);
  }
}

// -------------------------------------------------------------
// PRIVATE HELPER METHODS FOR SUPABASE PRODUCTION REST
// -------------------------------------------------------------

async function createProductionProfile(userId, email, config) {
  const res = await fetch(`${config.url}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: userId,
      email: email,
      token_limit: 15000, // free starter limit: 15k
      token_used: 0
    })
  });
  
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function getOrCreateProductionProfile(userId, email, config) {
  // Query existing profile
  const res = await fetch(`${config.url}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'GET',
    headers: {
      'apikey': config.key,
      'Authorization': `Bearer ${config.key}`
    }
  });

  const data = await res.json();
  
  if (Array.isArray(data) && data.length > 0) {
    return data[0];
  }

  // Create if missing
  return await createProductionProfile(userId, email || 'user@example.com', config);
}
