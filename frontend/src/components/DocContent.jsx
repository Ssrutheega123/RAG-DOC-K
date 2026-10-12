import ReactMarkdown from "react-markdown";

export default function DocContent({ content }) {

  if (!content) {

    return (
      <div className="text-gray-400">
        No document selected.
      </div>
    );

  }

  return (

    <div className="prose prose-invert max-w-none">

      <ReactMarkdown>

        {content}

      </ReactMarkdown>

    </div>

  );

}