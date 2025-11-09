#!/usr/bin/env node

/**
 * Script to validate that all lucide-react icons used in components are properly imported.
 * This prevents runtime errors from missing imports.
 */

const fs = require('fs');
const path = require('path');

// Common lucide-react icons used in the project
// This list can be expanded as needed
const COMMON_LUCIDE_ICONS = new Set([
  'Mail', 'User', 'Phone', 'CheckCircle', 'X', 'Plus', 'Minus', 'Edit', 'Trash2',
  'Search', 'Filter', 'Download', 'Upload', 'Settings', 'Home', 'Menu', 'ArrowLeft',
  'ArrowRight', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight',
  'Calendar', 'Clock', 'AlertCircle', 'AlertTriangle', 'Info', 'Check', 'Copy',
  'GraduationCap', 'BookOpen', 'FileText', 'Users', 'UserCheck', 'DollarSign',
  'CreditCard', 'BarChart3', 'TrendingUp', 'TrendingDown', 'Activity', 'Bell',
  'MessageSquare', 'Shield', 'Key', 'Sparkles', 'RefreshCw', 'Eye', 'EyeOff',
  'MoreHorizontal', 'ExternalLink', 'Package', 'Building', 'MapPin', 'Briefcase',
  'Globe', 'Image', 'Palette', 'RotateCcw', 'Save', 'Loader2', 'XCircle',
  'CalendarDays', 'CalendarCheck', 'Award', 'ClipboardList', 'School', 'UserPlus',
  'LogOut', 'Download', 'Upload', 'Paperclip', 'Send', 'Lock', 'Unlock',
  'Bug', 'Coffee', 'Gift', 'PartyPopper', 'Crown', 'Trophy', 'Medal', 'Rocket',
  'Plane', 'Car', 'Bike', 'Train', 'Ship', 'Compass', 'Map', 'Navigation',
  'Camera', 'Video', 'Mic', 'Headphones', 'Radio', 'TV', 'Monitor', 'Laptop',
  'Smartphone', 'Tablet', 'Watch', 'Gamepad2', 'Controller', 'Dice1', 'Dice2',
  'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Puzzle', 'Blocks', 'Cube', 'Box',
  'ShoppingBag', 'ShoppingCart', 'Store', 'Receipt', 'Banknote', 'Coins', 'Wallet',
  'ChartLine', 'ChartBar', 'ChartPie', 'Pulse', 'Heart', 'Heartbeat', 'Thermometer',
  'Droplet', 'Wind', 'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'CloudLightning',
  'Sunrise', 'Sunset', 'MoonStar', 'Stars', 'Comet', 'Planet', 'Flag', 'Building2',
  'Warehouse', 'Factory', 'Church', 'Hospital', 'Library', 'Theater', 'Museum',
  'Castle', 'Tent', 'TreePine', 'TreeDeciduous', 'Flower', 'Flower2', 'Leaf',
  'Cactus', 'Mushroom', 'Apple', 'Cherry', 'Grape', 'Banana', 'Orange', 'Lemon',
  'Strawberry', 'Watermelon', 'Pineapple', 'Mango', 'Peach', 'Pear', 'Kiwi',
  'Tomato', 'Carrot', 'Broccoli', 'Corn', 'Potato', 'Onion', 'Garlic', 'Pepper',
  'Chili', 'Cucumber', 'Lettuce', 'Spinach', 'Cabbage', 'Radish', 'Beet', 'Celery',
]);

function findComponentFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    // Skip node_modules and other common directories
    if (file === 'node_modules' || file === '.next' || file === '.git') {
      return;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findComponentFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractImports(content) {
  const importRegex = /import\s+.*?\s+from\s+['"]lucide-react['"]/g;
  const imports = new Set();
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importStatement = match[0];
    // Extract icon names from import statement
    const iconMatch = importStatement.match(/\{([^}]+)\}/);
    if (iconMatch) {
      const iconNames = iconMatch[1]
        .split(',')
        .map(name => name.trim())
        .filter(name => name);
      iconNames.forEach(name => imports.add(name));
    }
  }
  
  return imports;
}

function extractIconUsage(content) {
  const iconUsage = new Set();
  
  // Match JSX patterns: <IconName, <IconName className, <IconName/>, etc.
  // Also match in icon: IconName patterns
  const jsxPattern = /<([A-Z][a-zA-Z0-9]*)\s/gi;
  const iconPropPattern = /icon:\s*([A-Z][a-zA-Z0-9]*)/gi;
  
  let match;
  while ((match = jsxPattern.exec(content)) !== null) {
    const iconName = match[1];
    // Only check if it's a known lucide icon
    if (COMMON_LUCIDE_ICONS.has(iconName)) {
      iconUsage.add(iconName);
    }
  }
  
  while ((match = iconPropPattern.exec(content)) !== null) {
    const iconName = match[1];
    if (COMMON_LUCIDE_ICONS.has(iconName)) {
      iconUsage.add(iconName);
    }
  }
  
  return iconUsage;
}

function validateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const importedIcons = extractImports(content);
    const usedIcons = extractIconUsage(content);
    
    const missingImports = Array.from(usedIcons).filter(icon => 
      !importedIcons.has(icon)
    );
    
    return {
      file: filePath,
      missingImports,
      hasErrors: missingImports.length > 0
    };
  } catch (error) {
    return {
      file: filePath,
      missingImports: [],
      hasErrors: false,
      error: error.message
    };
  }
}

function main() {
  const componentsDir = path.join(process.cwd(), 'components');
  const appDir = path.join(process.cwd(), 'app');
  
  const files = [];
  if (fs.existsSync(componentsDir)) {
    files.push(...findComponentFiles(componentsDir));
  }
  if (fs.existsSync(appDir)) {
    files.push(...findComponentFiles(appDir));
  }
  
  if (files.length === 0) {
    console.log('No component files found to validate.');
    process.exit(0);
  }
  
  const results = files.map(validateFile);
  const errors = results.filter(r => r.hasErrors);
  
  if (errors.length > 0) {
    console.error('\n❌ Missing icon imports found:\n');
    errors.forEach(result => {
      const relativePath = path.relative(process.cwd(), result.file);
      console.error(`  ${relativePath}`);
      result.missingImports.forEach(icon => {
        console.error(`    - Missing import: ${icon}`);
      });
      console.error('');
    });
    console.error(`Found ${errors.length} file(s) with missing imports\n`);
    process.exit(1);
  } else {
    console.log('✅ All icon imports are valid!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateFile, extractImports, extractIconUsage };
