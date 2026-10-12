import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "../config";

export default function AIChat({ repo }) {

  const [messages, setMessages] = useState([
    { type: "bot", text: "Hi 👋 Ask me anything about the docs!" }
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);


  //////////////////////////////////////////////////////
  // Auto-scroll
  //////////////////////////////////////////////////////

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);


  //////////////////////////////////////////////////////
  // Send message
  //////////////////////////////////////////////////////

  const sendMessage = async () => {

    if (!input.trim() || !repo) return;

    const userMessage = input;

    setMessages(prev => [
      ...prev,
      { type: "user", text: userMessage }
    ]);

    setInput("");
    setLoading(true);


    try {

      const res = await fetch(
        `${API_BASE}/ask-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            question: userMessage,
            owner: repo.owner,
            repo: repo.name
          })
        }
      );


      if (!res.ok) {

        throw new Error("AI backend request failed");

      }


      const data = await res.json();


      if (data.error) {

        throw new Error(data.error);

      }


      setMessages(prev => [

        ...prev,

        {
          type: "bot",
          text:
            data.answer ||
            "No documentation indexed yet. Try reloading the repository."
        }

      ]);

    }

    catch (err) {

      console.error("AI error:", err);

      setMessages(prev => [

        ...prev,

        {
          type: "bot",
          text:
            "⚠️ Documentation search failed. Try selecting repo again."
        }

      ]);

    }


    setLoading(false);

  };


  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  if (!repo) {

    return (

      <div className="flex items-center justify-center h-full text-gray-400 text-sm">

        Select a repository to start chatting

      </div>

    );

  }


  return (

    <div className="flex flex-col h-full overflow-hidden">


      {/* Repo label */}

      <div className="px-3 py-2 text-xs font-semibold text-blue-400 border-b border-gray-700 bg-gray-900">

        📁 {repo.owner}/{repo.name}

      </div>


      {/* Messages */}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">

        {messages.map((msg, i) => (

          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`p-2 rounded-lg text-sm max-w-[85%] whitespace-pre-wrap ${
              msg.type === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-gray-700 text-gray-100"
            }`}
          >

            {msg.text}

          </motion.div>

        ))}


        {loading && (

          <div className="bg-gray-700 text-gray-400 text-sm p-2 rounded-lg max-w-[85%] animate-pulse">

            Thinking...

          </div>

        )}


        <div ref={bottomRef} />

      </div>


      {/* Input */}

      <div className="flex gap-2 p-2 border-t border-gray-700 bg-gray-900">

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about docs..."
          className="flex-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-800 text-white text-sm outline-none focus:border-blue-500"
          onKeyDown={(e) => {

            if (e.key === "Enter" && !e.shiftKey) {

              sendMessage();

            }

          }}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 text-sm"

        >

          Send

        </button>

      </div>

    </div>

  );

}