import { FileCode } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseHtmlToBlocks } from "@/lib/clipboard-parser";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/blocks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface HtmlImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (blocks: Block[]) => void;
}

export function HtmlImportModal({
  open,
  onOpenChange,
  onImport,
}: HtmlImportModalProps) {
  const [htmlContent, setHtmlContent] = useState("");

  // Parse HTML and get block count preview
  const parsedBlocks = useMemo(() => {
    if (!htmlContent.trim()) {
      return [];
    }
    return parseHtmlToBlocks(htmlContent);
  }, [htmlContent]);

  const blockCount = parsedBlocks.length;

  const handleImport = useCallback(() => {
    if (parsedBlocks.length > 0) {
      onImport(parsedBlocks);
      setHtmlContent("");
      onOpenChange(false);
    }
  }, [parsedBlocks, onImport, onOpenChange]);

  const handleCancel = useCallback(() => {
    setHtmlContent("");
    onOpenChange(false);
  }, [onOpenChange]);

  // Reset content when modal opens/closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setHtmlContent("");
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="border-surface-200 bg-white sm:max-w-xl dark:border-surface-700 dark:bg-surface-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-surface-900 dark:text-surface-100">
            <FileCode className="h-5 w-5 text-accent" />
            Import HTML
          </DialogTitle>
          <DialogDescription className="text-surface-500 dark:text-surface-400">
            Paste HTML content below to convert it into editable blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <textarea
            className={cn(
              "h-64 w-full resize-none rounded-lg border p-3",
              "border-surface-200 dark:border-surface-600",
              "bg-surface-50 dark:bg-surface-900",
              "text-surface-900 dark:text-surface-100",
              "font-mono text-sm",
              "placeholder:text-surface-400 dark:placeholder:text-surface-500",
              "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            )}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="<h1>Your HTML here...</h1>
<p>Paste formatted content from web pages, documents, or write HTML directly.</p>"
            value={htmlContent}
          />

          {/* Block count preview */}
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              blockCount > 0
                ? "bg-accent/10 text-accent dark:bg-accent/20"
                : "bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400"
            )}
          >
            {blockCount > 0 ? (
              <span>
                {blockCount} block{blockCount !== 1 ? "s" : ""} will be created
              </span>
            ) : (
              <span>Enter HTML content to preview block count</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <button
            className={cn(
              "rounded-lg px-4 py-2 font-medium text-sm",
              "border border-surface-200 dark:border-surface-600",
              "text-surface-700 dark:text-surface-300",
              "hover:bg-surface-100 dark:hover:bg-surface-700",
              "transition-colors"
            )}
            onClick={handleCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(
              "rounded-lg px-4 py-2 font-medium text-sm",
              "bg-accent text-white",
              "hover:bg-accent/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors"
            )}
            disabled={blockCount === 0}
            onClick={handleImport}
            type="button"
          >
            Import{" "}
            {blockCount > 0
              ? `${blockCount} block${blockCount !== 1 ? "s" : ""}`
              : ""}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
