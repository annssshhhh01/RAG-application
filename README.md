# RAG Application – Multimodal Document Q&A System

> An end-to-end Retrieval-Augmented Generation (RAG) application that allows users to upload **PDFs, audio, and video files** and ask questions answered strictly based on the uploaded content — with audio/video timestamp navigation.

🌐 **Live Demo:** [rag-application-one.vercel.app](https://rag-application-one.vercel.app)  
🔧 **Backend API:** [rag-application.duckdns.org](https://rag-application.duckdns.org/docs)

---

## Problem Statement

Large Language Models (LLMs):
- Cannot reliably process long documents
- Tend to hallucinate when information is missing
- Do not have access to private or user-provided data

This project solves these problems by grounding all AI responses in **retrieved document context** instead of relying on the model's internal knowledge.

---

## Why Retrieval-Augmented Generation (RAG)?

Instead of sending the entire document to the LLM, this system:

1. Splits documents into smaller chunks
2. Converts chunks into vector embeddings
3. Stores embeddings in a vector database (FAISS)
4. Retrieves only the most relevant chunks for a user query
5. Passes only retrieved context to the LLM for answering

**Benefits:**
- ✅ Reduced hallucinations
- ✅ Improved accuracy
- ✅ Scalable to large documents
- ✅ Supports private and domain-specific data
- ✅ Works with audio and video via automatic transcription

---

## High-Level Architecture

```
Frontend (React + Vite) — Vercel
        |
   REST API (JSON / File Upload)
        |
Backend (FastAPI) — AWS EC2 + Nginx + SSL
        |
        |-- Document Loader (PDF / TXT)
        |-- Audio/Video Transcription (Whisper)
        |-- Text Chunking (LangChain)
        |-- Embedding Generation (HuggingFace)
        |-- Vector Store (FAISS)
        |-- Context Retrieval (Similarity Search)
        |-- LLM Inference (Groq - LLaMA 3.3)
        |-- PostgreSQL (Document metadata storage)
```

---

## Features

### Document Support
- 📄 Upload **PDF** and **TXT** documents
- 🎵 Upload **audio files** (MP3, WAV, M4A) — auto-transcribed via Whisper
- 🎬 Upload **video files** (MP4, MKV) — audio extracted and transcribed via Whisper

### AI Question Answering
- Semantic search using vector embeddings
- Context-aware question answering
- **Hallucination control** — responds "I don't know" when context is missing
- Source metadata returned with every response

### Media Player & Timestamps
- 🕐 Responses include **timestamps** for relevant sections in audio/video
- ▶️ **Play button** jumps directly to the relevant timestamp
- In-browser media player with seek support

### UI/UX
- GPT-style dark chat interface with glassmorphism and 3D effects
- Collapsible sidebar with upload panel and content summaries
- Drag-and-drop file upload with progress tracking
- Mobile-responsive layout
- Tip cards for quick query suggestions

### Backend & Infrastructure
- FastAPI REST API
- PostgreSQL for document metadata persistence
- PM2 process manager for zero-downtime on EC2
- Nginx reverse proxy with Let's Encrypt SSL
- DuckDNS dynamic DNS

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| LangChain | RAG pipeline orchestration |
| FAISS | Vector database |
| HuggingFace Embeddings | Sentence embeddings (`all-MiniLM-L6-v2`) |
| Groq (LLaMA 3.3) | LLM inference |
| OpenAI Whisper | Audio/video transcription |
| FFmpeg | Audio extraction from video |
| psycopg2 | PostgreSQL database driver |
| python-dotenv | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| React + Vite | UI framework |
| Vanilla CSS | Custom dark glassmorphic theme |
| Fetch API | REST communication |

### Infrastructure
| Service | Purpose |
|---|---|
| AWS EC2 | Backend hosting |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt | Free SSL certificate |
| DuckDNS | Dynamic DNS (`rag-application.duckdns.org`) |
| PostgreSQL | Document metadata storage |
| PM2 | Process manager |
| Vercel | Frontend hosting |
| GitHub | Source control + CI/CD |

---

## How the System Works

1. User uploads a **PDF, TXT, audio, or video** file
2. For audio/video → Whisper transcribes it with **word-level timestamps**
3. Backend chunks the text and generates vector embeddings
4. Embeddings stored in FAISS; metadata saved to PostgreSQL
5. User submits a question
6. Relevant chunks retrieved via similarity search
7. Retrieved context passed to LLaMA 3.3 via Groq
8. LLM generates an answer **strictly from the context**
9. Response includes source metadata + timestamps (for audio/video)
10. Frontend renders the answer with a **Play button** to jump to the timestamp

---

## Hallucination Control & Safety

- If no document is uploaded → API rejects the request
- If retrieval returns no relevant context → response is `"I don't know"`
- LLM is instructed to prioritize retrieved context over general knowledge
- Makes the system suitable for **accuracy-critical applications**

---

## Running the Project Locally

### Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in: GROQ_API_KEY, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

uvicorn main:app --reload
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
# Frontend runs at http://localhost:5174
```

---

## Deployment

### Backend (AWS EC2)
```bash
# Clone repo
git clone https://github.com/annssshhhh01/RAG-application.git
cd RAG-application

# Create venv and install deps
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Create .env in backend/
# Start with PM2
pm2 start backend/start.sh --name rag-backend --interpreter bash
pm2 save
pm2 startup
```

### Frontend (Vercel)
- Connect GitHub repo to Vercel
- Set environment variable: `VITE_API_URL = https://rag-application.duckdns.org`
- Auto-deploys on every push to `main`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload a PDF, TXT, audio, or video file |
| `POST` | `/ask` | Ask a question against uploaded content |
| `GET` | `/` | Health check |
| `GET` | `/docs` | Swagger UI |
