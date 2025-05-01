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
  const createdFiles = [];
  const skippedFiles = [];

  try {
    await rm(profilesDir, { recursive: true, force: true });
    await mkdir(profilesDir, { recursive: true });

    const files = await readdir(profilesJsonDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(profilesJsonDir, file);
      let rawJson, parsed, prettyJson, safeJson;

      try {
        rawJson = await readFile(filePath, 'utf8');
        parsed = JSON.parse(rawJson);
        prettyJson = JSON.stringify(parsed, null, 2);
        safeJson = prettyJson
          .replace(/\\/g, '\\\\')
          .replace(/`/g, '\\`')
          .replace(/\$/g, '\\$')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      } catch (error) {
        console.warn(`⚠️ Skipping "${file}" due to JSON parse error: ${error.message}`);
        skippedFiles.push(file);
        continue;
      }

      const originalName = file.replace('.json', '');
      const fileName = originalName
        .replace(/[(),[\]]/g, '')        
        .replace(/\s+/g, '-')            
        .replace(/[^a-zA-Z0-9-_]/g, '')  
        .toLowerCase();                  

      const profileTitle = originalName; // original for display

      const profileContent = `# ${profileTitle}

<script setup>
import { ref } from 'vue';

const baseUrl = ref('');
const profileData = JSON.parse(\`${safeJson}\`);

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
${prettyJson}
\`\`\`
`;

      const profilePagePath = join(profilesDir, `${fileName}.md`);
      await writeFile(profilePagePath, profileContent);
      createdFiles.push(fileName);

      indexContent += `- [${profileTitle}](profiles/${fileName}.md)\n`;
    }

    await writeFile(outputIndexPath, indexContent);

    console.log('✅ Profiles regenerated and index.md updated!');
    if (createdFiles.length) {
      console.log(`📝 Created ${createdFiles.length} profile page(s):`);
      createdFiles.forEach(f => console.log(`  - ${f}`));
    }
    if (skippedFiles.length) {
      console.warn(`⚠️ Skipped ${skippedFiles.length} file(s) due to parse errors:`);
      skippedFiles.forEach(f => console.warn(`  - ${f}`));
    }
  } catch (error) {
    console.error('❌ Error generating profile pages:', error);
  }
}

generateProfilePages();
