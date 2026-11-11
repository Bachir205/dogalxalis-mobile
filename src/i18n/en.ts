export const en = {
  app: {
    name: 'DogalXalis',
  },
  common: {
    comingIn: 'Coming in Phase {phase}',
    addTransaction: 'Add transaction',
  },
  nav: {
    home: 'Home',
    transactions: 'Transactions',
    budgets: 'Budgets',
    settings: 'Settings',
    dashboard: 'Dashboard',
    categories: 'Categories',
    about: 'About',
    openMenu: 'Open menu',
    newTransaction: 'New transaction',
    editTransaction: 'Edit transaction',
    transactionDetails: 'Transaction details',
    newBudget: 'New budget',
    editBudget: 'Edit budget',
    newCategory: 'New category',
    editCategory: 'Edit category',
  },
  drawer: {
    tagline: 'Personal budget tracker',
    version: 'Version {version}',
  },
  home: {
    title: 'Dashboard',
    message: 'Totals, recent transactions and the budget overview will appear here.',
  },
  transactions: {
    title: 'No transactions yet',
    message: 'Your income and expenses will be listed here.',
    openSample: 'Open a sample transaction (navigation test)',
    detailId: 'Transaction id: {id}',
    edit: 'Edit this transaction',
    formMessage: 'The transaction form is built in Phase 4.',
  },
  budgets: {
    title: 'No budgets yet',
    message: 'Monthly category budgets will be managed here.',
    add: 'Add budget',
    formMessage: 'The budget form is built in Phase 5.',
    editingId: 'Editing budget: {id}',
  },
  categories: {
    title: 'Categories',
    message: 'Income and expense categories will be listed here.',
    add: 'Add category',
    formMessage: 'The category form is built in Phase 4.',
    editingId: 'Editing category: {id}',
  },
  settings: {
    themeTitle: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeHint: "System follows your phone's light or dark setting.",
    languageTitle: 'Language',
    currencyTitle: 'Currency',
    currencyHint:
      'New transactions and budgets use this currency. Totals only include records in the selected currency.',
    appInfoTitle: 'Application',
    appVersion: 'Version {version}',
  },
  about: {
    description:
      'DogalXalis is a simple personal expense and budget manager. It tracks income and expenses, organizes them in categories and follows monthly budgets.',
    purposeTitle: 'Purpose',
    purpose: 'Presentation Edition: a focused, working demonstration of a mobile expense tracker.',
    technologiesTitle: 'Technologies',
    technologies:
      'React Native, Expo, Expo Router, TypeScript, React Context API, SQLite, Express.js',
    authorTitle: 'Author',
    author: 'Bachir205',
  },
};

/** Shape every language must follow (a missing key is a TypeScript error). */
export type Translations = typeof en;
