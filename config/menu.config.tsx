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
// Titles and headings use translation keys (menu.xxx) - components translate them via t()
export const MENU_SIDEBAR: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, path: '/' },
  { heading: 'menu.operations' },
  { title: 'menu.dailyCollections', icon: Receipt, path: '/collections/daily' },
  {
    title: 'menu.transactions',
    icon: CreditCard,
    children: [
      { title: 'menu.allTransactions', path: '/transactions' },
      { title: 'menu.pendingValidation', path: '/transactions/pending' },
      { title: 'menu.deposits', path: '/transactions/deposits' },
      { title: 'menu.withdrawals', path: '/transactions/withdrawals' },
    ],
  },
  {
    title: 'menu.loans',
    icon: DollarSign,
    children: [
      { title: 'menu.allLoans', path: '/loans' },
      { title: 'menu.loanRequests', path: '/loans/requests' },
      { title: 'menu.activeLoans', path: '/loans/active' },
      { title: 'menu.loanRepayments', path: '/loans/repayments' },
    ],
  },
  { heading: 'menu.management' },
  {
    title: 'menu.clients',
    icon: Users,
    children: [
      { title: 'menu.allClients', path: '/clients' },
      { title: 'menu.addClient', path: '/clients/new' },
      { title: 'menu.clientAccounts', path: '/clients/accounts' },
    ],
  },
  {
    title: 'menu.agents',
    icon: UserCheck,
    children: [
      { title: 'menu.allAgents', path: '/agents' },
      { title: 'menu.addAgent', path: '/agents/new' },
      { title: 'menu.agentAccounts', path: '/agents/accounts' },
    ],
  },
  {
    title: 'menu.collectionAreas',
    icon: MapPin,
    children: [
      { title: 'menu.allAreas', path: '/collection-areas' },
      { title: 'menu.addArea', path: '/collection-areas/new' },
      { title: 'menu.areaAssignments', path: '/collection-areas/assignments' },
    ],
  },
  { heading: 'menu.reportsAnalytics' },
  {
    title: 'menu.reports',
    icon: ReportIcon,
    children: [
      { title: 'menu.monthlyBalance', path: '/reports/monthly-balance' },
      { title: 'menu.collectionJournal', path: '/reports/collection-journal' },
      { title: 'menu.clientStatement', path: '/reports/client-statement' },
      { title: 'menu.statisticsByArea', path: '/reports/area-statistics' },
      { title: 'menu.commissionReport', path: '/reports/commissions' },
      { title: 'menu.surplusShortage', path: '/reports/surplus-shortage' },
    ],
  },
  {
    title: 'menu.analytics',
    icon: BarChart3,
    children: [
      { title: 'menu.overview', path: '/analytics' },
      { title: 'menu.financialSummary', path: '/analytics/financial' },
      { title: 'menu.transactionTrends', path: '/analytics/transactions' },
      { title: 'menu.agentPerformance', path: '/analytics/agents' },
    ],
  },
  { heading: 'menu.system' },
  {
    title: 'menu.validation',
    icon: CheckCircle2,
    path: '/validation/pending',
    badge: 'menu.pending',
  },
  {
    title: 'menu.dailyOperations',
    icon: CalendarCheck,
    children: [
      { title: 'menu.sessionStatus', path: '/operations/session' },
      { title: 'menu.dayClosure', path: '/operations/day-closure' },
      { title: 'menu.cashReconciliation', path: '/operations/reconciliation' },
    ],
  },
  {
    title: 'menu.settings',
    icon: Settings,
    children: [
      { title: 'menu.systemSettings', path: '/settings/system' },
      { title: 'menu.commissionRates', path: '/settings/commissions' },
      { title: 'menu.collectionAreas', path: '/settings/areas' },
      { title: 'menu.userManagement', path: '/user-management/users' },
      { title: 'menu.roles', path: '/user-management/roles' },
      { title: 'menu.permissions', path: '/user-management/permissions' },
    ],
  },
  {
    title: 'menu.myAccount',
    icon: UserCircle,
    children: [
      { title: 'menu.myProfile', path: '/account/profile' },
      { title: 'menu.accountStatus', path: '/account/status' },
      { title: 'menu.transactionHistory', path: '/account/transactions' },
      { title: 'menu.changePassword', path: '/account/password' },
    ],
  },
];

// Compact menu for mobile/smaller screens
export const MENU_SIDEBAR_COMPACT: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, path: '/' },
  { title: 'menu.dailyCollections', icon: Receipt, path: '/collections/daily' },
  { title: 'menu.transactions', icon: CreditCard, path: '/transactions' },
  { title: 'menu.clients', icon: Users, path: '/clients' },
  { title: 'menu.reports', icon: ReportIcon, path: '/reports' },
  { title: 'menu.settings', icon: Settings, path: '/settings' },
];

// Custom menu (can be used for specific contexts)
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, path: '/' },
  { title: 'menu.dailyCollections', icon: Receipt, path: '/collections/daily' },
  { title: 'menu.myClients', icon: Users, path: '/clients' },
];

// Mega menu for header navigation
export const MENU_MEGA: MenuConfig = [
  { title: 'menu.dashboard', path: '/' },
  {
    title: 'menu.operations',
    children: [
      {
        children: [
          { title: 'menu.dailyCollections', icon: Receipt, path: '/collections/daily' },
          { title: 'menu.allTransactions', icon: CreditCard, path: '/transactions' },
          { title: 'menu.pendingValidation', icon: CheckCircle2, path: '/transactions/pending' },
          { title: 'menu.deposits', icon: TrendingUp, path: '/transactions/deposits' },
          { title: 'menu.withdrawals', icon: TrendingDown, path: '/transactions/withdrawals' },
        ],
      },
      {
        children: [
          { title: 'menu.allLoans', icon: DollarSign, path: '/loans' },
          { title: 'menu.loanRequests', icon: FileText, path: '/loans/requests' },
          { title: 'menu.activeLoans', icon: Wallet, path: '/loans/active' },
          { title: 'menu.loanRepayments', icon: Calculator, path: '/loans/repayments' },
        ],
      },
    ],
  },
  {
    title: 'menu.management',
    children: [
      {
        children: [
          { title: 'menu.allClients', icon: Users, path: '/clients' },
          { title: 'menu.addClient', icon: UserCircle, path: '/clients/new' },
          { title: 'menu.clientAccounts', icon: Wallet, path: '/clients/accounts' },
        ],
      },
      {
        children: [
          { title: 'menu.allAgents', icon: UserCheck, path: '/agents' },
          { title: 'menu.addAgent', icon: UserCircle, path: '/agents/new' },
          { title: 'menu.agentAccounts', icon: Wallet, path: '/agents/accounts' },
          { title: 'menu.collectionAreas', icon: MapPin, path: '/collection-areas' },
        ],
      },
    ],
  },
  {
    title: 'menu.reports',
    children: [
      {
        children: [
          { title: 'menu.monthlyBalance', icon: BarChart3, path: '/reports/monthly-balance' },
          { title: 'menu.collectionJournal', icon: ReportIcon, path: '/reports/collection-journal' },
          { title: 'menu.clientStatement', icon: FileText, path: '/reports/client-statement' },
          { title: 'menu.areaStatistics', icon: PieChart, path: '/reports/area-statistics' },
        ],
      },
      {
        children: [
          { title: 'menu.commissionReport', icon: Calculator, path: '/reports/commissions' },
          { title: 'menu.surplusShortage', icon: AlertTriangle, path: '/reports/surplus-shortage' },
          { title: 'menu.analytics', icon: BarChart3, path: '/analytics' },
        ],
      },
    ],
  },
];

// Mega menu mobile version
export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'menu.dashboard', path: '/' },
  {
    title: 'menu.operations',
    children: [
      { title: 'menu.dailyCollections', icon: Receipt, path: '/collections/daily' },
      { title: 'menu.allTransactions', icon: CreditCard, path: '/transactions' },
      { title: 'menu.pendingValidation', icon: CheckCircle2, path: '/transactions/pending' },
      { title: 'menu.deposits', icon: TrendingUp, path: '/transactions/deposits' },
      { title: 'menu.withdrawals', icon: TrendingDown, path: '/transactions/withdrawals' },
      { title: 'menu.allLoans', icon: DollarSign, path: '/loans' },
      { title: 'menu.loanRequests', icon: FileText, path: '/loans/requests' },
    ],
  },
  {
    title: 'menu.management',
    children: [
      { title: 'menu.allClients', icon: Users, path: '/clients' },
      { title: 'menu.addClient', icon: UserCircle, path: '/clients/new' },
      { title: 'menu.allAgents', icon: UserCheck, path: '/agents' },
      { title: 'menu.addAgent', icon: UserCircle, path: '/agents/new' },
      { title: 'menu.collectionAreas', icon: MapPin, path: '/collection-areas' },
    ],
  },
  {
    title: 'menu.reports',
    children: [
      { title: 'menu.monthlyBalance', icon: BarChart3, path: '/reports/monthly-balance' },
      { title: 'menu.collectionJournal', icon: ReportIcon, path: '/reports/collection-journal' },
      { title: 'menu.clientStatement', icon: FileText, path: '/reports/client-statement' },
      { title: 'menu.commissionReport', icon: Calculator, path: '/reports/commissions' },
    ],
  },
];

// Help menu (can be customized)
export const MENU_HELP: MenuConfig = [
  { title: 'menu.documentation', icon: FileQuestion, path: '/help/documentation' },
  { title: 'menu.support', icon: HelpCircle, path: '/help/support' },
  { separator: true },
  { title: 'menu.contactUs', icon: Share2, path: '/help/contact' },
];

// Root menu items for navigation
export const MENU_ROOT: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, rootPath: '/', path: '/', childrenIndex: 0 },
  { title: 'menu.collections', icon: Receipt, rootPath: '/collections/', path: '/collections/daily', childrenIndex: 1 },
  { title: 'menu.transactions', icon: CreditCard, rootPath: '/transactions/', path: '/transactions', childrenIndex: 2 },
  { title: 'menu.clients', icon: Users, rootPath: '/clients/', path: '/clients', childrenIndex: 3 },
  { title: 'menu.reports', icon: ReportIcon, rootPath: '/reports/', path: '/reports/monthly-balance', childrenIndex: 4 },
  { title: 'menu.settings', icon: Settings, rootPath: '/settings/', path: '/settings/system', childrenIndex: 5 },
];
