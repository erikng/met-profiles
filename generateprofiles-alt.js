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
        const profileTitle = fileName.replace(/---+/g, ' - ').replace(/(?<!\s)(-+)(?!\s)/g, ' ').trim();

        // Generate Markdown file with button & input field
        const profileContent = `# ${profileTitle}

<script setup>
import { ref, onMounted } from 'vue';

const baseUrl = ref('');
const profileData = JSON.parse(\`${jsonData.replace(/'/g, "&apos;")}\`);

const sendProfile = async () => {
  if (!baseUrl.value.trim()) {
    alert('Please enter a base URL.');
    return;
  }

  const apiUrl = \`https://\${baseUrl.value}/api/v1/profile/save\`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(\`Server responded with status: \${response.status}\`);
    }

    const result = await response.json();
    alert('Profile sent successfully!');
    console.log('API Response:', result);

  } catch (error) {
    alert('Failed to send profile: ' + error.message);
    console.error('Error sending profile:', error);
  }
};
</script>

<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
  <input type="text" v-model="baseUrl" placeholder="Enter base URL (e.g., 192.168.1.100)"
         style="padding: 8px; border: 1px solid #ccc; border-radius: 5px; flex: 1; max-width: 300px;" />
  <button @click="sendProfile"
          style="padding: 8px 12px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
    Install Profile to Meticulous Device
  </button>
</div>

\`\`\`json
${jsonData}
\`\`\`
`;


        const profilePagePath = join(profilesDir, `${fileName}.md`);
        await writeFile(profilePagePath, profileContent);

        // Add link to index.md (encode URI)
        indexContent += `- [${profileTitle}](profiles/${fileName}.md)\n`;
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
