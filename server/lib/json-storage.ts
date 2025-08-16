import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server/data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

export async function readJSON(filename: string): Promise<any> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return default based on filename
      if (filename === 'users.json') return [];
      if (filename === 'events.json') return [];
      if (filename === 'deadlines.json') return [];
      if (filename === 'settings.json') return {};
      if (filename === 'maude_counts.json') return {};
      if (filename === 'cpt_rates_previous.json') return {};
      if (filename === 'vendor_advisories.json') return [];
      if (filename === 'payer_bulletins.json') return [];
      return null;
    }
    throw error;
  }
}

export async function writeJSON(filename: string, data: any): Promise<void> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

export async function appendToEvents(event: any): Promise<void> {
  const events = await readJSON('events.json');
  events.push(event);
  // Cap at last 5,000 events as specified
  if (events.length > 5000) {
    events.splice(0, events.length - 5000);
  }
  await writeJSON('events.json', events);
}

export async function getUserByEmail(email: string): Promise<any> {
  const users = await readJSON('users.json');
  return users.find((u: any) => u.email === email);
}

export async function createUser(user: any): Promise<void> {
  const users = await readJSON('users.json');
  users.push(user);
  await writeJSON('users.json', users);
}

export async function updateUser(userId: string, updates: any): Promise<void> {
  const users = await readJSON('users.json');
  const index = users.findIndex((u: any) => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    await writeJSON('users.json', users);
  }
}