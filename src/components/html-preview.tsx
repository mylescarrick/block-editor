import { documentToHtml } from "@/lib/html-renderer";
import { cn } from "@/lib/utils";
import type { BlockDocument } from "@/types/blocks";

interface HtmlPreviewProps {
  document: BlockDocument;
  className?: string;
}

export function HtmlPreview({ document, className }: HtmlPreviewProps) {
  const htmlContent = documentToHtml(document);

  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-surface-50 shadow-sm dark:border-surface-700 dark:bg-surface-900",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-surface-200 border-b px-4 py-3 dark:border-surface-700">
        <span className="font-medium text-sm text-surface-700 dark:text-surface-200">
          HTML Preview
        </span>
        <span className="text-surface-500 text-xs">
          {document.rootBlockIds.length} block
          {document.rootBlockIds.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Rendered HTML content */}
      <div
        className={cn(
          "prose prose-surface dark:prose-invert max-w-none p-6",
          "prose-headings:text-surface-900 dark:prose-headings:text-surface-100",
          "prose-p:text-surface-700 dark:prose-p:text-surface-300",
          "prose-blockquote:text-surface-600 dark:prose-blockquote:text-surface-400",
          "prose-code:text-surface-800 dark:prose-code:text-surface-200",
          "min-h-[200px]"
        )}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Sanitized HTML from documentToHtml
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* Empty state */}
      {document.rootBlockIds.length === 0 && (
        <div className="flex items-center justify-center py-12 text-surface-400">
          <span>No content to preview</span>
        </div>
      )}
    </div>
  );
}
