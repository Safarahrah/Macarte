import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Tableau de bord',
        people: 'Personnes',
        cards: 'Cartes',
        templates: 'Modèles',
        logout: 'Déconnexion',
        settings: 'Paramètres',
        create: 'Créer',
        save: 'Enregistrer',
        cancel: 'Annuler',
        back: 'Retour',
        next: 'Suivant',
        close: 'Fermer',
        confirm: 'Confirmer',
        delete: 'Supprimer',
        edit: 'Modifier',
        download: 'Télécharger',
        share: 'Partager',
        search: 'Rechercher',
        loading: 'Chargement...',
        success: 'Succès',
        error: 'Erreur',
        tryAgain: 'Réessayer',
        skip: 'Passer',
        digitalCard: 'Cartes numériques',
        digitalCardDesc: 'Cartes de visite digitales avec page publique, QR code et vCard.',
        printableCard: 'Cartes imprimables',
        printableCardDesc: 'Éditeur recto-verso avec exports PDF, JPG, PNG et SVG.'
      },
      // Dashboard
      dashboard: {
        welcome: 'Bienvenue sur Macarte',
        subtitle: 'Créez des designs professionnels en quelques clics.',
        hello: 'Bonjour',
        creator: 'créateur',
        searchPlaceholder: 'Rechercher un projet...',
        recentProjects: 'Créations récentes',
        popular: 'Créations populaires',
        allTools: 'Tous les outils',
        noProjects: 'Aucun projet ne correspond à votre recherche.',
        emptyProjects: 'Aucun projet pour le moment. Commencez par créer votre premier design!',
        digitalCard: 'Carte de visite',
        printableCard: 'Carte imprimable',
        logo: 'Créer un logo',
        flyer: 'Concevoir un flyer',
        poster: 'Faire une affiche',
        social: 'Publier sur réseaux',
        other: 'Autres créations',
        projectsCount_one: 'projet',
        projectsCount_other: 'projets'
      },
      // Templates
      templates: {
        title: 'Modèles',
        subtitle: 'Choisissez un modèle pour commencer',
        chooseTemplate: 'Choisir ce modèle',
        custom: 'Personnalisé',
        categories: {
          business: 'Affaires',
          creative: 'Créatif',
          minimalist: 'Minimaliste',
          luxury: 'Luxe',
          modern: 'Moderne',
          classic: 'Classique'
        }
      },
      // Editor
      editor: {
        title: 'Éditeur',
        unsavedChanges: 'Modifications non enregistrées',
        save: 'Enregistrer',
        export: 'Exporter',
        exportDialog: 'Exporter',
        exportFormats: {
          pdf: 'PDF (impression)',
          png: 'PNG',
          pngHd: 'PNG haute résolution',
          jpg: 'JPG',
          svg: 'SVG vectoriel',
          webm: 'Vidéo WebM'
        },
        pages: 'Pages',
        currentPage: 'Page actuelle',
        allPages: 'Toutes les pages',
        includeBleed: 'Inclure les fonds perdus',
        cropMarks: 'Traits de coupe',
        dpi: 'Résolution (DPI)',
        paymentRequired: 'Paiement requis pour exporter ce fichier.',
        payButton: 'Payer 4.99 $',
        unlockExport: 'Débloquer l\'export',
        unlockDesc: 'Paiement unique de 4.99 $ pour exporter ce design en haute qualité.',
        paid: 'Payé',
        locked: '4.99 $',
        open: 'Ouvrir'
      },
      // Authentication
      auth: {
        login: 'Connexion',
        loginSubtitle: 'Accédez à votre espace Macarte.',
        register: 'Créer un compte',
        registerSubtitle: 'Inscrivez-vous pour créer votre organisation et vos cartes Macarte.',
        email: 'Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        orgName: 'Nom de l\'organisation',
        forgotPassword: 'Mot de passe oublié ?',
        hasAccount: 'Vous avez déjà un compte ?',
        noAccount: 'Nouveau sur Macarte ?',
        sendResetLink: 'Envoyer le lien',
        sending: 'Envoi...',
        loginSuccess: 'Connexion réussie',
        registerSuccess: 'Compte créé avec succès',
        invalidCredentials: 'Email ou mot de passe incorrect',
        emailRequired: 'Entrez votre adresse email',
        passwordRequired: 'Entrez votre mot de passe',
        orgNameRequired: 'Entrez le nom de l\'organisation',
        passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères',
        passwordLetterDigit: 'Le mot de passe doit contenir une lettre et un chiffre',
        passwordsMismatch: 'Les mots de passe ne correspondent pas',
        accountExists: 'Un compte avec cet email existe déjà',
        connectionFailed: 'La connexion a échoué. Réessayez.',
        registrationFailed: 'Inscription impossible. Réessayez.',
        resetSent: 'Si un compte existe, un lien de réinitialisation a été envoyé.',
        resetFailed: 'Impossible d\'envoyer le lien pour le moment.'
      },
      // Common
      common: {
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        cancel: 'Annuler',
        confirm: 'Confirmer',
        delete: 'Supprimer',
        save: 'Enregistrer',
        edit: 'Modifier',
        close: 'Fermer',
        back: 'Retour',
        continue: 'Continuer',
        skip: 'Passer',
        or: 'ou',
        of: 'de',
        and: 'et',
        to: 'vers',
        from: 'de',
        in: 'dans',
        at: 'à',
        by: 'par',
        with: 'avec',
        without: 'sans',
        for: 'pour',
        create: 'Créer',
        new: 'Nouveau',
        existing: 'Existant',
        manage: 'Gérer',
        view: 'Voir',
        actions: 'Actions',
        details: 'Détails',
        settings: 'Paramètres',
        help: 'Aide',
        language: 'Langue',
        french: 'Français',
        english: 'English'
      },
      // Errors
      errors: {
        networkError: 'Erreur de connexion. Vérifiez votre internet.',
        serverError: 'Erreur serveur. Réessayez plus tard.',
        unauthorized: 'Non autorisé',
        forbidden: 'Accès refusé',
        notFound: 'Non trouvé',
        validationError: 'Erreur de validation',
        paymentRequired: 'Paiement requis',
        paymentFailed: 'Échec du paiement',
        uploadFailed: 'Échec du téléchargement',
        saveFailed: 'Échec de l\'enregistrement',
        deleteFailed: 'Échec de la suppression',
        generic: 'Une erreur est survenue. Réessayez.'
      }
    }
  },
  en: {
    translation: {
      // Navigation
      nav: {
        dashboard: 'Dashboard',
        people: 'People',
        cards: 'Cards',
        templates: 'Templates',
        logout: 'Logout',
        settings: 'Settings',
        create: 'Create',
        save: 'Save',
        cancel: 'Cancel',
        back: 'Back',
        next: 'Next',
        close: 'Close',
        confirm: 'Confirm',
        delete: 'Delete',
        edit: 'Edit',
        download: 'Download',
        share: 'Share',
        search: 'Search',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        tryAgain: 'Try again',
        skip: 'Skip',
        digitalCard: 'Digital cards',
        digitalCardDesc: 'Digital business cards with public page, QR code and vCard.',
        printableCard: 'Printable cards',
        printableCardDesc: 'Two-sided editor with PDF, JPG, PNG and SVG exports.'
      },
      // Dashboard
      dashboard: {
        welcome: 'Welcome to Macarte',
        subtitle: 'Create professional designs in just a few clicks.',
        hello: 'Hello',
        creator: 'creator',
        searchPlaceholder: 'Search a project...',
        recentProjects: 'Recent projects',
        popular: 'Popular creations',
        allTools: 'All tools',
        noProjects: 'No projects match your search.',
        emptyProjects: 'No projects yet. Start by creating your first design!',
        digitalCard: 'Business card',
        printableCard: 'Printable card',
        logo: 'Create a logo',
        flyer: 'Design a flyer',
        poster: 'Create a poster',
        social: 'Post on social',
        other: 'Other creations',
        projectsCount_one: 'project',
        projectsCount_other: 'projects'
      },
      // Templates
      templates: {
        title: 'Templates',
        subtitle: 'Choose a template to get started',
        chooseTemplate: 'Choose this template',
        custom: 'Custom',
        categories: {
          business: 'Business',
          creative: 'Creative',
          minimalist: 'Minimalist',
          luxury: 'Luxury',
          modern: 'Modern',
          classic: 'Classic'
        }
      },
      // Editor
      editor: {
        title: 'Editor',
        unsavedChanges: 'Unsaved changes',
        save: 'Save',
        export: 'Export',
        exportDialog: 'Export',
        exportFormats: {
          pdf: 'PDF (print)',
          png: 'PNG',
          pngHd: 'PNG high resolution',
          jpg: 'JPG',
          svg: 'SVG vector',
          webm: 'WebM video'
        },
        pages: 'Pages',
        currentPage: 'Current page',
        allPages: 'All pages',
        includeBleed: 'Include bleed',
        cropMarks: 'Crop marks',
        dpi: 'Resolution (DPI)',
        paymentRequired: 'Payment required to export this file.',
        payButton: 'Pay $4.99',
        unlockExport: 'Unlock export',
        unlockDesc: 'One-time payment of $4.99 to export this design in high quality.',
        paid: 'Paid',
        locked: '$4.99',
        open: 'Open'
      },
      // Authentication
      auth: {
        login: 'Login',
        loginSubtitle: 'Access your Macarte workspace.',
        register: 'Create an account',
        registerSubtitle: 'Sign up to create your organization and Macarte cards.',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm password',
        orgName: 'Organization name',
        forgotPassword: 'Forgot password?',
        hasAccount: 'Already have an account?',
        noAccount: 'New to Macarte?',
        sendResetLink: 'Send link',
        sending: 'Sending...',
        loginSuccess: 'Login successful',
        registerSuccess: 'Account created successfully',
        invalidCredentials: 'Invalid email or password',
        emailRequired: 'Enter your email address',
        passwordRequired: 'Enter your password',
        orgNameRequired: 'Enter organization name',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordLetterDigit: 'Password must contain a letter and a digit',
        passwordsMismatch: 'Passwords do not match',
        accountExists: 'An account with this email already exists',
        connectionFailed: 'Connection failed. Please try again.',
        registrationFailed: 'Registration failed. Please try again.',
        resetSent: 'If an account exists, a password reset link has been sent.',
        resetFailed: 'Unable to send the link at this time.'
      },
      // Common
      common: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        cancel: 'Cancel',
        confirm: 'Confirm',
        delete: 'Delete',
        save: 'Save',
        edit: 'Edit',
        close: 'Close',
        back: 'Back',
        continue: 'Continue',
        skip: 'Skip',
        or: 'or',
        of: 'of',
        and: 'and',
        to: 'to',
        from: 'from',
        in: 'in',
        at: 'at',
        by: 'by',
        with: 'with',
        without: 'without',
        for: 'for',
        create: 'Create',
        new: 'New',
        existing: 'Existing',
        manage: 'Manage',
        view: 'View',
        actions: 'Actions',
        details: 'Details',
        settings: 'Settings',
        help: 'Help',
        language: 'Language',
        french: 'French',
        english: 'English'
      },
      // Errors
      errors: {
        networkError: 'Connection error. Check your internet.',
        serverError: 'Server error. Please try again later.',
        unauthorized: 'Unauthorized',
        forbidden: 'Access denied',
        notFound: 'Not found',
        validationError: 'Validation error',
        paymentRequired: 'Payment required',
        paymentFailed: 'Payment failed',
        uploadFailed: 'Upload failed',
        saveFailed: 'Save failed',
        deleteFailed: 'Delete failed',
        generic: 'An error occurred. Please try again.'
      }
    }
  }
};

// Determine initial language from localStorage or browser preference
const getInitialLanguage = () => {
  const storedLang = localStorage.getItem('lang');
  if (storedLang === 'fr' || storedLang === 'en') {
    return storedLang;
  }
  const browserLang = navigator.language || navigator.userLanguage || '';
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'fr';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

// Listen for language changes and update document/lang localStorage
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('lang', lng);
});

export default i18n;
