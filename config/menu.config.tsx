import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  DollarSign,
  FileText as ReportIcon,
  FileQuestion,
  FileText,
  HelpCircle,
  LayoutGrid,
  MapPin,
  PieChart,
  Receipt,
  Settings,
  Share2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
} from 'lucide-react';
import { type MenuConfig } from './types';

// Microfinance Management System Menu Configuration
// Titles and headings use translation keys (menu.xxx) - components translate them via t()
export const MENU_SIDEBAR: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, path: '/', permission: 'dashboard.view' },
  { heading: 'menu.operations' },
  {
    title: 'menu.dailyCollections',
    icon: Receipt,
    children: [
      { title: 'menu.enterCollection', path: '/collections/daily', permission: 'collections.create' },
      {
        title: 'menu.collectionRecords',
        path: '/collections/records',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
    ],
  },
  {
    title: 'menu.transactions',
    icon: CreditCard,
    children: [
      {
        title: 'menu.allTransactions',
        path: '/transactions',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
      { title: 'menu.pendingValidation', path: '/validation/pending', permission: 'transactions.approve' },
      { title: 'menu.pendingAccounts', path: '/validation/pending-accounts', permission: 'transactions.approve' },
      { title: 'menu.deposits', path: '/transactions/deposits', permission: 'transactions.view' },
      {
        title: 'menu.withdrawals',
        path: '/transactions/withdrawals',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
      {
        title: 'menu.transfers',
        path: '/transactions/transfers',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
    ],
  },
  {
    title: 'menu.loans',
    icon: DollarSign,
    hiddenForRoles: ['agent', 'collector'],
    children: [
      { title: 'menu.allLoans', path: '/loans', permission: 'loans.view' },
      { title: 'menu.loanRequests', path: '/loans/requests', permission: 'loans.view' },
      { title: 'menu.activeLoans', path: '/loans/active', permission: 'loans.view' },
      { title: 'menu.loanRepayments', path: '/loans/repayments', permission: 'loans.view' },
    ],
  },
  { heading: 'menu.management' },
  {
    title: 'menu.clients',
    icon: Users,
    children: [
      { title: 'menu.allClients', path: '/clients', permission: 'clients.view' },
      { title: 'menu.addClient', path: '/clients/new', permission: 'clients.create' },
      { title: 'menu.clientAccounts', path: '/clients/accounts', permission: 'clients.view' },
    ],
  },
  {
    title: 'menu.agents',
    icon: UserCheck,
    children: [
      { title: 'menu.allAgents', path: '/agents', permission: 'agents.view' },
      { title: 'menu.addAgent', path: '/agents/new', permission: 'agents.create' },
      { title: 'menu.agentAccounts', path: '/agents/accounts', permission: 'agents.view' },
    ],
  },
  {
    title: 'menu.accountants',
    icon: Calculator,
    children: [
      { title: 'menu.allAccountants', path: '/accountants', permission: 'accountants.view' },
      { title: 'menu.addAccountant', path: '/accountants/new', permission: 'accountants.create' },
    ],
  },
  {
    title: 'menu.collectionAreas',
    icon: MapPin,
    children: [
      { title: 'menu.allAreas', path: '/collection-areas', permission: 'collection_areas.view' },
      { title: 'menu.addArea', path: '/collection-areas/new', permission: 'collection_areas.manage' },
      { title: 'menu.areaAssignments', path: '/collection-areas/assignments', permission: 'collection_areas.manage' },
    ],
  },
  { heading: 'menu.reportsAnalytics' },
  {
    title: 'menu.reports',
    icon: ReportIcon,
    hiddenForRoles: ['agent', 'collector'],
    children: [
      { title: 'menu.monthlyBalance', path: '/reports/monthly-balance', permission: 'reports.view' },
      { title: 'menu.collectionJournal', path: '/reports/collection-journal', permission: 'reports.view' },
      { title: 'menu.clientStatement', path: '/reports/client-statement', permission: 'reports.view' },
      { title: 'menu.statisticsByArea', path: '/reports/area-statistics', permission: 'reports.view' },
      { title: 'menu.commissionReport', path: '/reports/commissions', permission: 'reports.view' },
      { title: 'menu.surplusShortage', path: '/reports/surplus-shortage', permission: 'reports.surplus_shortage' },
    ],
  },
  {
    title: 'menu.analytics',
    icon: BarChart3,
    hiddenForRoles: ['agent', 'collector'],
    children: [
      { title: 'menu.overview', path: '/analytics', permission: 'reports.view' },
      { title: 'menu.financialSummary', path: '/analytics/financial', permission: 'reports.view' },
      { title: 'menu.transactionTrends', path: '/analytics/transactions', permission: 'reports.view' },
      { title: 'menu.agentPerformance', path: '/analytics/agents', permission: 'reports.view' },
    ],
  },
  { heading: 'menu.system' },
  {
    title: 'menu.validation',
    icon: CheckCircle2,
    path: '/validation/pending',
    badge: 'menu.pending',
    permission: 'transactions.approve',
  },
  {
    title: 'menu.dailyOperations',
    icon: CalendarCheck,
    children: [
      { title: 'menu.sessionStatus', path: '/operations/session', permission: 'session.manage', requiredRoles: ['manager'] },
      { title: 'menu.dayClosure', path: '/operations/day-closure', permission: 'day_closure.manage', requiredRoles: ['manager'] },
      { title: 'menu.cashReconciliation', path: '/operations/reconciliation', permission: 'day_closure.manage', requiredRoles: ['manager'] },
      { title: 'menu.auditLog', path: '/operations/audit-log', permission: 'reports.view' },
    ],
  },
  {
    title: 'menu.settings',
    icon: Settings,
    hiddenForRoles: ['agent', 'collector'],
    children: [
      { title: 'menu.systemSettings', path: '/user-management/settings', permission: 'settings.manage' },
      { title: 'menu.commissionRates', path: '/reports/commissions', permission: 'reports.view' },
      { title: 'menu.collectionAreas', path: '/collection-areas', permission: 'collection_areas.view' },
      { title: 'menu.userManagement', path: '/user-management/users', permission: 'users.manage' },
      { title: 'menu.roles', path: '/settings/roles', permission: 'roles.manage' },
      { title: 'menu.permissions', path: '/settings/permissions', permission: 'roles.manage' },
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
  { title: 'menu.enterCollection', icon: Receipt, path: '/collections/daily' },
  { title: 'menu.collectionRecords', icon: Receipt, path: '/collections/records' },
  { title: 'menu.transactions', icon: CreditCard, path: '/transactions' },
  { title: 'menu.clients', icon: Users, path: '/clients' },
  { title: 'menu.reports', icon: ReportIcon, path: '/reports' },
  { title: 'menu.settings', icon: Settings, path: '/settings' },
];

// Custom menu (can be used for specific contexts)
export const MENU_SIDEBAR_CUSTOM: MenuConfig = [
  { title: 'menu.dashboard', icon: LayoutGrid, path: '/' },
  { title: 'menu.enterCollection', icon: Receipt, path: '/collections/daily' },
  { title: 'menu.myClients', icon: Users, path: '/clients' },
];

// Mega menu for header navigation (permission-filtered for Accountant/Agent)
export const MENU_MEGA: MenuConfig = [
  { title: 'menu.dashboard', path: '/', permission: 'dashboard.view' },
  {
    title: 'menu.operations',
    children: [
      {
        children: [
          { title: 'menu.enterCollection', icon: Receipt, path: '/collections/daily', permission: 'collections.create' },
          { title: 'menu.collectionRecords', icon: Receipt, path: '/collections/records', permission: 'transactions.view', hiddenForRoles: ['agent', 'collector'] },
          {
            title: 'menu.allTransactions',
            icon: CreditCard,
            path: '/transactions',
            permission: 'transactions.view',
            hiddenForRoles: ['agent', 'collector'],
          },
          { title: 'menu.pendingValidation', icon: CheckCircle2, path: '/validation/pending', permission: 'transactions.approve' },
          { title: 'menu.pendingAccounts', icon: UserCircle, path: '/validation/pending-accounts', permission: 'transactions.approve' },
          { title: 'menu.deposits', icon: TrendingUp, path: '/transactions/deposits', permission: 'transactions.view' },
          {
            title: 'menu.withdrawals',
            icon: TrendingDown,
            path: '/transactions/withdrawals',
            permission: 'transactions.view',
            hiddenForRoles: ['agent', 'collector'],
          },
          {
            title: 'menu.transfers',
            icon: ArrowRightLeft,
            path: '/transactions/transfers',
            permission: 'transactions.view',
            hiddenForRoles: ['agent', 'collector'],
          },
        ],
      },
      {
        children: [
          {
            title: 'menu.allLoans',
            icon: DollarSign,
            path: '/loans',
            permission: 'loans.view',
            hiddenForRoles: ['agent', 'collector'],
          },
          {
            title: 'menu.loanRequests',
            icon: FileText,
            path: '/loans/requests',
            permission: 'loans.view',
            hiddenForRoles: ['agent', 'collector'],
          },
          {
            title: 'menu.activeLoans',
            icon: Wallet,
            path: '/loans/active',
            permission: 'loans.view',
            hiddenForRoles: ['agent', 'collector'],
          },
          {
            title: 'menu.loanRepayments',
            icon: Calculator,
            path: '/loans/repayments',
            permission: 'loans.view',
            hiddenForRoles: ['agent', 'collector'],
          },
        ],
      },
    ],
  },
  {
    title: 'menu.management',
    children: [
      {
        title: 'menu.clients',
        children: [
          { title: 'menu.allClients', icon: Users, path: '/clients', permission: 'clients.view' },
          { title: 'menu.addClient', icon: UserCircle, path: '/clients/new', permission: 'clients.create' },
          { title: 'menu.clientAccounts', icon: Wallet, path: '/clients/accounts', permission: 'clients.view' },
        ],
      },
      {
        title: 'menu.agents',
        children: [
          { title: 'menu.allAgents', icon: UserCheck, path: '/agents', permission: 'agents.view' },
          { title: 'menu.addAgent', icon: UserCircle, path: '/agents/new', permission: 'agents.create' },
          { title: 'menu.agentAccounts', icon: Wallet, path: '/agents/accounts', permission: 'agents.view' },
        ],
      },
      {
        title: 'menu.accountants',
        children: [
          { title: 'menu.allAccountants', icon: Calculator, path: '/accountants', permission: 'accountants.view' },
          { title: 'menu.addAccountant', icon: UserCircle, path: '/accountants/new', permission: 'accountants.create' },
        ],
      },
      {
        title: 'menu.collectionAreas',
        children: [
          { title: 'menu.allAreas', icon: MapPin, path: '/collection-areas', permission: 'collection_areas.view' },
          { title: 'menu.addArea', icon: UserCircle, path: '/collection-areas/new', permission: 'collection_areas.manage' },
          { title: 'menu.areaAssignments', icon: MapPin, path: '/collection-areas/assignments', permission: 'collection_areas.manage' },
        ],
      },
    ],
  },
  {
    title: 'menu.reports',
    hiddenForRoles: ['agent', 'collector'],
    children: [
      {
        children: [
          { title: 'menu.monthlyBalance', icon: BarChart3, path: '/reports/monthly-balance', permission: 'reports.view' },
          { title: 'menu.collectionJournal', icon: ReportIcon, path: '/reports/collection-journal', permission: 'reports.view' },
          { title: 'menu.clientStatement', icon: FileText, path: '/reports/client-statement', permission: 'reports.view' },
          { title: 'menu.areaStatistics', icon: PieChart, path: '/reports/area-statistics', permission: 'reports.view' },
        ],
      },
      {
        children: [
          { title: 'menu.commissionReport', icon: Calculator, path: '/reports/commissions', permission: 'reports.view' },
          { title: 'menu.surplusShortage', icon: AlertTriangle, path: '/reports/surplus-shortage', permission: 'reports.surplus_shortage' },
          { title: 'menu.analytics', icon: BarChart3, path: '/analytics', permission: 'reports.view' },
        ],
      },
    ],
  },
];

// Mega menu mobile version (permission-filtered for Accountant/Agent)
export const MENU_MEGA_MOBILE: MenuConfig = [
  { title: 'menu.dashboard', path: '/', permission: 'dashboard.view' },
  {
    title: 'menu.operations',
    children: [
      { title: 'menu.enterCollection', icon: Receipt, path: '/collections/daily', permission: 'collections.create' },
      { title: 'menu.collectionRecords', icon: Receipt, path: '/collections/records', permission: 'transactions.view', hiddenForRoles: ['agent', 'collector'] },
      {
        title: 'menu.allTransactions',
        icon: CreditCard,
        path: '/transactions',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
      { title: 'menu.pendingValidation', icon: CheckCircle2, path: '/validation/pending', permission: 'transactions.approve' },
      { title: 'menu.pendingAccounts', icon: UserCircle, path: '/validation/pending-accounts', permission: 'transactions.approve' },
      { title: 'menu.deposits', icon: TrendingUp, path: '/transactions/deposits', permission: 'transactions.view' },
      {
        title: 'menu.withdrawals',
        icon: TrendingDown,
        path: '/transactions/withdrawals',
        permission: 'transactions.view',
        hiddenForRoles: ['agent', 'collector'],
      },
      {
        title: 'menu.allLoans',
        icon: DollarSign,
        path: '/loans',
        permission: 'loans.view',
        hiddenForRoles: ['agent', 'collector'],
      },
      {
        title: 'menu.loanRequests',
        icon: FileText,
        path: '/loans/requests',
        permission: 'loans.view',
        hiddenForRoles: ['agent', 'collector'],
      },
    ],
  },
  {
    title: 'menu.management',
    children: [
      { title: 'menu.allClients', icon: Users, path: '/clients', permission: 'clients.view' },
      { title: 'menu.addClient', icon: UserCircle, path: '/clients/new', permission: 'clients.create' },
      { title: 'menu.allAgents', icon: UserCheck, path: '/agents', permission: 'agents.view' },
      { title: 'menu.addAgent', icon: UserCircle, path: '/agents/new', permission: 'agents.create' },
      { title: 'menu.allAccountants', icon: Calculator, path: '/accountants', permission: 'accountants.view' },
      { title: 'menu.addAccountant', icon: UserCircle, path: '/accountants/new', permission: 'accountants.create' },
      { title: 'menu.collectionAreas', icon: MapPin, path: '/collection-areas', permission: 'collection_areas.view' },
    ],
  },
  {
    title: 'menu.reports',
    hiddenForRoles: ['agent', 'collector'],
    children: [
      { title: 'menu.monthlyBalance', icon: BarChart3, path: '/reports/monthly-balance', permission: 'reports.view' },
      { title: 'menu.collectionJournal', icon: ReportIcon, path: '/reports/collection-journal', permission: 'reports.view' },
      { title: 'menu.clientStatement', icon: FileText, path: '/reports/client-statement', permission: 'reports.view' },
      { title: 'menu.commissionReport', icon: Calculator, path: '/reports/commissions', permission: 'reports.view' },
      { title: 'menu.surplusShortage', icon: AlertTriangle, path: '/reports/surplus-shortage', permission: 'reports.surplus_shortage' },
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
  { title: 'menu.settings', icon: Settings, rootPath: '/settings/', path: '/settings', childrenIndex: 5 },
];
