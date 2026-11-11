import type { Translations } from './en';

export const fr: Translations = {
  app: {
    name: 'DogalXalis',
  },
  common: {
    comingIn: 'Disponible en Phase {phase}',
    addTransaction: 'Ajouter une transaction',
  },
  nav: {
    home: 'Accueil',
    transactions: 'Transactions',
    budgets: 'Budgets',
    settings: 'Paramètres',
    dashboard: 'Tableau de bord',
    categories: 'Catégories',
    about: 'À propos',
    openMenu: 'Ouvrir le menu',
    newTransaction: 'Nouvelle transaction',
    editTransaction: 'Modifier la transaction',
    transactionDetails: 'Détails de la transaction',
    newBudget: 'Nouveau budget',
    editBudget: 'Modifier le budget',
    newCategory: 'Nouvelle catégorie',
    editCategory: 'Modifier la catégorie',
  },
  drawer: {
    tagline: 'Suivi de budget personnel',
    version: 'Version {version}',
  },
  home: {
    title: 'Tableau de bord',
    message: "Les totaux, les dernières transactions et l'aperçu des budgets apparaîtront ici.",
  },
  transactions: {
    title: 'Aucune transaction',
    message: 'Vos revenus et dépenses seront listés ici.',
    openSample: 'Ouvrir une transaction exemple (test de navigation)',
    detailId: 'Identifiant de la transaction : {id}',
    edit: 'Modifier cette transaction',
    formMessage: 'Le formulaire de transaction est construit en Phase 4.',
  },
  budgets: {
    title: 'Aucun budget',
    message: 'Les budgets mensuels par catégorie seront gérés ici.',
    add: 'Ajouter un budget',
    formMessage: 'Le formulaire de budget est construit en Phase 5.',
    editingId: 'Modification du budget : {id}',
  },
  categories: {
    title: 'Catégories',
    message: 'Les catégories de revenus et de dépenses seront listées ici.',
    add: 'Ajouter une catégorie',
    formMessage: 'Le formulaire de catégorie est construit en Phase 4.',
    editingId: 'Modification de la catégorie : {id}',
  },
  settings: {
    title: 'Paramètres',
    message: 'Les préférences de thème, de langue et de devise seront ici.',
  },
  about: {
    description:
      'DogalXalis est un gestionnaire simple de dépenses et de budget personnel. Il suit les revenus et les dépenses, les classe par catégories et suit des budgets mensuels.',
    purposeTitle: 'Objectif',
    purpose:
      "Édition Présentation : une démonstration ciblée et fonctionnelle d'une application de suivi de dépenses.",
    technologiesTitle: 'Technologies',
    technologies:
      'React Native, Expo, Expo Router, TypeScript, React Context API, SQLite, Express.js',
    authorTitle: 'Auteur',
    author: 'Bachir205',
  },
};
