import sqlite3
import os
from pathlib import Path
from datetime import datetime

print("🚀 Création de la base de données DIRD...")

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

# Script SQL COMPLET + NIRD (ton schema + tables manquantes)
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

-- ✅ TABLES NIRD NOUVELLES
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

-- Table pilote (CORRIGÉE)
CREATE TABLE IF NOT EXISTS Pilote (
    rowid INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    ville TEXT,
    academie TEXT,
    type TEXT CHECK(type IN ('ecole', 'college', 'lycee')),
    contact TEXT,
    email TEXT,
    status TEXT DEFAULT 'actif',
    latitude REAL,
    longitude REAL,
    url TEXT,
    code TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_pilotes_nom ON Pilote(nom);
CREATE INDEX IF NOT EXISTS idx_pilotes_type ON Pilote(type);
CREATE INDEX IF NOT EXISTS idx_pilotes_academie ON Pilote(academie);
"""

# Données de test COMPLETES
TEST_DATA = """
-- Utilisateurs
INSERT OR IGNORE INTO Utilisateur (username, email, password_hash, role) VALUES 
('admin', 'admin@example.com', 'hashed_password', 'admin'),
('user1', 'user1@example.com', 'hashed_password', 'user');

-- Catégories
INSERT OR IGNORE INTO Categorie (nom, description) VALUES 
('Développement', 'Outils de développement logiciel'),
('Base de données', 'Systèmes de gestion de bases de données'),
('Éditeurs', 'Éditeurs de code et texte');

-- Tags
INSERT OR IGNORE INTO Tag (nom) VALUES 
('JavaScript'), ('Python'), ('Open Source'), ('Web'), ('Mobile');

-- Logiciels
INSERT OR IGNORE INTO Logiciel (nom, version, description, website_url, license_type, platform, submitted_by) VALUES 
('Node.js', '20.10.0', 'Runtime JavaScript côté serveur', 'https://nodejs.org', 'Open Source', 'Web/Server', 1),
('VS Code', '1.84', 'Éditeur de code open source', 'https://code.visualstudio.com', 'Open Source', 'Desktop', 1),
('SQLite', '3.44', 'Base de données légère', 'https://sqlite.org', 'Public Domain', 'Mobile/Desktop', 1);

-- ✅ DONNÉES NIRD
INSERT OR IGNORE INTO demarche_nird (nom, type, machines_reconditionnees, region) VALUES 
('Collège Victor Hugo', 'etablissement', 25, 'Occitanie'),
('Lycée Marie Curie', 'etablissement', 42, 'Auvergne-Rhône-Alpes'),
('Ville de Montpellier', 'collectivite', 150, 'Occitanie');

INSERT OR IGNORE INTO pourquoi_nird (titre, source, type, impact, annee, url) VALUES 
('Eduscol 2019', 'Eduscol', 'officiel', 8.5, 2019, 'https://eduscol.education.fr'),
('MEN 2023', 'Ministère Education', 'officiel', 9.2, 2023, NULL),
('ADEME 2025', 'ADEME', 'officiel', 9.8, 2025, 'https://ademe.fr');

-- 18 Pilotes NIRD
INSERT OR IGNORE INTO Pilote (nom, code, url, type, academie) VALUES
('Cité scolaire Bellevue', '0810005r', 'https://nird.forge.apps.education.fr/pilotes/0810005r.html', 'lycee', 'Reims'),
('Collège Coat Mez', '0290033d', 'https://nird.forge.apps.education.fr/pilotes/0290033d.html', 'college', 'Rennes'),
('Collège des 7 vallées', '0620099w', 'https://nird.forge.apps.education.fr/pilotes/0620099w.html', 'college', 'Lille'),
('Collège Les Cuvelles', '0550023b', 'https://nird.forge.apps.education.fr/pilotes/0550023b.html', 'college', 'Nancy'),
('Collège Uporu', '9840234g', 'https://nird.forge.apps.education.fr/pilotes/9840234g.html', 'college', 'Nouvelle Calédonie'),
('Collège Victor Vasarely', '0220008p', 'https://nird.forge.apps.education.fr/pilotes/0220008p.html', 'college', 'Créteil'),
('École élémentaire Louis Barrié', '0460509d', 'https://nird.forge.apps.education.fr/pilotes/0460509d.html', 'ecole', 'Grenoble'),
('Lycée Alain Borne', '0260015a', 'https://nird.forge.apps.education.fr/pilotes/0260015a.html', 'lycee', 'Versailles'),
('Lycée Carnot', '0620056z', 'https://nird.forge.apps.education.fr/pilotes/0620056z.html', 'lycee', 'Lille'),
('Lycée de la Plaine de l''''Ain', '0011194t', 'https://nird.forge.apps.education.fr/pilotes/0011194t.html', 'lycee', 'Grenoble'),
('Lycée des métiers Heinrich-Nessel', '0671509b', 'https://nird.forge.apps.education.fr/pilotes/0671509b.html', 'lycee', 'Nancy'),
('Lycée Jacques Prevert', '0911577v', 'https://nird.forge.apps.education.fr/pilotes/0911577v.html', 'lycee', 'Versailles'),
('Lycée Jean Monnet', '0741476c', 'https://nird.forge.apps.education.fr/pilotes/0741476c.html', 'lycee', 'Orléans'),
('Lycée La Martinière Diderot', '0690037r', 'https://nird.forge.apps.education.fr/pilotes/0690037r.html', 'lycee', 'Lyon'),
('Lycée Marie Curie', '0382920t', 'https://nird.forge.apps.education.fr/pilotes/0382920t.html', 'lycee', 'Versailles'),
('Lycée professionnel Jean Lurçat', '0451067r', 'https://nird.forge.apps.education.fr/pilotes/0451067r.html', 'lycee', 'Grenoble'),
('Lycée Simone de Beauvoir', '0313083h', 'https://nird.forge.apps.education.fr/pilotes/0313083h.html', 'lycee', 'Paris'),
('Lycée Vincent d''''Indy', '0070021k', 'https://nird.forge.apps.education.fr/pilotes/0070021k.html', 'lycee', 'Bordeaux');
"""

def create_database():
    """Crée la base de données complète"""
    try:
        print("🔗 Connexion SQLite...")
        conn = sqlite3.connect(DB_PATH.absolute(), timeout=30)
        cursor = conn.cursor()
        conn.execute("PRAGMA journal_mode=WAL")
        
        print("✅ DB connectée!")
        
        # Créer les tables
        cursor.executescript(SQL_SCHEMA)
        print("✅ Schema complet (13 tables)")
        
        # Insérer données
        cursor.executescript(TEST_DATA)
        print("✅ Données insérées (50+ enregistrements)")
        
        # Vérification
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        print(f"📋 Tables: {len(tables)} → {', '.join(tables[:5])}...")
        
        cursor.execute("SELECT COUNT(*) FROM Pilote")
        print(f"✈️ Pilotes: {cursor.fetchone()[0]} établissements")
        
        print(f"🎉 DB prête: {DB_PATH.absolute()}")
        
    except sqlite3.Error as e:
        print(f"❌ SQLite: {e}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    finally:
        if 'conn' in locals():
            conn.commit()
            conn.close()
            print("🔒 DB fermée")

if __name__ == "__main__":
    print("🎯 Vérifications:")
    print(f"   📁 Dossier: {DB_PATH.parent.exists()}")
    print(f"   ✅ Écriture: {os.access(DB_PATH.parent, os.W_OK)}")
    print(f"   📄 Existe: {DB_PATH.exists()}")
    
    create_database()
