from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq 
from langchain_community.document_loaders import TextLoader,PyPDFLoader
from dotenv import load_dotenv
import os

load_dotenv()
llm = ChatGroq(
    model="llama-3.3-70b-versatile",  # or other Groq models like "mixtral-8x7b-32768"
    temperature=0.7,
    groq_api_key=os.getenv("GROQ_API_KEY")  # Optional: it will auto-load from env
)
def document_loader(file_path):
    """
    if it is in .txt then we will call Textloader 
    if it is in pdf format then we will call PyPDFloader
    """
    if file_path.endswith(".txt"):  
        #  uvicorn main:app --reload
        loader=TextLoader(file_path)
    elif file_path.endswith(".pdf"):
        loader=PyPDFLoader(file_path)
    else:
        raise ValueError("file not supported")    
    documents=loader.load()        
    return documents


def ingest_document(documents):
    # if metadatas is None:
    #     if metadatas is None:
    #         metadatas = [{} for _ in documents]
    splitter=RecursiveCharacterTextSplitter(chunk_size=2000,chunk_overlap=20)
# text=[doc_1,doc_2,doc_3]
    # metadatas=[{"source":"internal_notes","doc_id":1},{"source":"internal_notes","doc_id":2},{"source":"internal_notes","doc_id":3}]
    docs=splitter.split_documents(documents)
    
    for i in range(len(docs)):
        docs[i].metadata["chunk_id"]=i       

    embeddings=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_documents(docs, embeddings)
    return vector_store

def retrieve_content(vector_store,query):
    retrieval_score=vector_store.similarity_search_with_score(query,k=10)
    if not retrieval_score:
        return None, None
    
    # in short in the retrieval_score we have the structure like document=[(doc1,score),(doc22,score)] note that it is tuple so what we will do is
    content=[]
    extradata=[]
    for doc,score in retrieval_score:
        content.append(doc.page_content)
        extradata.append({
            "source":doc.metadata.get("source"),
            "chunk_id":doc.metadata.get("chunk_id"),
            "score":float(score)
        })   


    concatinated_content="\n\n".join(content)
    return concatinated_content,extradata 

def llm_call(vector_store,question):
    concatinated_content,extradata=retrieve_content(vector_store,question)
    if concatinated_content is None:
        return {
            "answer": "I don't know",
            "sources": []
        }
    prompt = PromptTemplate(
    template="""
    SYSTEM ROLE: 
    You are an Advanced AI Orchestrator. Your goal is to provide accurate, 
    professional, and context-aware answers.

    OPERATING GUIDELINES:
    1. ANALYZE: First, check if the provided {content_text} actually contains 
       the answer to the {question}.
    2. FLEXIBILITY: 
       - If the answer is in the context: Provide a detailed response using ONLY that info.
       - If the context is IRRELEVANT: Say "The provided documents do not contain this 
         info, but based on general AI engineering principles..."
       - If the question is broad (e.g., "What is AI?"): Use the context for a specific 
         definition, but feel free to structure the answer logically.
    3. CITATION: Always mention which part of the context you used.

    CONTEXT FROM PDF:
    {content_text}

    USER QUESTION:
    {question}

    ORCHESTRATOR THOUGHT PROCESS:
    (Think step-by-step about whether the context is sufficient...)
    """,
    input_variables=["content_text", "question"]
)
    final_prompt=prompt.format(content_text=concatinated_content,question=question)
    result=llm.invoke(final_prompt)
    return {
        "answer": result.content,
        "sources": extradata
    }