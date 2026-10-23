// Dans App.js, remplacez le contenu de {view === 'admin-login' && (...)} par :
{view === 'admin-login' && (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
      
      {/* En-tête */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
          Connexion à Macarte
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Accédez à votre espace d'administration
        </p>
      </div>

      {/* Formulaire - Utilise les fonctions handleLogin et checkAuth existantes */}
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="rounded-md shadow-sm space-y-4">
          
          {/* Champ Email */}
          <div className="relative">
            <label htmlFor="email-address" className="sr-only">Adresse email</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder="Adresse email"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
              placeholder="Mot de passe"
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Bouton de soumission */}
        <div>
          <button
            type="submit"
            disabled={isSettingUp || isSaving} // Utilisez vos états de chargement existants
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSettingUp ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin"/> Connexion en cours...</span>
            ) : (
              <span className="flex items-center gap-2">
                Se connecter <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Liens supplémentaires - À ajouter seulement si vous créez ces routes */}
      <div className="flex flex-col items-center space-y-3 mt-6 text-sm border-t border-gray-200 dark:border-gray-700 pt-6">
        <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
          Pas encore de compte ? S'inscrire
        </Link>
        <Link to="/reset-password" className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">
          Mot de passe oublié ?
        </Link>
      </div>
    </div>
  </div>
)}