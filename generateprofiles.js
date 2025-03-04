import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const profilesDir = join(__dirname, 'docs', 'profiles');
const outputFilePath = join(__dirname, 'docs', 'index.md');

async function generateMarkdown() {
  let content = '# Profiles\n\n';

  try {
    const files = await readdir(profilesDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(profilesDir, file);
        const jsonData = await readFile(filePath, 'utf8');

        content += `## ${file}\n\n\`\`\`json\n${jsonData}\n\`\`\`\n\n`;
      }
    }

    await writeFile(outputFilePath, content);
    console.log('✅ Generated index.md with profiles!');
  } catch (error) {
    console.error('❌ Error generating markdown:', error);
  }
}

generateMarkdown();
