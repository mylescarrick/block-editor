import {
  Code,
  Columns,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Loader2,
  MessageSquare,
  Minus,
  Pilcrow,
  Quote,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { generateBlocksFromPrompt } from "@/lib/ai";
import { cn, createBlock } from "@/lib/utils";
import type { Block } from "@/types/blocks";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlock: (block: Block) => void;
  onInsertBlocks: (blocks: Block[]) => void;
  position?: { top: number; left: number };
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: "basic" | "media" | "layout" | "ai";
}

export function CommandPalette({
  isOpen,
  onClose,
  onInsertBlock,
  onInsertBlocks,
  position,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAIMode, setIsAIMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setIsAIMode(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Build command list
  const commands: CommandItem[] = [
    // Basic blocks
    {
      id: "paragraph",
      label: "Text",
      description: "Just start writing with plain text",
      icon: Pilcrow,
      action: () => onInsertBlock(createBlock("paragraph")),
      category: "basic",
    },
    {
      id: "heading-1",
      label: "Heading 1",
      description: "Large section heading",
      icon: Heading1,
      action: () => onInsertBlock(createBlock("heading", { level: "h1" })),
      category: "basic",
    },
    {
      id: "heading-2",
      label: "Heading 2",
      description: "Medium section heading",
      icon: Heading2,
      action: () => onInsertBlock(createBlock("heading", { level: "h2" })),
      category: "basic",
    },
    {
      id: "heading-3",
      label: "Heading 3",
      description: "Small section heading",
      icon: Heading3,
      action: () => onInsertBlock(createBlock("heading", { level: "h3" })),
      category: "basic",
    },
    {
      id: "quote",
      label: "Quote",
      description: "Capture a quote",
      icon: Quote,
      action: () => onInsertBlock(createBlock("quote")),
      category: "basic",
    },
    {
      id: "divider",
      label: "Divider",
      description: "Horizontal line to separate content",
      icon: Minus,
      action: () => onInsertBlock(createBlock("divider")),
      category: "basic",
    },

    // Media
    {
      id: "image",
      label: "Image",
      description: "Upload or embed an image",
      icon: Image,
      action: () => onInsertBlock(createBlock("image")),
      category: "media",
    },
    {
      id: "code",
      label: "Code",
      description: "Code snippet with syntax highlighting",
      icon: Code,
      action: () => onInsertBlock(createBlock("code")),
      category: "media",
    },

    // Layout
    {
      id: "columns-2",
      label: "2 Columns",
      description: "Split into two columns",
      icon: Columns,
      action: () =>
        onInsertBlock(
          createBlock("columns", { layout: "1-1", columns: [[], []] })
        ),
      category: "layout",
    },
    {
      id: "columns-3",
      label: "3 Columns",
      description: "Split into three columns",
      icon: Columns,
      action: () =>
        onInsertBlock(
          createBlock("columns", { layout: "1-1-1", columns: [[], [], []] })
        ),
      category: "layout",
    },

    // Callouts
    {
      id: "callout-info",
      label: "Info Callout",
      description: "Highlight important information",
      icon: MessageSquare,
      action: () =>
        onInsertBlock(createBlock("callout", { variant: "info", emoji: "💡" })),
      category: "basic",
    },
    {
      id: "callout-warning",
      label: "Warning Callout",
      description: "Warn about something",
      icon: MessageSquare,
      action: () =>
        onInsertBlock(
          createBlock("callout", { variant: "warning", emoji: "⚠️" })
        ),
      category: "basic",
    },
    {
      id: "callout-success",
      label: "Success Callout",
      description: "Celebrate a success",
      icon: MessageSquare,
      action: () =>
        onInsertBlock(
          createBlock("callout", { variant: "success", emoji: "✅" })
        ),
      category: "basic",
    },

    // AI
    {
      id: "ai",
      label: "Ask AI",
      description: "Generate content with AI",
      icon: Sparkles,
      action: () => setIsAIMode(true),
      category: "ai",
    },
  ];

  // Filter commands by query
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Handle AI mode submission
  const handleAISubmit = useCallback(async () => {
    if (!query.trim()) {
      return;
    }
    setIsLoading(true);
    try {
      const blocks = await generateBlocksFromPrompt(query);
      onInsertBlocks(blocks);
      onClose();
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [query, onInsertBlocks, onClose]);

  // Handle command selection
  const handleSelectCommand = useCallback(() => {
    const selected = filteredCommands[selectedIndex];
    if (selected) {
      selected.action();
      if (selected.id !== "ai") {
        onClose();
      }
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAIMode) {
          setIsAIMode(false);
          setQuery("");
        } else {
          onClose();
        }
        return;
      }

      if (isAIMode) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAISubmit();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          handleSelectCommand();
          break;
        default:
          break;
      }
    },
    [
      filteredCommands.length,
      isAIMode,
      onClose,
      handleAISubmit,
      handleSelectCommand,
    ]
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce(
    (groups, cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
      return groups;
    },
    {} as Record<string, CommandItem[]>
  );

  const categoryLabels: Record<string, string> = {
    basic: "Basic Blocks",
    media: "Media",
    layout: "Layout",
    ai: "AI",
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Centering wrapper - handles positioning without transform conflict */}
      <div
        className="fixed z-50"
        style={{
          top: position?.top ?? "50%",
          left: position?.left ?? "50%",
          transform: position ? undefined : "translate(-50%, -50%)",
        }}
      >
        {/* Palette - handles animation */}
        <div
          className={cn(
            "w-72",
            "rounded-xl bg-white shadow-2xl dark:bg-surface-800",
            "border border-surface-200 dark:border-surface-700",
            "overflow-hidden",
            "animate-scale-in"
          )}
          ref={containerRef}
        >
          {/* Input */}
          <div className="border-surface-200 border-b p-3 dark:border-surface-700">
            <div className="flex items-center gap-2">
              {isAIMode && (
                <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              )}
              <input
                className={cn(
                  "w-full bg-transparent text-sm",
                  "focus:outline-hidden",
                  "placeholder:text-surface-400"
                )}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  isAIMode ? "Describe what you want..." : "Search blocks..."
                }
                ref={inputRef}
                type="text"
                value={query}
              />
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              )}
            </div>
          </div>

          {/* AI suggestions */}
          {isAIMode && (
            <div className="border-surface-200 border-b bg-accent/5 p-3 dark:border-surface-700">
              <p className="mb-2 text-surface-500 text-xs">Try:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Add an intro",
                  "Two-column layout",
                  "Code example",
                  "Image gallery",
                  "Feature list",
                ].map((suggestion) => (
                  <button
                    className={cn(
                      "rounded-full px-2 py-1 text-xs",
                      "bg-accent/10 text-accent hover:bg-accent/20",
                      "transition-colors"
                    )}
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Command list */}
          {!isAIMode && (
            <div className="max-h-72 overflow-y-auto p-2">
              {Object.entries(groupedCommands).map(([category, items]) => (
                <div className="mb-2 last:mb-0" key={category}>
                  <div className="px-2 py-1 font-medium text-surface-400 text-xs uppercase tracking-wider">
                    {categoryLabels[category]}
                  </div>
                  {items.map((cmd) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const Icon = cmd.icon;
                    return (
                      <button
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2",
                          "text-left transition-colors",
                          globalIndex === selectedIndex
                            ? "bg-accent/10 text-accent"
                            : "hover:bg-surface-100 dark:hover:bg-surface-700"
                        )}
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          if (cmd.id !== "ai") {
                            onClose();
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        type="button"
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            globalIndex === selectedIndex
                              ? "bg-accent text-white"
                              : "bg-surface-100 text-surface-500 dark:bg-surface-700"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-sm">
                            {cmd.label}
                          </div>
                          <div className="truncate text-surface-400 text-xs">
                            {cmd.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="py-8 text-center text-sm text-surface-400">
                  No blocks found
                </div>
              )}
            </div>
          )}

          {/* Keyboard hints */}
          <div className="border-surface-200 border-t bg-surface-50 px-3 py-2 dark:border-surface-700 dark:bg-surface-900">
            <div className="flex items-center justify-between text-surface-400 text-xs">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
