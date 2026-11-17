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
        title: 'Bienvenue sur Macarte',
        subtitle: 'Créez des designs professionnels en quelques clics.',
        studio: 'Studio de création',
        greeting: 'Bonjour',
        creator: 'créateur',
        heroDescription: 'Transformez vos idées en designs professionnels. Logos, flyers, affiches, publications sociales et plus encore.',
        searchPlaceholder: 'Rechercher un projet...',
        popularCreations: 'Créations populaires',
        allTools: 'Tous les outils',
        create: 'Créer',
        recentCreations: 'Créations récentes',
        results: 'résultats',
        result: 'résultat',
        paid: 'Payé',
        lockedPrice: '4.99 $',
        open: 'Ouvrir',
        noResults: 'Aucun projet ne correspond à votre recherche.',
        welcome: 'Bienvenue sur Macarte',
        hello: 'Bonjour',
        recentProjects: 'Créations récentes',
        popular: 'Créations populaires',
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
        projectsCount_other: 'projets',
        quickActions: {
          digitalCard: 'Carte de visite',
          printableCard: 'Carte imprimable',
          logo: 'Créer un logo',
          flyer: 'Concevoir un flyer'
        }
      },
      // Templates
      templates: {
        title: 'Modèles',
        subtitle: 'Choisissez un modèle pour commencer',
        chooseTemplate: 'Choisir ce modèle',
        custom: 'Personnalisé',
        templatesIncluded: 'modèles inclus',
        chooseTemplateTitle: 'Choisissez votre modèle',
        description: 'Classés par style et par industrie — chaque modèle est entièrement personnalisable : textes, couleurs, logo, QR code et export prêt à imprimer.',
        searchPlaceholder: 'Rechercher un modèle (ex. luxe, barbier, immobilier…)',
        useTemplate: 'Utiliser ce modèle',
        categories: {
          business: 'Affaires',
          creative: 'Créatif',
          minimalist: 'Minimaliste',
          luxury: 'Luxe',
          modern: 'Moderne',
          classic: 'Classique'
        },
        // Pocket templates
        pockets: {
          corporate: 'Corporate',
          elegant: 'Élégant',
          grayLight: 'Gris clair',
          grayDark: 'Gris foncé',
          brownDark: 'Brun foncé',
          cream: 'Crème',
          forestGreen: 'Vert forêt',
          black: 'Noir',
          purple: 'Mauve',
          bluePale: 'Bleu pâle',
          blueDark: 'Bleu foncé',
          yellow: 'Jaune',
          aqua: 'Vert d\'eau'
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
        orgPlaceholder: 'Studio, équipe ou votre nom',
        passwordPlaceholder: '8 caractères, lettre + chiffre',
        confirmPasswordPlaceholder: 'Répétez le mot de passe',
        forgotPassword: 'Mot de passe oublié ?',
        hasAccount: 'Vous avez déjà un compte ?',
        noAccount: 'Nouveau sur Macarte ?',
        sendResetLink: 'Envoyer le lien',
        sending: 'Envoi...',
        creating: 'Création du compte...',
        createAccount: 'Créer mon compte',
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
        english: 'English',
        welcome: 'Bienvenue',
        homepage: 'Accueil',
        about: 'À propos',
        features: 'Fonctionnalités',
        howItWorks: 'Comment ça marche',
        contact: 'Contact',
        privacy: 'Confidentialité',
        terms: 'Conditions',
        copyright: 'Tous droits réservés',
        poweredBy: 'Propulsé par',
        version: 'Version',
        allRightsReserved: 'Tous droits réservés',
        pleaseEnter: 'Veuillez entrer',
        optional: 'Optionnel',
        required: 'Obligatoire',
        select: 'Sélectionner',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        ascending: 'Croissant',
        descending: 'Décroissant',
        show: 'Afficher',
        hide: 'Masquer',
        expand: 'Développer',
        collapse: 'Réduire',
        upload: 'Télécharger',
        download: 'Télécharger',
        refresh: 'Actualiser',
        submit: 'Envoyer',
        submiting: 'Envoi...',
        remove: 'Supprimer',
        add: 'Ajouter',
        name: 'Nom',
        description: 'Description',
        type: 'Type',
        status: 'Statut',
        date: 'Date',
        created: 'Créé le',
        updated: 'Mis à jour le',
        owner: 'Propriétaire',
        member: 'Membre',
        admin: 'Administrateur',
        guest: 'Invité',
        public: 'Public',
        private: 'Privé',
        enabled: 'Activé',
        disabled: 'Désactivé',
        active: 'Actif',
        inactive: 'Inactif',
        yes: 'Oui',
        no: 'Non',
        all: 'Tous',
        none: 'Aucun',
        selected: 'Sélectionné',
        available: 'Disponible',
        unavailable: 'Indisponible',
        more: 'Plus',
        less: 'Moins',
        previous: 'Précédent',
        next: 'Suivant',
        first: 'Premier',
        last: 'Dernier',
        page: 'Page',
        ofPages: 'de',
        perPage: 'par page',
        showing: 'Affichage',
        results: 'résultats',
        noResults: 'Aucun résultat',
        tryAgain: 'Réessayez',
        learnMore: 'En savoir plus',
        getStarted: 'Commencer',
        seeAll: 'Voir tout',
        viewDetails: 'Voir les détails',
        closeDialog: 'Fermer la boîte de dialogue',
        confirmAction: 'Confirmer l\'action',
        cancelAction: 'Annuler l\'action',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
        deleteConfirmTitle: 'Confirmer la suppression',
        saveChanges: 'Enregistrer les modifications',
        discardChanges: 'Annuler les modifications',
        unsavedChanges: 'Modifications non enregistrées',
        leaveWithoutSaving: 'Quitter sans enregistrer ?',
        leaveWithoutSavingMessage: 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?',
        lightTheme: 'Thème clair',
        darkTheme: 'Thème sombre',
        menu: 'Menu',
        openMenu: 'Ouvrir le menu',
        closeMenu: 'Fermer le menu'
      },
      // Setup
      setup: {
        title: 'Configuration initiale',
        subtitle: 'Créez votre organisation et le premier compte administrateur Macarte.',
        orgLabel: 'Organisation',
        orgPlaceholder: 'Mon entreprise',
        emailLabel: 'Email',
        emailPlaceholder: 'vous@exemple.com',
        adminEmail: 'Email administrateur',
        passwordLabel: 'Mot de passe',
        passwordPlaceholder: '8 caractères min.',
        confirmPasswordLabel: 'Confirmer le mot de passe',
        createButton: 'Créer l\'organisation',
        creating: 'Création...',
        success: 'Organisation créée avec succès',
        error: 'Échec de la configuration. Réessayez.',
        alreadyConfigured: 'Déjà configuré ?'
      },
      // Home
      home: {
        hero: {
          badge: 'Cartes de visite avec QR code',
          title: 'Créez votre carte d\'affaires professionnelle en quelques minutes.',
          subtitle: 'Modèles modernes, éditeur intuitif, QR code scannable et export prêt à imprimer. Votre carte, votre identité.',
          createCard: 'Créer ma carte',
          seeTemplates: 'Voir les modèles',
          feature1: 'QR scannable',
          feature2: 'Export imprimable',
          feature3: '100 % responsive'
        },
        qrCard: {
          title: 'Scan instantané',
          subtitle: 'Ouvre votre carte digitale'
        },
        templates: {
          title: 'Des modèles pensés pour être remarqués',
          subtitle: 'Minimal, Corporate, Luxury, Creative, Healthcare, Technology — changez de style en un clic.',
          allTemplates: 'Tous les modèles'
        },
        howItWorks: {
          title: 'Comment ça fonctionne',
          subtitle: 'Trois étapes, aucune compétence en design requise.'
        },
        steps: {
          choose: {
            title: 'Choisissez un modèle',
            text: 'Parcourez une galerie de modèles professionnels ou importez votre propre carte comme fond.'
          },
          customize: {
            title: 'Personnalisez',
            text: 'Ajoutez textes, logo, image et QR code. Déplacez, redimensionnez et ajustez chaque élément.'
          },
          print: {
            title: 'Imprimez ou partagez',
            text: 'Exportez un fichier prêt à imprimer (avec fond perdu) ou partagez votre carte digitale par QR.'
          }
        },
        features: {
          title: 'Tout ce qu\'il faut pour une carte impeccable',
          subtitle: 'Des outils simples, un rendu professionnel.',
          qr: {
            title: 'QR code scannable',
            text: 'URL, téléphone, email ou vCard — vérifié pour rester lisible à l\'impression.'
          },
          import: {
            title: 'Importez votre carte',
            text: 'Utilisez votre propre visuel PNG/JPG/WebP comme fond, puis ajoutez vos éléments.'
          },
          editor: {
            title: 'Éditeur complet',
            text: 'Police, taille, gras, italique, couleur, alignement et espacement, en direct.'
          },
          export: {
            title: 'Export pro',
            text: 'PNG haute résolution et format avec 3 mm de fond perdu, prêt pour l\'imprimeur.'
          },
          responsive: {
            title: 'Responsive & PWA',
            text: 'Une interface pensée pour le mobile, utilisable même hors ligne.'
          },
          selfHosted: {
            title: 'Auto-hébergeable',
            text: 'Vos données restent chez vous. Aucun service tiers requis.'
          }
        },
        cta: {
          title: 'Prêt à créer votre carte ?',
          subtitle: 'Choisissez un modèle ou importez votre visuel, ajoutez votre QR code et téléchargez un fichier prêt à imprimer.',
          createCard: 'Créer ma carte',
          seeTemplates: 'Voir les modèles'
        }
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
      },
      // Landing
      landing: {
        heroTitle: 'Créez des cartes de visite professionnelles avec QR code',
        heroSubtitle: 'Gratuit, facile et sans compte requis. Commencez en quelques secondes.',
        heroDescription: 'Créez votre carte professionnelle, partagez-la en un scan et téléchargez un design prêt à imprimer en PDF. Simple, rapide et élégant.',
        getStarted: 'Commencer',
        getStartedFree: 'Commencer gratuitement',
        seeTemplates: 'Voir les modèles',
        featuresTitle: 'Fonctionnalités',
        featuresSubtitle: 'Tout ce dont vous avez besoin pour créer des cartes de visite professionnelles.',
        howItWorksTitle: 'Comment ça marche',
        howItWorksSubtitle: 'Trois étapes simples pour créer votre carte.',
        templatesTitle: 'Modèles',
        templatesSubtitle: 'Choisissez parmi nos modèles professionnels et personnalisez-les.',
        pricingTitle: 'Tarifs',
        pricingSubtitle: 'Gratuit pour les cartes numériques. Paiement unique pour les exports haute qualité.',
        testimonialsTitle: 'Témoignages',
        testimonialsSubtitle: 'Ce que nos utilisateurs disent de nous.',
        faqTitle: 'FAQ',
        faqSubtitle: 'Questions fréquentes sur Macarte.',
        contactTitle: 'Contact',
        contactSubtitle: 'Besoin d\'aide ? Contactez-nous.',
        product: 'Produit',
        account: 'Compte',
        organization: 'Organisation',
        footerDescription: 'Créez, personnalisez et imprimez des cartes de visite professionnelles avec QR code, en quelques minutes.',
        sourceCode: 'Code source sur GitHub',
        homepage: 'Accueil',
        cardsAlt: 'Cartes de visite créées avec MaCarte',
        digitalCard: 'Carte numérique',
        digitalCardDesc: 'Une page personnelle avec vos coordonnées, vos liens et vos réseaux, accessible partout.',
        qrCode: 'QR code intégré',
        qrCodeDesc: 'Vos contacts scannent le code et enregistrent vos informations en quelques secondes.',
        printReady: 'Prêt à imprimer',
        printReadyDesc: 'Choisissez parmi nos modèles professionnels et exportez en PNG, SVG ou PDF.'
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
        title: 'Welcome to Macarte',
        subtitle: 'Create professional designs in just a few clicks.',
        studio: 'Creation Studio',
        greeting: 'Hello',
        creator: 'creator',
        heroDescription: 'Transform your ideas into professional designs. Logos, flyers, posters, social posts and more.',
        searchPlaceholder: 'Search a project...',
        popularCreations: 'Popular creations',
        allTools: 'All tools',
        create: 'Create',
        recentCreations: 'Recent creations',
        results: 'results',
        result: 'result',
        paid: 'Paid',
        lockedPrice: '$4.99',
        open: 'Open',
        noResults: 'No project matches your search.',
        welcome: 'Welcome to Macarte',
        hello: 'Hello',
        recentProjects: 'Recent projects',
        popular: 'Popular creations',
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
        projectsCount_other: 'projects',
        quickActions: {
          digitalCard: 'Business card',
          printableCard: 'Printable card',
          logo: 'Create a logo',
          flyer: 'Design a flyer'
        }
      },
      // Templates
      templates: {
        title: 'Templates',
        subtitle: 'Choose a template to get started',
        chooseTemplate: 'Choose this template',
        custom: 'Custom',
        templatesIncluded: 'templates included',
        chooseTemplateTitle: 'Choose your template',
        description: 'Organized by style and industry — each template is fully customizable: text, colors, logo, QR code and print-ready export.',
        searchPlaceholder: 'Search a template (e.g. luxury, barber, real estate…)',
        useTemplate: 'Use this template',
        categories: {
          business: 'Business',
          creative: 'Creative',
          minimalist: 'Minimalist',
          luxury: 'Luxury',
          modern: 'Modern',
          classic: 'Classic'
        },
        // Pocket templates
        pockets: {
          corporate: 'Corporate',
          elegant: 'Elegant',
          grayLight: 'Light gray',
          grayDark: 'Dark gray',
          brownDark: 'Dark brown',
          cream: 'Cream',
          forestGreen: 'Forest green',
          black: 'Black',
          purple: 'Purple',
          bluePale: 'Pale blue',
          blueDark: 'Dark blue',
          yellow: 'Yellow',
          aqua: 'Aqua'
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
        orgPlaceholder: 'Studio, team or your name',
        passwordPlaceholder: '8 characters, letter + digit',
        confirmPasswordPlaceholder: 'Repeat password',
        forgotPassword: 'Forgot password?',
        hasAccount: 'Already have an account?',
        noAccount: 'New to Macarte?',
        sendResetLink: 'Send link',
        sending: 'Sending...',
        creating: 'Creating account...',
        createAccount: 'Create my account',
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
        english: 'English',
        welcome: 'Welcome',
        homepage: 'Home',
        about: 'About',
        features: 'Features',
        howItWorks: 'How it works',
        contact: 'Contact',
        privacy: 'Privacy',
        terms: 'Terms',
        copyright: 'All rights reserved',
        poweredBy: 'Powered by',
        version: 'Version',
        allRightsReserved: 'All rights reserved',
        pleaseEnter: 'Please enter',
        optional: 'Optional',
        required: 'Required',
        select: 'Select',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        ascending: 'Ascending',
        descending: 'Descending',
        show: 'Show',
        hide: 'Hide',
        expand: 'Expand',
        collapse: 'Collapse',
        upload: 'Upload',
        download: 'Download',
        refresh: 'Refresh',
        submit: 'Submit',
        submiting: 'Submitting...',
        remove: 'Remove',
        add: 'Add',
        name: 'Name',
        description: 'Description',
        type: 'Type',
        status: 'Status',
        date: 'Date',
        created: 'Created',
        updated: 'Updated',
        owner: 'Owner',
        member: 'Member',
        admin: 'Administrator',
        guest: 'Guest',
        public: 'Public',
        private: 'Private',
        enabled: 'Enabled',
        disabled: 'Disabled',
        active: 'Active',
        inactive: 'Inactive',
        yes: 'Yes',
        no: 'No',
        all: 'All',
        none: 'None',
        selected: 'Selected',
        available: 'Available',
        unavailable: 'Unavailable',
        more: 'More',
        less: 'Less',
        previous: 'Previous',
        next: 'Next',
        first: 'First',
        last: 'Last',
        page: 'Page',
        ofPages: 'of',
        perPage: 'per page',
        showing: 'Showing',
        results: 'results',
        noResults: 'No results',
        tryAgain: 'Try again',
        learnMore: 'Learn more',
        getStarted: 'Get started',
        seeAll: 'See all',
        viewDetails: 'View details',
        closeDialog: 'Close dialog',
        confirmAction: 'Confirm action',
        cancelAction: 'Cancel action',
        deleteConfirm: 'Are you sure you want to delete this item?',
        deleteConfirmTitle: 'Confirm deletion',
        saveChanges: 'Save changes',
        discardChanges: 'Discard changes',
        unsavedChanges: 'Unsaved changes',
        leaveWithoutSaving: 'Leave without saving?',
        leaveWithoutSavingMessage: 'You have unsaved changes. Do you really want to leave?',
        lightTheme: 'Light theme',
        darkTheme: 'Dark theme',
        menu: 'Menu',
        openMenu: 'Open menu',
        closeMenu: 'Close menu'
      },
      // Setup
      setup: {
        title: 'Initial Setup',
        subtitle: 'Create your organization and the first admin Macarte account.',
        orgLabel: 'Organization',
        orgPlaceholder: 'My Company',
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        adminEmail: 'Admin email',
        passwordLabel: 'Password',
        passwordPlaceholder: '8 characters min.',
        confirmPasswordLabel: 'Confirm password',
        createButton: 'Create organization',
        creating: 'Creating...',
        success: 'Organization created successfully',
        error: 'Setup failed. Please try again.',
        alreadyConfigured: 'Already configured?'
      },
      // Home
      home: {
        hero: {
          badge: 'Business cards with QR code',
          title: 'Create your professional business card in minutes.',
          subtitle: 'Modern templates, intuitive editor, scannable QR code and print-ready export. Your card, your identity.',
          createCard: 'Create my card',
          seeTemplates: 'See templates',
          feature1: 'Scannable QR',
          feature2: 'Printable export',
          feature3: '100% responsive'
        },
        qrCard: {
          title: 'Instant scan',
          subtitle: 'Opens your digital card'
        },
        templates: {
          title: 'Templates designed to stand out',
          subtitle: 'Minimal, Corporate, Luxury, Creative, Healthcare, Technology — change style in one click.',
          allTemplates: 'All templates'
        },
        howItWorks: {
          title: 'How it works',
          subtitle: 'Three steps, no design skills required.'
        },
        steps: {
          choose: {
            title: 'Choose a template',
            text: 'Browse a gallery of professional templates or import your own card as background.'
          },
          customize: {
            title: 'Customize',
            text: 'Add text, logo, image and QR code. Move, resize and adjust each element.'
          },
          print: {
            title: 'Print or share',
            text: 'Export a print-ready file (with bleed) or share your digital card via QR.'
          }
        },
        features: {
          title: 'Everything you need for a perfect card',
          subtitle: 'Simple tools, professional result.',
          qr: {
            title: 'Scannable QR code',
            text: 'URL, phone, email or vCard — verified to remain readable when printed.'
          },
          import: {
            title: 'Import your card',
            text: 'Use your own PNG/JPG/WebP visual as background, then add your elements.'
          },
          editor: {
            title: 'Full editor',
            text: 'Font, size, bold, italic, color, alignment and spacing, live.'
          },
          export: {
            title: 'Pro export',
            text: 'High-resolution PNG and format with 3mm bleed, ready for printer.'
          },
          responsive: {
            title: 'Responsive & PWA',
            text: 'An interface designed for mobile, usable even offline.'
          },
          selfHosted: {
            title: 'Self-hostable',
            text: 'Your data stays with you. No third-party service required.'
          }
        },
        cta: {
          title: 'Ready to create your card?',
          subtitle: 'Choose a template or import your visual, add your QR code and download a print-ready file.',
          createCard: 'Create my card',
          seeTemplates: 'See templates'
        }
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
      },
      // Landing
      landing: {
        heroTitle: 'Create professional business cards with QR code',
        heroSubtitle: 'Free, easy and no account required. Get started in seconds.',
        heroDescription: 'Create your professional card, share it with one scan and download a print-ready design in PDF. Simple, fast and elegant.',
        getStarted: 'Get started',
        getStartedFree: 'Get started for free',
        seeTemplates: 'See templates',
        featuresTitle: 'Features',
        featuresSubtitle: 'Everything you need to create professional business cards.',
        howItWorksTitle: 'How it works',
        howItWorksSubtitle: 'Three simple steps to create your card.',
        templatesTitle: 'Templates',
        templatesSubtitle: 'Choose from our professional templates and customize them.',
        pricingTitle: 'Pricing',
        pricingSubtitle: 'Free for digital cards. One-time payment for high-quality exports.',
        testimonialsTitle: 'Testimonials',
        testimonialsSubtitle: 'What our users say about us.',
        faqTitle: 'FAQ',
        faqSubtitle: 'Frequently asked questions about Macarte.',
        contactTitle: 'Contact',
        contactSubtitle: 'Need help? Contact us.',
        product: 'Product',
        account: 'Account',
        organization: 'Organization',
        footerDescription: 'Create, customize and print professional business cards with QR code in minutes.',
        sourceCode: 'Source code on GitHub',
        homepage: 'Home',
        cardsAlt: 'Business cards created with MaCarte',
        digitalCard: 'Digital card',
        digitalCardDesc: 'A personal page with your contact details, links and networks, accessible everywhere.',
        qrCode: 'Integrated QR code',
        qrCodeDesc: 'Your contacts scan the code and save your information in seconds.',
        printReady: 'Print ready',
        printReadyDesc: 'Choose from our professional templates and export to PNG, SVG or PDF.'
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
