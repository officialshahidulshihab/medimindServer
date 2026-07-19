const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const env = fs.readFileSync(envPath, 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY=(.*)/);
if (!keyMatch) {
  console.error("No API key found");
  process.exit(1);
}
const key = keyMatch[1].trim();

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log(m.name, " - ", m.supportedGenerationMethods.join(', ')));
    } else {
      console.log("Error fetching models:", data);
    }
  })
  .catch(err => console.error(err));
