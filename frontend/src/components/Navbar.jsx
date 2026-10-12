import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { API_BASE } from "../config";

export default function Navbar() {
  const login = () => {
    window.location.href = `${API_BASE}/auth/github/login`;
  }
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-14 bg-gray-900 text-white flex items-center justify-between px-6 shadow-md"
    >
      
      <h1 className="text-lg font-semibold">📘 SmartDocs</h1>

      
      <div className="flex items-center bg-gray-800 px-3 py-1 rounded-lg">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search docs..."
          className="bg-transparent outline-none px-2 text-sm"
        />
      </div>

      
      <button
        onClick={login}
        className="bg-blue-600 px-3 py-1 rounded-lg hover:bg-blue-500"
      >
        Login with GitHub
      </button>
    </motion.div>
  );
}