/**
 * Import Validator Utility
 * 
 * This utility helps validate imports and catch potential missing imports
 * that could cause runtime errors like "BookOpen is not defined"
 */

import { readFileSync, existsSync, readdir } from 'fs';
import { join, dirname } from 'path';
import { promisify } from 'util';
import { HTML_ELEMENTS, REACT_BUILTINS } from './html-elements';

const readdirAsync = promisify(readdir);

interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ComponentUsage {
  component: string;
  line: number;
  column: number;
  context: string;
}

/**
 * Common icon libraries and their typical exports
 */
const ICON_LIBRARIES = {
  'lucide-react': [
    'User', 'Mail', 'MapPin', 'GraduationCap', 'Briefcase', 'X', 'Plus', 'AlertCircle', 'BookOpen',
    'Edit', 'Trash2', 'Users', 'UserCheck', 'DollarSign', 'Search', 'Filter', 'MoreHorizontal',
    'UserX', 'RotateCcw', 'Eye', 'Download', 'Users2', 'CheckSquare', 'Square',
    'Shield', 'AlertTriangle', 'SortAsc', 'SortDesc', 'Calendar', 'Clock', 'Settings',
    'Home', 'Menu', 'ChevronDown', 'ChevronUp', 'ChevronLeft', 'ChevronRight', 'Check',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Minus', 'Maximize', 'Minimize',
    'Close', 'CheckCircle', 'XCircle', 'Info', 'HelpCircle', 'ExternalLink'
  ],
  'react-icons/fa': ['FaUser', 'FaMail', 'FaMap', 'FaGraduationCap', 'FaBriefcase'],
  'react-icons/md': ['MdPerson', 'MdEmail', 'MdLocationOn', 'MdSchool', 'MdWork'],
  'react-icons/bs': ['BsPerson', 'BsEnvelope', 'BsGeoAlt', 'BsBook', 'BsBriefcase']
};

/**
 * Common UI component libraries
 */
const UI_COMPONENT_LIBRARIES = {
  '@/components/ui': [
    'Button', 'Card', 'CardContent', 'CardDescription', 'CardHeader', 'CardTitle',
    'Input', 'Label', 'Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue',
    'Textarea', 'Badge', 'Progress', 'Alert', 'AlertDescription', 'Dialog', 'DialogContent',
    'DialogDescription', 'DialogFooter', 'DialogHeader', 'DialogTitle', 'DialogTrigger',
    'DropdownMenu', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuLabel',
    'DropdownMenuSeparator', 'DropdownMenuTrigger', 'Table', 'TableBody', 'TableCell',
    'TableHead', 'TableHeader', 'TableRow', 'Tabs', 'TabsContent', 'TabsList', 'TabsTrigger',
    'Pagination', 'Checkbox', 'Avatar', 'AvatarFallback', 'AvatarImage', 'Skeleton'
  ]
};


/**
 * Extract imports from file content
 */
function extractImports(content: string): Set<string> {
  const imports = new Set<string>();
  
  // Extract import statements
  const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Extract named imports
    const namedImportMatch = match[0].match(/import\s*{([^}]+)}/);
    if (namedImportMatch) {
      const namedImports = namedImportMatch[1]
        .split(',')
        .map(imp => imp.trim().split(' as ')[0].trim())
        .filter(imp => imp);
      
      namedImports.forEach(imp => imports.add(imp));
    }
    
    // Extract default imports (including combined default+named imports)
    const defaultImportMatch = match[0].match(/import\s+(\w+)(?:\s*,\s*\{[^}]*\})?\s+from/);
    if (defaultImportMatch) {
      imports.add(defaultImportMatch[1]);
    }
  }
  
  return imports;
}

/**
 * Find used components in file content
 */
function findUsedComponents(content: string): ComponentUsage[] {
  const usedComponents: ComponentUsage[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, lineIndex) => {
    // Find JSX components (capitalized words)
    const jsxRegex = /<([A-Z][a-zA-Z0-9]*)/g;
    let match;
    
    while ((match = jsxRegex.exec(line)) !== null) {
      usedComponents.push({
        component: match[1],
        line: lineIndex + 1,
        column: match.index + 1,
        context: line.trim()
      });
    }
  });
  
  return usedComponents;
}

/**
 * Validate imports in a file
 */
export function validateImports(filePath: string): ImportValidationResult {
  const result: ImportValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };
  
  try {
    if (!existsSync(filePath)) {
      result.isValid = false;
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }
    
    const content = readFileSync(filePath, 'utf8');
    const imports = extractImports(content);
    const usedComponents = findUsedComponents(content);
    
    // Check for missing imports
    for (const usage of usedComponents) {
      const { component } = usage;
      
      // Skip HTML elements and React built-ins
      if (HTML_ELEMENTS.includes(component as any) || REACT_BUILTINS.includes(component as any)) {
        continue;
      }
      
      if (!imports.has(component)) {
        result.isValid = false;
        result.errors.push(
          `Missing import for '${component}' at line ${usage.line}, column ${usage.column}`
        );
        
        // Provide suggestions based on common patterns
        const suggestions = getImportSuggestions(component);
        if (suggestions.length > 0) {
          result.suggestions.push(
            `Consider importing '${component}' from: ${suggestions.join(', ')}`
          );
        }
      }
    }
    
    // Check for unused imports
    const usedComponentNames = new Set(usedComponents.map(uc => uc.component));
    for (const imported of imports) {
      if (!usedComponentNames.has(imported) && 
          !HTML_ELEMENTS.includes(imported as any) &&
          !REACT_BUILTINS.includes(imported as any)) {
        result.warnings.push(`Unused import: '${imported}'`);
      }
    }
    
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return result;
}

/**
 * Get import suggestions for a component
 */
function getImportSuggestions(component: string): string[] {
  const suggestions: string[] = [];
  
  // Check icon libraries
  for (const [library, icons] of Object.entries(ICON_LIBRARIES)) {
    if (icons.includes(component)) {
      suggestions.push(`'${library}'`);
    }
  }
  
  // Check UI component libraries
  for (const [library, components] of Object.entries(UI_COMPONENT_LIBRARIES)) {
    if (components.includes(component)) {
      suggestions.push(`'${library}'`);
    }
  }
  
  // Common patterns
  if (component.endsWith('Icon')) {
    suggestions.push('lucide-react');
  }
  
  if (component.startsWith('Fa')) {
    suggestions.push('react-icons/fa');
  }
  
  if (component.startsWith('Md')) {
    suggestions.push('react-icons/md');
  }
  
  if (component.startsWith('Bs')) {
    suggestions.push('react-icons/bs');
  }
  
  return suggestions;
}

/**
 * Validate all component files in a directory
 */
export async function validateAllComponents(dirPath: string): Promise<Map<string, ImportValidationResult>> {
  const results = new Map<string, ImportValidationResult>();
  
  try {
    await traverseDirectory(dirPath, results);
  } catch (error) {
    console.error(`Error traversing directory ${dirPath}:`, error);
  }
  
  return results;
}

/**
 * Recursively traverse directory and validate component files
 */
async function traverseDirectory(dirPath: string, results: Map<string, ImportValidationResult>): Promise<void> {
  try {
    const entries = await readdirAsync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await traverseDirectory(fullPath, results);
        }
      } else if (entry.isFile()) {
        // Check if file has component extensions
        const componentExtensions = ['.ts', '.tsx', '.js', '.jsx'];
        if (componentExtensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const result = validateImports(fullPath);
            const relativePath = fullPath.replace(process.cwd(), '').replace(/\\/g, '/');
            results.set(relativePath, result);
          } catch (error) {
            // Log per-file errors and continue
            console.error(`Error validating file ${fullPath}:`, error);
            const relativePath = fullPath.replace(process.cwd(), '').replace(/\\/g, '/');
            results.set(relativePath, {
              isValid: false,
              errors: [`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`],
              warnings: [],
              suggestions: []
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}

/**
 * Generate import statement for a component
 */
export function generateImportStatement(component: string, suggestions: string[]): string {
  if (suggestions.length === 0) {
    return `// TODO: Import '${component}' from appropriate library`;
  }
  
  const library = suggestions[0].replace(/'/g, '');
  return `import { ${component} } from '${library}';`;
}
