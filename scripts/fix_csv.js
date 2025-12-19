const fs = require('fs');

const filePath = './scripts/marks_data.csv';
let content = fs.readFileSync(filePath, 'utf-8');

// Replace "Food and Nutrition" with Quoted Correct Name
// Note: The previous file had `,Food and Nutrition,`
// We replace it with `,"Food, Nutrition and Health (FNH)",`
content = content.replace(/,Food and Nutrition,/g, ',"Food, Nutrition and Health (FNH)",');

fs.writeFileSync(filePath, content);
console.log('CSV fixed.');
