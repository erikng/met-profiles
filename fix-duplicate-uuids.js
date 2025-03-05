import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const profilesJsonDir = join(__dirname, 'docs', 'profiles-json');

async function generateUniqueUUID(existingUUIDs) {
  let newUUID;
  do {
    newUUID = crypto.randomUUID(); // Generate a new UUID
  } while (existingUUIDs.has(newUUID)); // Ensure uniqueness
  return newUUID;
}

async function fixDuplicateUUIDs() {
  let hasDuplicates = true;

  while (hasDuplicates) {
    hasDuplicates = false;
    const existingUUIDs = new Set();
    const files = await readdir(profilesJsonDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = join(profilesJsonDir, file);
      const jsonData = JSON.parse(await readFile(filePath, 'utf8'));

      if (jsonData.id) {
        if (existingUUIDs.has(jsonData.id)) {
          console.log(`Duplicate UUID found in ${file}: ${jsonData.id}`);
          jsonData.id = await generateUniqueUUID(existingUUIDs);
          console.log(`New UUID assigned: ${jsonData.id}`);
          hasDuplicates = true;
        }
        existingUUIDs.add(jsonData.id);
      }

      await writeFile(filePath, JSON.stringify(jsonData, null, 2)); // Save changes
    }
  }

  console.log('✅ All UUIDs are unique!');
}

fixDuplicateUUIDs().catch(console.error);
