const fs = require('fs');

try {
    console.log('--- Reading hec_others_output.txt as UTF-16LE ---');
    const content = fs.readFileSync('hec_others_output.txt', 'utf16le');
    console.log(content);
} catch (e) {
    console.error('Error:', e);
}
