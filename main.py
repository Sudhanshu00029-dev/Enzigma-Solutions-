from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import sqlite3
import os
from datetime import datetime
import shutil

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database initialization
def init_db():
    conn = sqlite3.connect('forms.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS forms
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         filename TEXT NOT NULL,
         original_name TEXT NOT NULL,
         upload_date TIMESTAMP NOT NULL,
         file_path TEXT NOT NULL)
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.post("/upload/")
async def upload_files(files: List[UploadFile]):
    uploaded_files = []
    conn = sqlite3.connect('forms.db')
    c = conn.cursor()
    
    try:
        for file in files:
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Save file info to database
            c.execute('''
                INSERT INTO forms (filename, original_name, upload_date, file_path)
                VALUES (?, ?, ?, ?)
            ''', (safe_filename, file.filename, datetime.now(), file_path))
            
            uploaded_files.append({
                "original_name": file.filename,
                "saved_as": safe_filename
            })
        
        conn.commit()
        return {"message": "Files uploaded successfully", "files": uploaded_files}
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/search/")
async def search_files(query: str = ""):
    conn = sqlite3.connect('forms.db')
    c = conn.cursor()
    
    try:
        if query:
            c.execute('''
                SELECT id, filename, original_name, upload_date, file_path
                FROM forms
                WHERE original_name LIKE ?
                ORDER BY upload_date DESC
            ''', (f'%{query}%',))
        else:
            c.execute('''
                SELECT id, filename, original_name, upload_date, file_path
                FROM forms
                ORDER BY upload_date DESC
            ''')
        
        results = [{
            "id": row[0],
            "filename": row[1],
            "original_name": row[2],
            "upload_date": row[3],
            "file_path": row[4]
        } for row in c.fetchall()]
        
        return results
    
    finally:
        conn.close()

@app.get("/download/{file_id}")
async def download_file(file_id: int):
    conn = sqlite3.connect('forms.db')
    c = conn.cursor()
    
    try:
        c.execute('SELECT file_path, original_name FROM forms WHERE id = ?', (file_id,))
        result = c.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="File not found")
            
        file_path, original_name = result
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found on server")
            
        return FileResponse(file_path, filename=original_name)
        
    finally:
        conn.close()