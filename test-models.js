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

async function testModel(model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
  });
  
  const text = await response.text();
  console.log(`MODEL ${model}: HTTP ${response.status}`);
  if (response.status !== 200) console.log(text.substring(0, 500));
  console.log('---');
}

async function run() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-flash-latest');
  await testModel('gemini-2.5-flash-lite');
}
run();
