const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'K!tovu@dm!n2024';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Generated hash for password:', hash);
}

generateHash();