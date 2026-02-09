import {
  AlertCircle,
  AlertTriangle,
  Award,
  Badge,
  BarChart3,
  Bell,
  Bitcoin,
  Bolt,
  Book,
  Briefcase,
  Building,
  Building2,
  Calculator,
  CalendarCheck,
  Captions,
  CheckCircle,
  CheckCircle2,
  ClipboardList,
  Code,
  Codepen,
  Coffee,
  CreditCard,
  DollarSign,
  File as DocumentIcon,
  FileText as ReportIcon,
  Euro,
  Eye,
  File,
  FileQuestion,
  FileText,
  Flag,
  Ghost,
  Gift,
  Grid,
  Heart,
  HelpCircle,
  Kanban,
  Key,
  Layout,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Monitor,
  Network,
  Package,
  PieChart,
  Receipt,
  Users as PeopleIcon,
  Plug,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShieldUser,
  ShoppingCart,
  SquareMousePointer,
  Star,
  Theater,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
  Briefcase as WorkIcon,
  Zap,
} from 'lucide-react';
import { type MenuConfig } from './types';

// Microfinance Management System Menu Configuration
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  { heading: 'Operations' },
  {
    title: 'Daily Collections',
    icon: Receipt,
    path: '/collections/daily',
  },
  {
    title: 'Transactions',
    icon: CreditCard,
    children: [
      { title: 'All Transactions', path: '/transactions' },
      { title: 'Pending Validation', path: '/transactions/pending' },
      { title: 'Deposits', path: '/transactions/deposits' },
      { title: 'Withdrawals', path: '/transactions/withdrawals' },
    ],
  },
  {
    title: 'Loans',
    icon: DollarSign,
    children: [
      { title: 'All Loans', path: '/loans' },
      { title: 'Loan Requests', path: '/loans/requests' },
      { title: 'Active Loans', path: '/loans/active' },
      { title: 'Loan Repayments', path: '/loans/repayments' },
    ],
  },
  { heading: 'Management' },
  {
    title: 'Clients',
    icon: Users,
    children: [
      { title: 'All Clients', path: '/clients' },
      { title: 'Add Client', path: '/clients/new' },
      { title: 'Client Accounts', path: '/clients/accounts' },
    ],
  },
  {
    title: 'Agents',
    icon: UserCheck,
    children: [
      { title: 'All Agents', path: '/agents' },
      { title: 'Add Agent', path: '/agents/new' },
      { title: 'Agent Accounts', path: '/agents/accounts' },
    ],
  },
  {
    title: 'Collection Areas',
    icon: MapPin,
    children: [
      { title: 'All Areas', path: '/collection-areas' },
      { title: 'Add Area', path: '/collection-areas/new' },
      { title: 'Area Assignments', path: '/collection-areas/assignments' },
    ],
  },
  { heading: 'Reports & Analytics' },
  {
    title: 'Reports',
    icon: ReportIcon,
    children: [
      { title: 'Monthly Balance', path: '/reports/monthly-balance' },
      { title: 'Collection Journal', path: '/reports/collection-journal' },
      { title: 'Client Statement', path: '/reports/client-statement' },
      { title: 'Statistics by Area', path: '/reports/area-statistics' },
      { title: 'Commission Report', path: '/reports/commissions' },
      { title: 'Surplus/Shortage', path: '/reports/surplus-shortage' },
    ],
  },
  {
    title: 'Analytics',
    icon: BarChart3,
    children: [
      { title: 'Overview', path: '/analytics' },
      { title: 'Financial Summary', path: '/analytics/financial' },
      { title: 'Transaction Trends', path: '/analytics/transactions' },
      { title: 'Agent Performance', path: '/analytics/agents' },
    ],
  },
  { heading: 'System' },
  {
    title: 'Validation',
    icon: CheckCircle2,
    path: '/validation/pending',
    badge: 'Pending',
  },
  {
    title: 'Daily Operations',
    icon: CalendarCheck,
    children: [
      { title: 'Session Status', path: '/operations/session' },
      { title: 'Day Closure', path: '/operations/day-closure' },
      { title: 'Cash Reconciliation', path: '/operations/reconciliation' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'System Settings', path: '/settings/system' },
      { title: 'Commission Rates', path: '/settings/commissions' },
      { title: 'Collection Areas', path: '/settings/areas' },
      { title: 'User Management', path: '/settings/users' },
      { title: 'Permissions', path: '/settings/permissions' },
    ],
  },
  {
    title: 'My Account',
    icon: UserCircle,
    children: [
      { title: 'Profile', path: '/account/profile' },
      { title: 'Account Status', path: '/account/status' },
      { title: 'Transaction History', path: '/account/transactions' },
      { title: 'Change Password', path: '/account/password' },
    ],
  },
];

// Compact menu for mobile/smaller screens
export const MENU_SIDEBAR_COMPACT: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  {
    title: 'Daily Collections',
    icon: Receipt,
    path: '/collections/daily',
  },
  {
    title: 'Transactions',
    icon: CreditCard,
    path: '/transactions',
  },
  {
    title: 'Clients',
    icon: Users,
    path: '/clients',
  },
  {
    title: 'Reports',
    icon: ReportIcon,
    path: '/reports',
  },
  {
    title: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];

// Custom menu (can be used for specific contexts)
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    path: '/',
  },
  {
    title: 'Daily Collections',
    icon: Receipt,
    path: '/collections/daily',
  },
  {
    title: 'My Clients',
    icon: Users,
    path: '/clients',
  },
];

// Mega menu for header navigation
export const MENU_MEGA: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  {
    title: 'Operations',
    children: [
      {
        children: [
          { title: 'Daily Collections', icon: Receipt, path: '/collections/daily' },
          { title: 'All Transactions', icon: CreditCard, path: '/transactions' },
          { title: 'Pending Validation', icon: CheckCircle2, path: '/transactions/pending' },
          { title: 'Deposits', icon: TrendingUp, path: '/transactions/deposits' },
          { title: 'Withdrawals', icon: TrendingDown, path: '/transactions/withdrawals' },
        ],
      },
      {
        children: [
          { title: 'All Loans', icon: DollarSign, path: '/loans' },
          { title: 'Loan Requests', icon: FileText, path: '/loans/requests' },
          { title: 'Active Loans', icon: Wallet, path: '/loans/active' },
          { title: 'Loan Repayments', icon: Calculator, path: '/loans/repayments' },
        ],
      },
    ],
  },
  {
    title: 'Management',
    children: [
      {
        children: [
          { title: 'All Clients', icon: Users, path: '/clients' },
          { title: 'Add Client', icon: UserCircle, path: '/clients/new' },
          { title: 'Client Accounts', icon: Wallet, path: '/clients/accounts' },
        ],
      },
      {
        children: [
          { title: 'All Agents', icon: UserCheck, path: '/agents' },
          { title: 'Add Agent', icon: UserCircle, path: '/agents/new' },
          { title: 'Agent Accounts', icon: Wallet, path: '/agents/accounts' },
          { title: 'Collection Areas', icon: MapPin, path: '/collection-areas' },
        ],
      },
    ],
  },
  {
    title: 'Reports',
    children: [
      {
        children: [
          { title: 'Monthly Balance', icon: BarChart3, path: '/reports/monthly-balance' },
          { title: 'Collection Journal', icon: ReportIcon, path: '/reports/collection-journal' },
          { title: 'Client Statement', icon: FileText, path: '/reports/client-statement' },
          { title: 'Area Statistics', icon: PieChart, path: '/reports/area-statistics' },
        ],
      },
      {
        children: [
          { title: 'Commission Report', icon: Calculator, path: '/reports/commissions' },
          { title: 'Surplus/Shortage', icon: AlertTriangle, path: '/reports/surplus-shortage' },
          { title: 'Analytics', icon: BarChart3, path: '/analytics' },
        ],
      },
    ],
  },
];

// Mega menu mobile version
export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'Dashboard', path: '/' },
  {
    title: 'Operations',
    children: [
      { title: 'Daily Collections', icon: Receipt, path: '/collections/daily' },
      { title: 'All Transactions', icon: CreditCard, path: '/transactions' },
      { title: 'Pending Validation', icon: CheckCircle2, path: '/transactions/pending' },
      { title: 'Deposits', icon: TrendingUp, path: '/transactions/deposits' },
      { title: 'Withdrawals', icon: TrendingDown, path: '/transactions/withdrawals' },
      { title: 'All Loans', icon: DollarSign, path: '/loans' },
      { title: 'Loan Requests', icon: FileText, path: '/loans/requests' },
    ],
  },
  {
    title: 'Management',
    children: [
      { title: 'All Clients', icon: Users, path: '/clients' },
      { title: 'Add Client', icon: UserCircle, path: '/clients/new' },
      { title: 'All Agents', icon: UserCheck, path: '/agents' },
      { title: 'Add Agent', icon: UserCircle, path: '/agents/new' },
      { title: 'Collection Areas', icon: MapPin, path: '/collection-areas' },
    ],
  },
  {
    title: 'Reports',
    children: [
      { title: 'Monthly Balance', icon: BarChart3, path: '/reports/monthly-balance' },
      { title: 'Collection Journal', icon: ReportIcon, path: '/reports/collection-journal' },
      { title: 'Client Statement', icon: FileText, path: '/reports/client-statement' },
      { title: 'Commission Report', icon: Calculator, path: '/reports/commissions' },
    ],
  },
];

// Help menu (can be customized)
export const MENU_HELP: MenuConfig = [
  {
    title: 'Documentation',
    icon: FileQuestion,
    path: '/help/documentation',
  },
  {
    title: 'Support',
    icon: HelpCircle,
    path: '/help/support',
  },
  { separator: true },
  { title: 'Contact Us', icon: Share2, path: '/help/contact' },
];

// Root menu items for navigation
export const MENU_ROOT: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutGrid,
    rootPath: '/',
    path: '/',
    childrenIndex: 0,
  },
  {
    title: 'Collections',
    icon: Receipt,
    rootPath: '/collections/',
    path: '/collections/daily',
    childrenIndex: 1,
  },
  {
    title: 'Transactions',
    icon: CreditCard,
    rootPath: '/transactions/',
    path: '/transactions',
    childrenIndex: 2,
  },
  {
    title: 'Clients',
    icon: Users,
    rootPath: '/clients/',
    path: '/clients',
    childrenIndex: 3,
  },
  {
    title: 'Reports',
    icon: ReportIcon,
    rootPath: '/reports/',
    path: '/reports/monthly-balance',
    childrenIndex: 4,
  },
  {
    title: 'Settings',
    icon: Settings,
    rootPath: '/settings/',
    path: '/settings/system',
    childrenIndex: 5,
  },
];
