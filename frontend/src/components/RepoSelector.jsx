import { useEffect, useState } from "react";
import { API_BASE } from "../config";

export default function RepoSelector({ setRepo }) {

  const [repos, setRepos] = useState([]);
  const [loadingRepo, setLoadingRepo] = useState(null);


  //////////////////////////////////////////////////////
  // Load GitHub repositories
  //////////////////////////////////////////////////////

  useEffect(() => {

    fetch(`${API_BASE}/auth/github/repos`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {

        console.log("Repos received:", data);

        // safety check if API returns error object
        if (!Array.isArray(data)) {
          console.error("Unexpected repos response:", data);
          return;
        }

        setRepos(data);

      })
      .catch(err => {

        console.error("Failed to fetch repos:", err);

      });

  }, []);



  //////////////////////////////////////////////////////
  // Load markdown repo into backend MongoDB
  //////////////////////////////////////////////////////

  const loadRepo = async (repo) => {

    if (loadingRepo === repo.name) return;

    setLoadingRepo(repo.name);

    try {

      const response = await fetch(
        `${API_BASE}/docs/load-repo`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            owner: repo.owner.login,
            repo: repo.name
          })
        }
      );

      if (!response.ok) {

        console.error("Repo load failed:", response.status);

        return;

      }

      const result = await response.json();

      console.log("Repo loaded:", result);


      //////////////////////////////////////////////////////
      // IMPORTANT: pass BOTH owner + repo to Docs.jsx
      //////////////////////////////////////////////////////

      setRepo({
        name: repo.name,
        owner: repo.owner.login
      });

    } catch (err) {

      console.error("Repo load failed:", err);

    } finally {

      setLoadingRepo(null);

    }

  };



  //////////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////////

  return (

    <div className="p-4 border-b">

      <h2 className="font-semibold mb-2">Select Repo</h2>

      {repos.map(repo => (

        <div
          key={repo.id}
          onClick={() => loadRepo(repo)}
          className="cursor-pointer hover:bg-gray-200 p-2 rounded"
        >
          {repo.name}
        </div>

      ))}

    </div>

  );
}