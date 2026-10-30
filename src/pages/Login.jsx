// Dans App.js, remplacez le contenu de {view === 'admin-login' && (...)} par :
{view === 'admin-login' && (
  <div className="min-h-screen flex items-center justify-center bg-main dark:bg-main-dark py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8 bg-card dark:bg-card-dark rounded-xl shadow-lifted border border-border dark:border-border-dark p-6 sm:p-8 lg:p-10 transition-all duration-200">
      
      {/* En-tête */}
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-action/10 dark:bg-action-dark/20 rounded-xl flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-action dark:text-action-dark" />
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary dark:text-text-primary-dark">Connexion à Macarte</h2>
        <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">Accédez à votre espace d'administration</p>
      </div>
        <h2 className="mt-2 text-2xl font-bold text-text-primary dark:text-text-primary-dark">Connexion à Macarte</h2>
        <p className="mt-2 text-sm text-text-muted dark:text-text-muted-dark">Accédez à votre espace d'administration</p>
      </div>

      {/* Formulaire - Utilise les fonctions handleLogin et checkAuth existantes */}
      <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="rounded-md space-y-4">
          
          {/* Champ Email */}
          <div className="relative">
            <label htmlFor="login-email" className="ui-label">Adresse email</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-text-muted-dark" />
            </div>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input w-full rounded-lg border border-border dark:border-border-dark bg-input-bg dark:bg-input-bg-dark text-text-primary dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-focus-ring/50 dark:focus:ring-focus-ring-dark/50 focus:border-action dark:focus:border-action-dark transition-all"
              placeholder="vous@exemple.com"
              autoFocus
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative">
            <label htmlFor="login-password" className="ui-label">Mot de passe</label>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-text-muted-dark" />
            </div>
            <PasswordField
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-error-bg dark:bg-error-bg-dark text-error-text dark:text-error-text-dark text-sm p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* Bouton de soumission */}
        <div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block w-full rounded-lg bg-action dark:bg-action-dark text-white hover:bg-action-hover dark:hover:bg-action-hover-dark transition-all"
          >
            {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isLoggingIn ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </form>

      {/* Liens supplémentaires */}
      <div className="mt-6 text-center text-sm">
        <p className="text-text-muted dark:text-text-muted-dark">
          Nouveau sur Macarte ?{' '}
          <a href="/register" className="font-medium text-action dark:text-action-dark hover:text-action-dark transition-colors">
            Créer un compte
          </a>
        </p>
      </div>

      {forgotMode ? (
        <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
          <div>
            <label htmlFor="forgot-email" className="ui-label">Adresse email</label>
            <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" className="ui-input" required />
          </div>
          {error && (
            <div className="rounded-md bg-error-bg dark:bg-error-bg-dark text-error-text dark:text-error-text-dark text-sm px-3 py-2.5">{error}</div>
          )}
          {forgotMessage && (
            <div className="rounded-md bg-success-bg dark:bg-success-bg-dark text-success-text dark:text-success-text-dark text-sm px-3 py-2.5">{forgotMessage}</div>
          )}
          <button type="submit" className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block w-full">Envoyer le lien</button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="ui-label">Email</label>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" className="ui-input" autoFocus required />
          </div>
          <div>
            <label htmlFor="login-password" className="ui-label">Mot de passe</label>
            <PasswordField
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>
          {error && (
            <div className="rounded-md bg-error-bg dark:bg-error-bg-dark text-error-text dark:text-error-text-dark text-sm px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
            </div>
          )}
          <button type="submit" disabled={isLoggingIn} className="ui-btn ui-btn-primary ui-btn-lg ui-btn-block w-full">
            {isLoggingIn && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isLoggingIn ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      )}
    </div>
  </div>
)}