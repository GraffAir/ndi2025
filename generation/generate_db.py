import sqlite3
import os
from pathlib import Path
from datetime import datetime

print("🚀 Création de la base de données NIRD...")

# ✅ CHEMIN ABSOLU CORRIGÉ
BASE_DIR = Path(__file__).parent.parent  # generation/ → racine NDI/SITE
DB_PATH = BASE_DIR / "serveur" / "database.db"

print(f"📁 Projet root: {BASE_DIR.absolute()}")
print(f"📄 DB cible: {DB_PATH.absolute()}")

# ✅ CRÉER DOSSIERS + VÉRIFIER PERMISSIONS
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

if not os.access(DB_PATH.parent, os.W_OK):
    print("❌ ERREUR: Pas de permission d'écriture!")
    exit(1)

# Script SQL COMPLET + NIRD
SQL_SCHEMA = """
-- Table Utilisateur
CREATE TABLE IF NOT EXISTS Utilisateur (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Logiciel
CREATE TABLE IF NOT EXISTS Logiciel (
    software_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    version TEXT,
    description TEXT,
    website_url TEXT,
    license_type TEXT,
    platform TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    submitted_by INTEGER,
    FOREIGN KEY (submitted_by) REFERENCES Utilisateur(user_id)
);

-- Table Categorie
CREATE TABLE IF NOT EXISTS Categorie (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Table Tag
CREATE TABLE IF NOT EXISTS Tag (
    tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL UNIQUE
);

-- Table Avis
CREATE TABLE IF NOT EXISTS Avis (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    software_id INTEGER NOT NULL,
    note INTEGER CHECK(note >= 1 AND note <= 5),
    titre TEXT,
    commentaire TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateur(user_id),
    FOREIGN KEY (software_id) REFERENCES Logiciel(software_id)
);

-- Table Favori
CREATE TABLE IF NOT EXISTS Favori (
    favorite_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    software_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateur(user_id),
    FOREIGN KEY (software_id) REFERENCES Logiciel(software_id),
    UNIQUE(user_id, software_id)
);

-- Table Historique
CREATE TABLE IF NOT EXISTS Historique (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    software_id INTEGER NOT NULL,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Utilisateur(user_id),
    FOREIGN KEY (software_id) REFERENCES Logiciel(software_id)
);

-- Table LogicielTag (N-N)
CREATE TABLE IF NOT EXISTS LogicielTag (
    software_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (software_id, tag_id),
    FOREIGN KEY (software_id) REFERENCES Logiciel(software_id),
    FOREIGN KEY (tag_id) REFERENCES Tag(tag_id)
);

-- Table LogicielCategorie (N-N)
CREATE TABLE IF NOT EXISTS LogicielCategorie (
    software_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (software_id, category_id),
    FOREIGN KEY (software_id) REFERENCES Logiciel(software_id),
    FOREIGN KEY (category_id) REFERENCES Categorie(category_id)
);

-- ✅ TABLES NIRD
CREATE TABLE IF NOT EXISTS demarche_nird (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT CHECK(type IN ('etablissement', 'collectivite')),
    machines_reconditionnees INTEGER DEFAULT 0,
    region TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pourquoi_nird (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    source TEXT,
    type TEXT CHECK(type IN ('officiel', 'collectivite', 'autre')),
    impact REAL DEFAULT 0,
    annee INTEGER,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table Pilote COMPLÈTE avec GPS
CREATE TABLE IF NOT EXISTS Pilote (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    code TEXT UNIQUE,
    ville TEXT,
    academie TEXT,
    type TEXT CHECK(type IN ('ecole', 'college', 'lycee')),
    contact TEXT,
    email TEXT,
    status TEXT DEFAULT 'actif',
    latitude REAL,
    longitude REAL,
    url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_pilotes_nom ON Pilote(nom);
CREATE INDEX IF NOT EXISTS idx_pilotes_type ON Pilote(type);
CREATE INDEX IF NOT EXISTS idx_pilotes_academie ON Pilote(academie);
CREATE INDEX IF NOT EXISTS idx_pilotes_code ON Pilote(code);
"""

# ✅ Données de test COMPLETES avec GPS
TEST_DATA = """
-- Utilisateurs
INSERT OR IGNORE INTO Utilisateur (username, email, password_hash, role) VALUES 
('admin', 'admin@nird.fr', '$2b$10$hashed', 'admin'),
('user1', 'user1@example.com', '$2b$10$hashed', 'user');

-- Catégories
INSERT OR IGNORE INTO Categorie (nom, description) VALUES 
('Développement', 'Outils de développement logiciel'),
('Base de données', 'Systèmes de gestion de bases de données'),
('Éditeurs', 'Éditeurs de code et texte'),
('Bureautique', 'Outils de productivité');

-- Tags
INSERT OR IGNORE INTO Tag (nom) VALUES 
('JavaScript'), ('Python'), ('Open Source'), ('Web'), ('Mobile'), ('Education'), ('Linux');

-- Logiciels
INSERT OR IGNORE INTO Logiciel (nom, version, description, website_url, license_type, platform, submitted_by) VALUES 
('Node.js', '20.10.0', 'Runtime JavaScript côté serveur', 'https://nodejs.org', 'Open Source', 'Web/Server', 1),
('VS Code', '1.84', 'Éditeur de code open source', 'https://code.visualstudio.com', 'Open Source', 'Desktop', 1),
('SQLite', '3.44', 'Base de données légère', 'https://sqlite.org', 'Public Domain', 'Mobile/Desktop', 1),
('LibreOffice', '7.6', 'Suite bureautique libre', 'https://libreoffice.org', 'Open Source', 'Desktop', 1);

-- ✅ DONNÉES NIRD
INSERT OR IGNORE INTO demarche_nird (nom, type, machines_reconditionnees, region) VALUES 
('Collège Victor Hugo', 'etablissement', 25, 'Occitanie'),
('Lycée Marie Curie', 'etablissement', 42, 'Auvergne-Rhône-Alpes'),
('Ville de Montpellier', 'collectivite', 150, 'Occitanie'),
('Département du Rhône', 'collectivite', 320, 'Auvergne-Rhône-Alpes');

INSERT OR IGNORE INTO pourquoi_nird (titre, source, type, impact, annee, url) VALUES 
('Référentiel Eduscol 2019', 'Eduscol', 'officiel', 8.5, 2019, 'https://eduscol.education.fr'),
('Circulaire MEN 2023', 'Ministère Education Nationale', 'officiel', 9.2, 2023, NULL),
('Rapport ADEME 2025', 'ADEME', 'officiel', 9.8, 2025, 'https://ademe.fr');

-- ✅ 18 Pilotes NIRD COMPLETS avec coordonnées GPS
INSERT OR IGNORE INTO Pilote (nom, code, url, type, ville, academie, latitude, longitude, status) VALUES
('Cité scolaire Bellevue', '0810005r', 'https://nird.forge.apps.education.fr/pilotes/0810005r.html', 'lycee', 'Albi', 'Toulouse', 43.9298, 2.1480, 'actif'),
('Collège Coat Mez', '0290033d', 'https://nird.forge.apps.education.fr/pilotes/0290033d.html', 'college', 'Daoulas', 'Rennes', 48.3603, -4.2608, 'actif'),
('Collège des 7 vallées', '0620099w', 'https://nird.forge.apps.education.fr/pilotes/0620099w.html', 'college', 'Hesdin', 'Lille', 50.3742, 2.0386, 'actif'),
('Collège Les Cuvelles', '0550023b', 'https://nird.forge.apps.education.fr/pilotes/0550023b.html', 'college', 'Vaucouleurs', 'Nancy-Metz', 48.6023, 5.6641, 'actif'),
('Collège Uporu', '9840234g', 'https://nird.forge.apps.education.fr/pilotes/9840234g.html', 'college', 'Bourail', 'Nouvelle-Calédonie', -21.5702, 165.4829, 'actif'),
('Collège Victor Vasarely', '0220008p', 'https://nird.forge.apps.education.fr/pilotes/0220008p.html', 'college', 'Ploufragan', 'Rennes', 48.4912, -2.7927, 'actif'),
('École élémentaire Louis Barrié', '0460509d', 'https://nird.forge.apps.education.fr/pilotes/0460509d.html', 'ecole', 'Cahors', 'Toulouse', 44.4479, 1.4406, 'actif'),
('Lycée Alain Borne', '0260015a', 'https://nird.forge.apps.education.fr/pilotes/0260015a.html', 'lycee', 'Montélimar', 'Grenoble', 44.5586, 4.7517, 'actif'),
('Lycée Carnot', '0620056z', 'https://nird.forge.apps.education.fr/pilotes/0620056z.html', 'lycee', 'Bruay-la-Buissière', 'Lille', 50.4838, 2.5532, 'actif'),
('Lycée de la Plaine de l''Ain', '0011194t', 'https://nird.forge.apps.education.fr/pilotes/0011194t.html', 'lycee', 'Ambérieu-en-Bugey', 'Lyon', 45.9606, 5.3597, 'actif'),
('Lycée des métiers Heinrich-Nessel', '0671509b', 'https://nird.forge.apps.education.fr/pilotes/0671509b.html', 'lycee', 'Haguenau', 'Strasbourg', 48.8156, 7.7895, 'actif'),
('Lycée Jacques Prevert', '0911577v', 'https://nird.forge.apps.education.fr/pilotes/0911577v.html', 'lycee', 'Longjumeau', 'Versailles', 48.6952, 2.2959, 'actif'),
('Lycée Jean Monnet', '0741476c', 'https://nird.forge.apps.education.fr/pilotes/0741476c.html', 'lycee', 'Annemasse', 'Grenoble', 46.1949, 6.2372, 'actif'),
('Lycée La Martinière Diderot', '0690037r', 'https://nird.forge.apps.education.fr/pilotes/0690037r.html', 'lycee', 'Lyon', 'Lyon', 45.7640, 4.8357, 'actif'),
('Lycée Marie Curie', '0382920t', 'https://nird.forge.apps.education.fr/pilotes/0382920t.html', 'lycee', 'Échirolles', 'Grenoble', 45.1437, 5.7156, 'actif'),
('Lycée professionnel Jean Lurçat', '0451067r', 'https://nird.forge.apps.education.fr/pilotes/0451067r.html', 'lycee', 'Fleury-les-Aubrais', 'Orléans-Tours', 47.9340, 1.9167, 'actif'),
('Lycée Simone de Beauvoir', '0313083h', 'https://nird.forge.apps.education.fr/pilotes/0313083h.html', 'lycee', 'Garges-lès-Gonesse', 'Créteil', 48.9733, 2.4018, 'actif'),
('Lycée Vincent d''Indy', '0070021k', 'https://nird.forge.apps.education.fr/pilotes/0070021k.html', 'lycee', 'Privas', 'Grenoble', 44.7354, 4.5996, 'actif');
"""

def create_database():
    """Crée la base de données complète"""
    try:
        print("🔗 Connexion SQLite...")
        conn = sqlite3.connect(str(DB_PATH.absolute()), timeout=30)
        cursor = conn.cursor()
        conn.execute("PRAGMA journal_mode=WAL")
        
        print("✅ DB connectée!")
        
        # Créer les tables
        print("📝 Création du schéma...")
        cursor.executescript(SQL_SCHEMA)
        print("✅ Schema complet (13 tables)")
        
        # Insérer données
        print("📦 Insertion des données...")
        cursor.executescript(TEST_DATA)
        print("✅ Données insérées")
        
        # Vérification complète
        print("\n🔍 VÉRIFICATION:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"📋 Tables créées: {len(tables)}")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   ✓ {table}: {count} enregistrements")
        
        # Stats Pilotes détaillées
        print("\n🏫 STATISTIQUES PILOTES:")
        cursor.execute("SELECT type, COUNT(*) as count FROM Pilote GROUP BY type")
        for row in cursor.fetchall():
            print(f"   {row[0]}: {row[1]}")
        
        cursor.execute("SELECT COUNT(*) FROM Pilote WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
        geo_count = cursor.fetchone()[0]
        print(f"   🗺️ Géolocalisés: {geo_count}")
        
        print(f"\n🎉 DB prête: {DB_PATH.absolute()}")
        print(f"📏 Taille: {DB_PATH.stat().st_size / 1024:.2f} KB")
        
    except sqlite3.Error as e:
        print(f"❌ SQLite Error: {e}")
        raise
    except Exception as e:
        print(f"❌ Erreur: {e}")
        raise
    finally:
        if 'conn' in locals():
            conn.commit()
            conn.close()
            print("🔒 DB fermée proprement")

if __name__ == "__main__":
    print("🎯 Vérifications préalables:")
    print(f"   📁 Dossier existe: {DB_PATH.parent.exists()}")
    print(f"   ✅ Permission écriture: {os.access(DB_PATH.parent, os.W_OK)}")
    print(f"   📄 DB existe déjà: {DB_PATH.exists()}")
    
    if DB_PATH.exists():
        response = input("\n⚠️  database.db existe déjà. Écraser? (y/N): ")
        if response.lower() != 'y':
            print("❌ Opération annulée")
            exit(0)
        DB_PATH.unlink()
        print("🗑️  Ancienne DB supprimée")
    
    print("\n" + "="*50)
    create_database()
    print("="*50 + "\n")
