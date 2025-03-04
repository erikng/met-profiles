import { readdir, readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const profilesJsonDir = join(__dirname, 'docs', 'profiles-json');
const profilesDir = join(__dirname, 'docs', 'profiles');
const outputIndexPath = join(__dirname, 'docs', 'index.md');

async function generateProfilePages() {
  let indexContent = '# Profiles\n\n';

  try {
    await rm(profilesDir, { recursive: true, force: true }); // Delete old profiles
    await mkdir(profilesDir, { recursive: true }); // Recreate directory

    const files = await readdir(profilesJsonDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = join(profilesJsonDir, file);
        const jsonData = await readFile(filePath, 'utf8');

        // Replace spaces with hyphens for filenames
        const fileName = file.replace('.json', '').replace(/\s+/g, '-');
        const profilePagePath = join(profilesDir, `${fileName}.md`);

        // Generate Markdown file for the profile
        const profileContent = `# ${fileName}\n\n\`\`\`json\n${jsonData}\n\`\`\`\n`;
        await writeFile(profilePagePath, profileContent);

        // Add link to index.md (encode URI)
        indexContent += `- [${fileName}](profiles/${encodeURIComponent(fileName)}.md)\n`;
      }
    }

    // Write updated index.md
    await writeFile(outputIndexPath, indexContent);
    console.log('✅ Profiles regenerated and index.md updated!');
  } catch (error) {
    console.error('❌ Error generating pages:', error);
  }
}

generateProfilePages();
