const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');

// Vérifier si la base de données existe
const dbPath = './data/cards.db';
if (!fs.existsSync(dbPath)) {
    console.error(`❌ Erreur: Le fichier de base de données n'existe pas à l'emplacement: ${dbPath}`);
    process.exit(1);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('🔒 Entrez le nouveau mot de passe pour tous les utilisateurs: ', (password) => {
    if (!password || password.length < 6) {
        console.log('⚠️ Le mot de passe doit contenir au moins 6 caractères.');
        rl.close();
        return;
    }

    const db = new sqlite3.Database(dbPath);

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('❌ Erreur lors du hachage du mot de passe:', err);
            db.close();
            rl.close();
            return;
        }

        const sql = `UPDATE users SET password_hash = ?`;
        
        db.run(sql, [hash], function(err) {
            if (err) {
                console.error('❌ Erreur lors de la mise à jour de la base de données:', err);
            } else {
                console.log('\n----------------------------------------');
                console.log(`✅ SUCCÈS !`);
                console.log(`👤 ${this.changes} utilisateur(s) mis à jour.`);
                console.log(`🔑 Nouveau mot de passe commun : ${password}`);
                console.log('----------------------------------------\n');
            }
            db.close();
            rl.close();
        });
    });
});