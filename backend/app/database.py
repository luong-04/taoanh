"""
SQLite Database and ORM / Helper Layer for POD Design Studio.
Stores artworks, mockups, generation metadata, and local settings.
"""
import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "studio.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Artworks table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS artworks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        state_code TEXT NOT NULL,
        state_name TEXT NOT NULL,
        theme TEXT NOT NULL,
        design_style TEXT NOT NULL,
        slogan TEXT NOT NULL,
        product_color TEXT NOT NULL,
        prompt TEXT NOT NULL,
        negative_prompt TEXT NOT NULL,
        provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        original_image_path TEXT,
        transparent_image_path TEXT,
        preview_url TEXT NOT NULL,
        width INTEGER DEFAULT 4500,
        height INTEGER DEFAULT 5400,
        dpi INTEGER DEFAULT 300,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Mockups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mockups (
        id TEXT PRIMARY KEY,
        artwork_id TEXT,
        title TEXT NOT NULL,
        target_state TEXT NOT NULL,
        garment_color TEXT NOT NULL,
        model_gender TEXT NOT NULL,
        model_age TEXT NOT NULL,
        model_vibe TEXT NOT NULL,
        environment TEXT NOT NULL,
        aspect_ratio TEXT DEFAULT '4:5',
        provider TEXT NOT NULL,
        mockup_image_path TEXT NOT NULL,
        preview_url TEXT NOT NULL,
        metadata_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
    )
    """)
    
    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()

# Database Helper Functions
def save_artwork(artwork_data: Dict[str, Any]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO artworks (
        id, title, state_code, state_name, theme, design_style, slogan,
        product_color, prompt, negative_prompt, provider, model_name,
        original_image_path, transparent_image_path, preview_url,
        width, height, dpi, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        artwork_data["id"],
        artwork_data["title"],
        artwork_data["state_code"],
        artwork_data["state_name"],
        artwork_data["theme"],
        artwork_data["design_style"],
        artwork_data["slogan"],
        artwork_data["product_color"],
        artwork_data["prompt"],
        artwork_data["negative_prompt"],
        artwork_data["provider"],
        artwork_data["model_name"],
        artwork_data.get("original_image_path"),
        artwork_data.get("transparent_image_path"),
        artwork_data["preview_url"],
        artwork_data.get("width", 4500),
        artwork_data.get("height", 5400),
        artwork_data.get("dpi", 300),
        json.dumps(artwork_data.get("metadata", {})),
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return artwork_data["id"]

def get_all_artworks(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM artworks ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    artworks = []
    for row in rows:
        item = dict(row)
        if item.get("metadata_json"):
            try:
                item["metadata"] = json.loads(item["metadata_json"])
            except Exception:
                item["metadata"] = {}
        artworks.append(item)
    conn.close()
    return artworks

def get_artwork_by_id(artwork_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM artworks WHERE id = ?", (artwork_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    if item.get("metadata_json"):
        try:
            item["metadata"] = json.loads(item["metadata_json"])
        except Exception:
            item["metadata"] = {}
    return item

def save_mockup(mockup_data: Dict[str, Any]) -> str:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO mockups (
        id, artwork_id, title, target_state, garment_color,
        model_gender, model_age, model_vibe, environment,
        aspect_ratio, provider, mockup_image_path, preview_url,
        metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        mockup_data["id"],
        mockup_data.get("artwork_id"),
        mockup_data["title"],
        mockup_data["target_state"],
        mockup_data["garment_color"],
        mockup_data["model_gender"],
        mockup_data["model_age"],
        mockup_data["model_vibe"],
        mockup_data["environment"],
        mockup_data.get("aspect_ratio", "4:5"),
        mockup_data["provider"],
        mockup_data["mockup_image_path"],
        mockup_data["preview_url"],
        json.dumps(mockup_data.get("metadata", {})),
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return mockup_data["id"]

def get_all_mockups(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mockups ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    mockups = []
    for row in rows:
        item = dict(row)
        if item.get("metadata_json"):
            try:
                item["metadata"] = json.loads(item["metadata_json"])
            except Exception:
                item["metadata"] = {}
        mockups.append(item)
    conn.close()
    return mockups

def get_mockup_by_id(mockup_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mockups WHERE id = ?", (mockup_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    if item.get("metadata_json"):
        try:
            item["metadata"] = json.loads(item["metadata_json"])
        except Exception:
            item["metadata"] = {}
    return item

def update_mockup(mockup_id: str, updates: Dict[str, Any]) -> bool:
    current = get_mockup_by_id(mockup_id)
    if not current:
        return False
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Merge metadata
    meta = current.get("metadata", {})
    if "metadata" in updates:
        meta.update(updates["metadata"])
        
    mockup_image_path = updates.get("mockup_image_path", current.get("mockup_image_path"))
    preview_url = updates.get("preview_url", current.get("preview_url"))
    title = updates.get("title", current.get("title"))
    
    cursor.execute("""
    UPDATE mockups
    SET mockup_image_path = ?, preview_url = ?, title = ?, metadata_json = ?
    WHERE id = ?
    """, (
        mockup_image_path,
        preview_url,
        title,
        json.dumps(meta),
        mockup_id
    ))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def delete_history_item(item_type: str, item_id: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    if item_type == "artwork":
        cursor.execute("DELETE FROM artworks WHERE id = ?", (item_id,))
    elif item_type == "mockup":
        cursor.execute("DELETE FROM mockups WHERE id = ?", (item_id,))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

