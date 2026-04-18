from fastapi import FastAPI,UploadFile,File,HTTPException
from pydantic import BaseModel,Field
import shutil # it is mainly use to copy remove 
import os # its an operating system use to do various work
from dotenv import load_dotenv
load_dotenv()  # Load .env file before any os.getenv() calls
from rag_engine import document_loader,ingest_document,llm_call,summarize_call
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import whisper
import subprocess
from langchain_core.documents import Document
app = FastAPI()
vector_store = None
import psycopg2

conn = psycopg2.connect(
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

cursor = conn.cursor()

# ── Auto-create table if it doesn't exist ──────────────────────────────────
cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id        SERIAL PRIMARY KEY,
        text      TEXT NOT NULL,
        timestamp FLOAT,
        source    TEXT,
        type      TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    )
""")
conn.commit()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

upload_doc="uploads"
os.makedirs(upload_doc,exist_ok=True)
vector_store=None
class Question(BaseModel):
    question:str 
from fastapi.middleware.cors import CORSMiddleware

# ... after app = FastAPI() ...


@app.get("/")
def root():
    return {"message":"RAG engine is running"}

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload")
async def upload_file(file:UploadFile=File(...)):
    ext = file.filename.split(".")[-1].lower()
    if ext in ["mp3", "wav", "m4a", "mp4", "mov", "mkv"]:
        return await upload_media(file)

    global vector_store
    file_path=os.path.join(upload_doc,file.filename)
    with open(file_path,"wb") as f:   #we can use wb when the file has not only text but images etc as they need to b converted into binary
        shutil.copyfileobj(file.file,f)
    try:
       document=document_loader(file_path)
       for doc in document:
        cursor.execute(
            "INSERT INTO documents (text, timestamp, source, type) VALUES (%s, %s, %s, %s)",
            (doc.page_content, None, file.filename, "pdf")
        )

        conn.commit()
       vector_store= ingest_document(document)    
       return {"message":f"file {file.filename} is uploaded and vectorized"}
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))
    
@app.post("/ask")
async def ask_question(request: Question):
    global vector_store

    if vector_store is None:
        raise HTTPException(status_code=400, detail="Please Upload a Document first.")

    # 🔥 Detect summarization
    if "summarize" in request.question.lower():
        result = summarize_call(vector_store)
    else:
        result = llm_call(vector_store, request.question)

    return result 


model = whisper.load_model("base")  # load once (important)

@app.post("/upload/media")
async def upload_media(file: UploadFile = File(...)):
    print(f"[DEBUG] Received media file: {file.filename}")
    
    # 1. Validation
    ext = file.filename.split(".")[-1].lower()
    valid_audio = ["mp3", "wav", "m4a"]
    valid_video = ["mp4", "mov", "mkv"]
    
    if ext not in valid_audio and ext not in valid_video:
        print(f"[DEBUG] Unsupported file type: {ext}")
        raise HTTPException(status_code=400, detail="Unsupported file type. Supported types: mp3, wav, m4a, mp4, mov, mkv.")
        
    print(f"[DEBUG] File type detected as: {ext}")
    file_path = f"uploads/{file.filename}"

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    try:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
            
        with open(file_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file")

    audio_path = file_path

    # 2. FFmpeg Extraction
    if ext in valid_video:
        audio_path = file_path + ".mp3"
        print(f"[DEBUG] Starting FFmpeg conversion for video file: {file_path}")
        
        if subprocess.run(["which", "ffmpeg"], capture_output=True).returncode != 0:
            raise HTTPException(status_code=500, detail="FFmpeg not installed on server")
            
        try:
            process = subprocess.run([
                "ffmpeg",
                "-y",
                "-i", file_path,
                "-vn",              # ignore video stream
                "-acodec", "mp3",   # force mp3 codec
                audio_path
            ], capture_output=True, text=True, check=True, timeout=30)
            print("[DEBUG] FFmpeg conversion successful.")
        except subprocess.TimeoutExpired:
            print("[ERROR] FFmpeg conversion timed out after 30 seconds.")
            raise HTTPException(status_code=500, detail="FFmpeg conversion timed out.")
        except subprocess.CalledProcessError as e:
            print("[ERROR] FFmpeg conversion failed.")
            print(f"Stdout: {e.stdout}")
            print(f"Stderr: {e.stderr}")
            if "does not contain any stream" in str(e.stderr).lower() or "no such file" in str(e.stderr).lower():
                raise HTTPException(status_code=400, detail="The video file does not contain an audio stream to transcribe.")
            raise HTTPException(status_code=500, detail="FFmpeg conversion failed. Check server logs.")
            
        if not os.path.exists(audio_path):
            print("[ERROR] FFmpeg completed but output file is missing.")
            raise HTTPException(status_code=500, detail="Audio file was not created by FFmpeg.")

    # 3. Whisper Transcription
    print(f"[DEBUG] Starting Whisper transcription on: {audio_path}")
    try:
        result = model.transcribe(audio_path)
        segments = result.get("segments", [])
        print(f"[DEBUG] Transcription successful. Found {len(segments)} segments.")
    except Exception as e:
        print(f"[ERROR] Whisper transcription failed: {e}")
        raise HTTPException(status_code=500, detail="Whisper transcription failed.")
        
    if not segments:
        raise HTTPException(status_code=400, detail="No speech detected in the media.")

    # 4. Ingestion
    docs = []
    successful_segments = 0
    sample_timestamps = []
    
    for s in segments:
        text = s.get("text", "").strip()
        if not text:
            continue
            
        start_time = s.get("start", 0.0)
        
        try:
            cursor.execute(
                "INSERT INTO documents (text, timestamp, source, type) VALUES (%s, %s, %s, %s)",
                (text, start_time, file.filename, "audio")
            )
            conn.commit()  # Commit per segment to avoid breaking the entire FAISS ingestion on a single DB error
            
            docs.append(
                Document(
                    page_content=text,
                    metadata={
                        "timestamp": start_time,
                        "source": file.filename
                    }
                )
            )
            successful_segments += 1
            if len(sample_timestamps) < 3:
                sample_timestamps.append(start_time)
        except Exception as e:
            print(f"[WARNING] Database insert failed for a segment: {e}")
            conn.rollback() # Rollback the failed transaction so subsequent inserts work

    if not docs:
        raise HTTPException(status_code=500, detail="All segments failed during database insertion.")

    global vector_store
    try:
        if vector_store:
            vector_store.add_documents(docs)
        else:
            vector_store = ingest_document(docs, is_audio=True)
        print(f"[DEBUG] Successfully ingested {successful_segments} segments into FAISS.")
    except Exception as e:
        print(f"[ERROR] FAISS ingestion failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to index transcription in FAISS.")

    # 5. API Response
    return {
        "message": "File processed successfully",
        "segments_processed": successful_segments,
        "sample_timestamps": sample_timestamps
    }