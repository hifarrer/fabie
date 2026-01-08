import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, '..', 'data', 'db.json');

const adapter = new JSONFile(file);
const defaultData = { 
  dpps: [], 
  naftaInputs: [], 
  messages: [], 
  threads: [],
  users: [] 
};

const db = new Low(adapter, defaultData);

// Initialize database
await db.read();

// Ensure default data structure exists
db.data ||= defaultData;
db.data.dpps ||= [];
db.data.naftaInputs ||= [];
db.data.messages ||= [];
db.data.threads ||= [];
db.data.users ||= [];

await db.write();

export default db;


