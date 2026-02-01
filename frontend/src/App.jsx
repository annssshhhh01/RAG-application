import { useState ,useRef, useEffect } from "react";



function App(){

  const[question,setQuestion]=useState("")
  const[loading,setLoading]=useState(false)
  const[messages,setMessages]=useState([])
  const[file,setFile]=useState(null)
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

   const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleKeyPress = (e) => {
  if (e.key === "Enter" && !e.shiftKey && !loading) {
    e.preventDefault();
    sendMessage();
  }
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

 //for uploading the file and sending it to user
  async function uploadDocument(){
    if(!file)
      alert("Please select a file");
    setLoading(true);
   const filedata=new FormData();
    filedata.append("file",file)    // formData is a class use to store complex data like file images and so in formData syntax is formData.append(name,value)

    await fetch(`${API_URL}/upload`,{
      method:"POST",
      body:filedata,
    })
    setLoading(false);
    alert("Document Uploaded Successfully")
  }

  //asking the question
  async function sendMessage() {
    if(!question.trim()) return;

setLoading(true)
setMessages((prev)=>[...prev,{role:"user",text:question}]) // we can write setMessages(...Messages,{role:"user":text:question}) as well

const res= await fetch(`${API_URL}/ask`,{
  method:"POST",
  headers:{
    "Content-Type":"application/json",
  },
  body:JSON.stringify({question})
})
 if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "API error");
    }
const data= await res.json()
setMessages((prev)=>[...prev,{role:"assistant",text:data.answer}])
setLoading(false)
setQuestion("")
  }


return (
  <>
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
    `}</style>
    
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Main Container - CHANGED: Made wider and taller */}
      <div className="flex flex-col w-full h-screen">
        
        {/* Header */}
        <div className="border-b border-zinc-800 px-8 py-4">
  <h1 className="text-2xl font-semibold text-gray-100">
    RAG Intelligence
  </h1>
  <p className="text-sm text-gray-400">
    Upload documents and chat with AI
  </p>
</div>

        {/* Upload Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white file:font-semibold file:cursor-pointer hover:file:from-purple-600 hover:file:to-pink-600 file:transition-all cursor-pointer bg-white/5 rounded-xl p-3 border border-white/10"
              />
              {file && (
                <div className="mt-2 text-xs text-cyan-400">
                  📄 {file.name}
                </div>
              )}
            </div>
            <button
              onClick={uploadDocument}
              disabled={loading || !file}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "⏳" : "Upload"}
            </button>
          </div>
        </div>

        {/* { Chat Container} */}
<div className="flex-1 flex flex-col bg-zinc-900">
          
          {/* Messages Area - CHANGED: flex-1 to grow */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <span className="text-4xl">💬</span>
                </div>
                <p className="text-purple-300/60 text-lg">No messages yet</p>
                <p className="text-purple-400/40 text-sm mt-2">Upload a document and start chatting!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-4 shadow-lg ${
                      msg.role === "user"
                        ? "bg-zinc-700 text-gray-100"
                        : "bg-zinc-800 text-gray-200 border border-zinc-700"

                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">
                        {msg.role === "user" ? "👤" : "🤖"}
                      </span>
                      <span className="text-xs font-semibold opacity-70">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 rounded-bl-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-800 bg-zinc-900 px-6 py-4">
  <div className="flex gap-3">
    <input
      type="text"
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder="Ask anything about your document..."
      disabled={loading}
      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500"
    />
    <button
      onClick={sendMessage}
      disabled={loading || !question.trim()}
      className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-gray-100 rounded-lg disabled:opacity-50"
    >
      Send
    </button>
  </div>
</div>

        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-purple-300/40 text-xs">
          Powered by AI • Your conversations are private
        </div>
      </div>
    </div>
  </>
);
}
export default App;




