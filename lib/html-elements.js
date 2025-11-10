/**
 * HTML Elements Constants
 * 
 * Shared list of HTML elements that don't require imports in React/JSX
 */

const HTML_ELEMENTS = [
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'button', 'input', 'form', 'label', 'select', 'option',
  'table', 'thead', 'tbody', 'tr', 'td', 'th', 'ul', 'ol', 'li',
  'img', 'a', 'br', 'hr', 'section', 'article', 'header', 'footer',
  'main', 'aside', 'nav', 'figure', 'figcaption', 'blockquote',
  'pre', 'code', 'strong', 'em', 'small', 'mark', 'del', 'ins',
  'fieldset', 'legend', 'textarea', 'iframe', 'canvas', 'svg', 'path'
];

const REACT_BUILTINS = [
  'Fragment', 'Suspense', 'StrictMode', 'Profiler',
  'memo', 'lazy', 'createContext', 'useContext', 'useState', 'useEffect',
  'useCallback', 'useMemo', 'useRef', 'useReducer', 'useLayoutEffect',
  'useImperativeHandle', 'useDebugValue', 'forwardRef', 'createRef'
];

module.exports = {
  HTML_ELEMENTS,
  REACT_BUILTINS
};
