import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "../config";

export default function Sidebar({ docs, setActiveDoc, activeDoc }) {
  return (
    <div className="py-2">
      <div className="px-4 py-2 text-xs uppercase tracking-widest text-gray-500 font-semibold">
        Documents
      </div>

      {docs.length === 0 && (
        <div className="px-4 py-3 text-gray-500 text-sm">No docs found</div>
      )}

      {docs.map(doc => (
        <div
          key={doc.doc_id}
          onClick={() => setActiveDoc(doc.doc_id)}
          className={`cursor-pointer px-4 py-2 text-sm rounded mx-1 transition-colors ${activeDoc === doc.doc_id
              ? "bg-blue-700 text-white"
              : "text-gray-300 hover:bg-gray-700"
            }`}
        >
          {doc.title}
        </div>
      ))}
    </div>
  );
}