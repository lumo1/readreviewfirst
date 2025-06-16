// src/components/TwoColMarkdown.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function TwoColMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="columns-1 md:columns-2 gap-8 space-y-4 prose prose-sm md:prose-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
