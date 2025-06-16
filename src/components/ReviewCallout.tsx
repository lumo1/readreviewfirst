// src/components/ReviewCallout.tsx
export default function ReviewCallout({ summary }: { summary: string }) {
  return (
    <div className="mt-2 text-gray-600 italic">{summary}</div>
  );
}
