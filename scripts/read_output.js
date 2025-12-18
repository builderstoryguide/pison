const fs = require('fs');
try {
  const content = fs.readFileSync('check_output_ac2.txt', 'utf16le'); // PowerShell default for > redirect
  console.log(content);
} catch (e) {
  // If utf16le fails (maybe it's utf8), try utf8
  try {
    const content = fs.readFileSync('check_output_ac2.txt', 'utf8');
    console.log(content);
  } catch (e2) {
    console.error('Error reading file:', e2);
  }
}
