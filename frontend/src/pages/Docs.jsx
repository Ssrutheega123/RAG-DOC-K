import { useEffect, useState } from "react";
import { API_BASE } from "../config";
import Sidebar from "../components/Sidebar";
import DocContent from "../components/DocContent";
import AIChat from "../components/AIChat";
import RepoSelector from "../components/RepoSelector";

export default function Docs() {

  const [repo, setRepo] = useState(null);
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [docContent, setDocContent] = useState(null);

  const [showSidebar, setShowSidebar] = useState(true);
  const [showChat, setShowChat] = useState(true);


  //////////////////////////////////////////////////////
  // Load docs when repo changes
  //////////////////////////////////////////////////////

  useEffect(() => {

    if (!repo) return;

    setActiveDoc(null);
    setDocContent(null);

    fetch(
      `${API_BASE}/docs?repo=${repo.name}&owner=${repo.owner}`,
      { credentials: "include" }
    )
      .then(res => res.json())
      .then(data => {

        if (!data.documents) {
          console.warn("Docs not returned correctly");
          return;
        }

        setDocs(data.documents);

      })
      .catch(err =>
        console.error("Docs fetch error:", err)
      );

  }, [repo]);


  //////////////////////////////////////////////////////
  // Load selected document
  //////////////////////////////////////////////////////

  useEffect(() => {

    if (!activeDoc) return;

    fetch(
      `${API_BASE}/docs/${encodeURIComponent(activeDoc)}`,
      { credentials: "include" }
    )
      .then(res => res.json())
      .then(data => {

        if (!data.content) {
          console.warn("Document empty");
          return;
        }

        setDocContent(data.content);

      })
      .catch(err =>
        console.error("Doc fetch error:", err)
      );

  }, [activeDoc]);


  //////////////////////////////////////////////////////
  // Layout
  //////////////////////////////////////////////////////

  return (

    <div className="flex flex-col h-screen bg-gray-950 text-white">


      {/* TOP TOOLBAR */}

      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800 bg-gray-900">

        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          Toggle Sidebar
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
        >
          Toggle Chat
        </button>

        <div className="ml-auto">
          <RepoSelector setRepo={setRepo} />
        </div>

      </div>


      {/* MAIN CONTENT AREA */}

      <div className="flex flex-1 overflow-hidden">


        {/* SIDEBAR */}

        {showSidebar && (

          <div className="w-60 flex-shrink-0 border-r border-gray-800 bg-[#0b1b2b] overflow-y-auto">

            <Sidebar
              docs={docs}
              setActiveDoc={setActiveDoc}
              activeDoc={activeDoc}
            />

          </div>

        )}


        {/* DOCUMENT CONTENT */}

        <div className="flex-1 overflow-y-auto p-6">

          {!repo ? (

            <div className="h-full flex items-center justify-center text-gray-500">
              Select a repository to load documentation
            </div>

          ) : !activeDoc ? (

            <div className="h-full flex items-center justify-center text-gray-500">
              Select a document from sidebar
            </div>

          ) : (

            <DocContent content={docContent} />

          )}

        </div>


        {/* AI CHAT */}

        {showChat && (

          <div className="w-80 flex-shrink-0 border-l border-gray-800 bg-gray-900">

            <AIChat repo={repo} />

          </div>

        )}

      </div>

    </div>

  );

}