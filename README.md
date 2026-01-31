RAG Application – Document-Based Question Answering System

This project is an end-to-end **Retrieval-Augmented Generation (RAG)** application that allows users to upload documents (PDF or TXT) and ask questions that are answered **strictly based on the uploaded content**.

Unlike generic AI chatbots, this system does **not hallucinate answers**.  
If the required information is not present in the document, the system explicitly responds with **“I don’t know”**.

---

##  Problem Statement

Large Language Models (LLMs):
- Cannot reliably process long documents
- Tend to hallucinate when information is missing
- Do not have access to private or user-provided data

This project solves these problems by grounding all AI responses in **retrieved document context** instead of relying on the model’s internal knowledge.

---

## Why Retrieval-Augmented Generation (RAG)?

Instead of sending the entire document to the LLM, this system:

1. Splits documents into smaller chunks
2. Converts chunks into vector embeddings
3. Stores embeddings in a vector database (FAISS)
4. Retrieves only the most relevant chunks for a user query
5. Passes only retrieved context to the LLM for answering

### Benefits:
- Reduced hallucinations
- Improved accuracy
- Scalable to large documents
- Suitable for private or domain-specific data

---

## 🏗 High-Level Architecture
Frontend (React + Vite)
|
| REST API (JSON / File Upload)
|
Backend (FastAPI)
|
|-- Document Loader (PDF / TXT)
|-- Text Chunking
|-- Embedding Generation
|-- Vector Store (FAISS)
|-- Context Retrieval
|-- LLM Inference (Groq - LLaMA 3)


---

## ✨ Features

- Upload PDF or TXT documents
- Automatic text chunking
- Semantic search using vector embeddings
- Context-aware question answering
- Refusal to answer when context is missing
- Source metadata returned with responses
- Clean backend–frontend separation

---

## 🛠 Tech Stack

### Backend
- **FastAPI** – REST API framework
- **LangChain** – RAG pipeline orchestration
- **FAISS** – Vector database
- **HuggingFace Embeddings** – Sentence embeddings
- **Groq (LLaMA 3.3)** – LLM inference
- **Python**

### Frontend
- **React**
- **Vite**
- **Tailwind CSS**
- **Fetch API**

---

## 🔄 How the System Works

1. User uploads a document (PDF or TXT)
2. Backend loads and splits the document into chunks
3. Each chunk is embedded and stored in FAISS
4. User submits a question
5. Relevant chunks are retrieved using similarity search
6. Retrieved context is passed to the LLM
7. The LLM generates an answer strictly from the context
8. Source metadata is returned with the answer

---

## 🚫 Hallucination Control & Safety

- If no document is uploaded → API rejects the request
- If retrieval returns no relevant context → response is **“I don’t know”**
- LLM is instructed to prioritize retrieved context over general knowledge

This makes the system suitable for **accuracy-critical applications**.

---

## ▶️ Running the Project Locally

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```




###Frontend Setup
```
cd frontend
npm install
npm run dev
Frontend will run at:
http://localhost:5174
```
