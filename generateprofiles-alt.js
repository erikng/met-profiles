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
  const written = [];
  const skipped = [];

  try {
    await rm(profilesDir, { recursive: true, force: true });
    await mkdir(profilesDir, { recursive: true });

    const files = await readdir(profilesJsonDir);
    console.log(`Found ${files.length} files in ${profilesJsonDir}`);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = join(profilesJsonDir, file);
        const jsonData = await readFile(filePath, 'utf8');
        JSON.parse(jsonData); // early validation

        const rawName = file.replace('.json', '');
        const fileName = rawName.replace(/[^\w\-]+/g, '-'); // Safer for FS
        const profileTitle = rawName;

        const profileContent = `# ${profileTitle}

<script setup>
import { ref } from 'vue';

const baseUrl = ref('');
const profileData = JSON.parse(\`${jsonData.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);

const sendProfile = async () => {
  if (!baseUrl.value.trim()) {
    alert('Please enter a base URL.');
    return;
  }

  const apiUrl = \`http://\${baseUrl.value}/api/v1/profile/save\`;

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
        written.push(file);

        indexContent += `- [${profileTitle}](profiles/${fileName}.md)\n`;
        console.log(`✅ Wrote: ${fileName}.md`);

      } catch (err) {
        console.error(`❌ Skipping ${file}: ${err.message}`);
        skipped.push(file);
      }
    }

    await writeFile(outputIndexPath, indexContent);
    console.log('\n✅ index.md updated!');

    // Summary
    console.log(`\n✅ Wrote ${written.length} profiles.`);
    if (skipped.length) {
      console.warn(`⚠️ Skipped ${skipped.length} profiles:`);
      skipped.forEach(name => console.warn(` - ${name}`));
    }

  } catch (error) {
    console.error('❌ Error generating pages:', error);
  }
}

generateProfilePages();
