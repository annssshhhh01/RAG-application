import { useState } from "react";


function App(){

  const[question,setQuestion]=useState("")
  const[loading,setLoading]=useState(false)
  const[messages,setMessages]=useState([])
  const[file,setFile]=useState(null)

 
 //for uploading the file and sending it to user
  async function uploadDocument(){
    if(!file)
      alert("Please select a file");
    setLoading(true);
   const filedata=new FormData();
    filedata.append("file",file)    // formData is a class use to store complex data like file images and so in formData syntax is formData.append(name,value)

    await fetch("http://127.0.0.1:8000/upload",{
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

const res= await fetch("http://127.0.0.1:8000/ask",{
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
  <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
    <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-blue-400 mb-6 border-b border-gray-700 pb-4">
        RAG APPLICATION
      </h2>

      {/* UPLOAD SECTION */}
      <div className="flex items-center gap-4 mb-8 bg-gray-700/50 p-4 rounded-lg">
        <input
          type="file"
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button 
          onClick={uploadDocument} 
          disabled={loading} 
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
        >
          {loading ? "..." : "Upload"}
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="h-96 overflow-y-auto mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-36 italic">No conversation yet. Upload a file and start asking!</p>
        )}
        {messages.map((item, index) => (
          <div
            key={index}
            className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
              item.role === "user" 
              ? "bg-blue-600 text-white rounded-tr-none" 
              : "bg-gray-700 text-gray-200 rounded-tl-none"
            }`}>
              <span className="text-xs font-bold block mb-1 opacity-70">
                {item.role === "user" ? "You" : "AI Assistant"}
              </span>
              {item.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-blue-400 animate-pulse text-sm">AI is thinking...</div>}
      </div>

      {/* INPUT SECTION */}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
          value={question}
          placeholder="Ask a question about the document..."
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-2 rounded-lg font-bold transition-all shadow-lg"
        >
          Ask
        </button>
      </div>
    </div>
  </div>
);
}

export default App;




