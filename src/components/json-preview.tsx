import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { BlockDocument } from "@/types/blocks";
import { BlockDocumentSchema } from "@/types/blocks";

interface JsonPreviewProps {
  document: BlockDocument;
  className?: string;
}

export function JsonPreview({ document, className }: JsonPreviewProps) {
  const [isCopied, setIsCopied] = useState(false);

  // Validate document against schema
  const validationResult = BlockDocumentSchema.safeParse(document);
  const isValid = validationResult.success;

  const jsonString = JSON.stringify(document, null, 2);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
      });
  }, [jsonString]);

  return (
    <div
      className={cn(
        "relative rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-surface-200 border-b px-4 py-3 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm text-surface-700 dark:text-surface-200">
            Document Structure
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium text-xs",
              isValid
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {isValid ? "Valid Schema" : "Invalid Schema"}
          </span>
        </div>

        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5",
            "text-sm text-surface-600 dark:text-surface-300",
            "border border-surface-200 dark:border-surface-600",
            "hover:bg-surface-50 dark:hover:bg-surface-700",
            "transition-colors"
          )}
          onClick={handleCopy}
          type="button"
        >
          {isCopied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>

      {/* Validation error (if any) */}
      {!isValid && (
        <div className="border-red-200 border-b bg-red-50 px-4 py-2 text-red-700 text-sm dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          Schema validation failed:{" "}
          {validationResult.error?.issues[0]?.message ?? "Unknown error"}
        </div>
      )}

      {/* JSON content */}
      <div className="max-h-[calc(100vh-300px)] overflow-auto">
        <pre className="p-4 text-sm">
          <code className="whitespace-pre font-mono text-surface-700 dark:text-surface-300">
            {jsonString}
          </code>
        </pre>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 border-surface-200 border-t px-4 py-2 text-surface-500 text-xs dark:border-surface-700">
        <span>{Object.keys(document.blocks).length} blocks</span>
        <span>{document.rootBlockIds.length} root blocks</span>
        <span>{jsonString.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
