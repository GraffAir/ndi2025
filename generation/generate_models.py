import sqlite3
from pathlib import Path
import sys

def generate_models_from_db(db_path='./serveur/database.db'):
    """Lit la DB et génère les models Node.js PURE JS (sans @ pour éviter erreurs TS)"""
    
    print("🔍 Analyse de la base de données...")
    print(f"   📂 DB path: {db_path}")
    
    if not Path(db_path).exists():
        print(f"❌ DB introuvable: {db_path}")
        return
    
    print("✅ DB trouvée, connexion...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Récupérer toutes les tables (exclut sqlite_*)
    print("📋 Récupération des tables...")
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print(f"   📊 {len(tables)} table(s) trouvée(s): {tables}")
    
    if not tables:
        print("❌ Aucune table trouvée dans la DB")
        conn.close()
        return
    
    models_dir = Path('./src/models')
    models_dir.mkdir(parents=True, exist_ok=True)
    
    for table_name in tables:
        print(f"\n📝 Génération model '{table_name}'...")
        
        # Récupérer colonnes + types
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print(f"   📏 {len(columns)} colonne(s)")
        
        # PK column
        pk_col = next((col[1] for col in columns if col[5]), 'rowid')
        print(f"   🗝️  PK: '{pk_col}'")
        
        # Nom classe capitalisé
        class_name = table_name[0].upper() + table_name[1:]
        print(f"   🏷️  Classe: '{class_name}Model'")
        
        # ✅ JS PURE - AUCUN @ (évite erreurs TS)
        model_code = f"""// Model {table_name.title()} (auto-généré depuis DB)
// ✅ Compatible TypeScript/VSCode - Utilisez @aliases dans CONTROLLERS seulement

const sqlite3 = require('sqlite3').verbose();

class {class_name}Model {{
  constructor(dbPath = 'C:/Users/maxim/Desktop/NDI/SITE/serveur/database.db') {{
    this.tableName = '{table_name}';
    this.db = new sqlite3.Database(dbPath);
    console.log(`🗄️ ${{this.tableName}} DB connectée`);
  }}

  // 🔢 Compter
  count() {{
    return new Promise((resolve, reject) => {{
      this.db.get(`SELECT COUNT(*) as count FROM ${{this.tableName}}`, (err, row) => {{
        if (err) reject(err);
        else resolve(row?.count || 0);
      }});
    }});
  }}

  // 📋 Liste paginée
  findAll(limit = 50, offset = 0) {{
    return new Promise((resolve, reject) => {{
      this.db.all(`SELECT * FROM ${{this.tableName}} LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {{
        if (err) reject(err);
        else resolve(rows || []);
      }});
    }});
  }}

  // 🔍 Par ID
  findById(id) {{
    return new Promise((resolve, reject) => {{
      this.db.get(`SELECT * FROM ${{this.tableName}} WHERE {pk_col} = ?`, [id], (err, row) => {{
        if (err) reject(err);
        else resolve(row);
      }});
    }});
  }}

  // 🔎 Recherche
  search(query, limit = 20) {{
    return new Promise((resolve, reject) => {{
      this.db.all(`SELECT * FROM ${{this.tableName}} WHERE nom LIKE ? OR description LIKE ? LIMIT ?`, 
        [`%${{query}}%`, `%${{query}}%`, limit], (err, rows) => {{
        if (err) reject(err);
        else resolve(rows || []);
      }});
    }});
  }}

  // ➕ Créer
  create(data) {{
    return new Promise((resolve, reject) => {{
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);
      
      this.db.run(
        `INSERT INTO ${{this.tableName}} (${{columns.join(', ')}}) VALUES (${{placeholders}})`,
        values,
        function(err) {{
          if (err) reject(err);
          else resolve({{ success: true, id: this.lastID }});
        }}
      );
    }});
  }}

  // ✏️ Update
  update(id, data) {{
    return new Promise((resolve, reject) => {{
      const setClause = Object.keys(data).map(k => `${{k}} = ?`).join(', ');
      const values = Object.values(data).concat(id);
      
      this.db.run(
        `UPDATE ${{this.tableName}} SET ${{setClause}} WHERE rowid = ?`,
        values,
        function(err) {{
          if (err) reject(err);
          else resolve({{ success: true, changes: this.changes }});
        }}
      );
    }});
  }}

  // 🗑️ Delete
  delete(id) {{
    return new Promise((resolve, reject) => {{
      this.db.run(`DELETE FROM ${{this.tableName}} WHERE rowid = ?`, [id], function(err) {{
        if (err) reject(err);
        else resolve({{ success: true, changes: this.changes }});
      }});
    }});
  }}

  close() {{
    if (this.db) {{
      this.db.close();
      this.db = null;
    }}
  }}
}};

module.exports = {class_name}Model;
"""
        
        file_path = models_dir / f"{table_name}.js"
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(model_code)
        print(f"   ✅ {file_path.name} créé ({len(model_code)} chars)")
    
    conn.close()
    print("\n🎉 TOUS les models générés SANS ERREURS TS !")
    print("📁 Utilisez @users, @softsCtrl dans les CONTROLLERS")
    print(f"📂 Dossier: {models_dir.absolute()}")

if __name__ == "__main__":
    print("🚀 Lancement générateur de models (JS PURE)...")
    db_path = sys.argv[1] if len(sys.argv) > 1 else 'C:/Users/maxim/Desktop/NDI/SITE/serveur/database.db'
    print(f"📂 DB: {db_path}")
    generate_models_from_db(db_path)
import sqlite3
from pathlib import Path
import sys

def generate_models_from_db(db_path='./serveur/database.db'):
    """Lit la DB et génère les models Node.js PURE JS (sans @ pour éviter erreurs TS)"""
    
    print("🔍 Analyse de la base de données...")
    print(f"   📂 DB path: {db_path}")
    
    if not Path(db_path).exists():
        print(f"❌ DB introuvable: {db_path}")
        return
    
    print("✅ DB trouvée, connexion...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Récupérer toutes les tables (exclut sqlite_*)
    print("📋 Récupération des tables...")
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print(f"   📊 {len(tables)} table(s) trouvée(s): {tables}")
    
    if not tables:
        print("❌ Aucune table trouvée dans la DB")
        conn.close()
        return
    
    models_dir = Path('./src/models')
    models_dir.mkdir(parents=True, exist_ok=True)
    
    for table_name in tables:
        print(f"\n📝 Génération model '{table_name}'...")
        
        # Récupérer colonnes + types
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        print(f"   📏 {len(columns)} colonne(s)")
        
        # PK column
        pk_col = next((col[1] for col in columns if col[5]), 'rowid')
        print(f"   🗝️  PK: '{pk_col}'")
        
        # Nom classe capitalisé
        class_name = table_name[0].upper() + table_name[1:]
        print(f"   🏷️  Classe: '{class_name}Model'")
        
        # ✅ JS PURE - AUCUN @ (évite erreurs TS)
        model_code = f"""// Model {table_name.title()} (auto-généré depuis DB)
// ✅ Compatible TypeScript/VSCode - Utilisez @aliases dans CONTROLLERS seulement

const sqlite3 = require('sqlite3').verbose();

class {class_name}Model {{
  constructor(dbPath = 'C:/Users/maxim/Desktop/NDI/SITE/serveur/database.db') {{
    this.tableName = '{table_name}';
    this.db = new sqlite3.Database(dbPath);
    console.log(`🗄️ ${{this.tableName}} DB connectée`);
  }}

  // 🔢 Compter
  count() {{
    return new Promise((resolve, reject) => {{
      this.db.get(`SELECT COUNT(*) as count FROM ${{this.tableName}}`, (err, row) => {{
        if (err) reject(err);
        else resolve(row?.count || 0);
      }});
    }});
  }}

  // 📋 Liste paginée
  findAll(limit = 50, offset = 0) {{
    return new Promise((resolve, reject) => {{
      this.db.all(`SELECT * FROM ${{this.tableName}} LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {{
        if (err) reject(err);
        else resolve(rows || []);
      }});
    }});
  }}

  // 🔍 Par ID
  findById(id) {{
    return new Promise((resolve, reject) => {{
      this.db.get(`SELECT * FROM ${{this.tableName}} WHERE {pk_col} = ?`, [id], (err, row) => {{
        if (err) reject(err);
        else resolve(row);
      }});
    }});
  }}

  // 🔎 Recherche
  search(query, limit = 20) {{
    return new Promise((resolve, reject) => {{
      this.db.all(`SELECT * FROM ${{this.tableName}} WHERE nom LIKE ? OR description LIKE ? LIMIT ?`, 
        [`%${{query}}%`, `%${{query}}%`, limit], (err, rows) => {{
        if (err) reject(err);
        else resolve(rows || []);
      }});
    }});
  }}

  // ➕ Créer
  create(data) {{
    return new Promise((resolve, reject) => {{
      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = columns.map(col => data[col]);
      
      this.db.run(
        `INSERT INTO ${{this.tableName}} (${{columns.join(', ')}}) VALUES (${{placeholders}})`,
        values,
        function(err) {{
          if (err) reject(err);
          else resolve({{ success: true, id: this.lastID }});
        }}
      );
    }});
  }}

  // ✏️ Update
  update(id, data) {{
    return new Promise((resolve, reject) => {{
      const setClause = Object.keys(data).map(k => `${{k}} = ?`).join(', ');
      const values = Object.values(data).concat(id);
      
      this.db.run(
        `UPDATE ${{this.tableName}} SET ${{setClause}} WHERE rowid = ?`,
        values,
        function(err) {{
          if (err) reject(err);
          else resolve({{ success: true, changes: this.changes }});
        }}
      );
    }});
  }}

  // 🗑️ Delete
  delete(id) {{
    return new Promise((resolve, reject) => {{
      this.db.run(`DELETE FROM ${{this.tableName}} WHERE rowid = ?`, [id], function(err) {{
        if (err) reject(err);
        else resolve({{ success: true, changes: this.changes }});
      }});
    }});
  }}

  close() {{
    if (this.db) {{
      this.db.close();
      this.db = null;
    }}
  }}
}};

module.exports = {class_name}Model;
"""
        
        file_path = models_dir / f"{table_name}.js"
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(model_code)
        print(f"   ✅ {file_path.name} créé ({len(model_code)} chars)")
    
    conn.close()
    print("\n🎉 TOUS les models générés SANS ERREURS TS !")
    print("📁 Utilisez @users, @softsCtrl dans les CONTROLLERS")
    print(f"📂 Dossier: {models_dir.absolute()}")

if __name__ == "__main__":
    print("🚀 Lancement générateur de models (JS PURE)...")
    db_path = sys.argv[1] if len(sys.argv) > 1 else 'C:/Users/maxim/Desktop/NDI/SITE/serveur/database.db'
    print(f"📂 DB: {db_path}")
    generate_models_from_db(db_path)
