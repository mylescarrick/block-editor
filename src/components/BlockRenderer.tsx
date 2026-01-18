import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  GripVertical,
  ImagePlus,
  Info,
  MoreHorizontal,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn, getColumnFlexBasis } from "@/lib/utils";
import type {
  Block,
  CalloutBlock,
  CodeBlock,
  ColumnsBlock,
  DividerBlock,
  HeadingBlock,
  ImageBlock,
  ParagraphBlock,
  QuoteBlock,
} from "@/types/blocks";
import { RichTextEditor } from "./RichTextEditor";

// ============================================================================
// BLOCK WRAPPER
// Provides consistent UI for all blocks (drag handle, actions menu)
// ============================================================================

interface BlockWrapperProps {
  children: React.ReactNode;
  onDelete: () => void;
  onDuplicate: () => void;
  dragHandleProps?: Record<string, unknown>;
  className?: string;
}

export function BlockWrapper({
  children,
  onDelete,
  onDuplicate,
  dragHandleProps,
  className,
}: BlockWrapperProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={cn("group relative", className)}>
      {/* Left side controls */}
      <div
        className={cn(
          "absolute top-1 -left-12 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
          "select-none"
        )}
      >
        {/* Drag handle */}
        <button
          className="cursor-grab rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 active:cursor-grabbing"
          type="button"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Actions menu */}
        <div className="relative">
          <button
            className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
            onClick={() => setShowMenu(!showMenu)}
            type="button"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div
                className={cn(
                  "absolute top-full left-0 z-20 mt-1",
                  "rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800",
                  "min-w-[140px] py-1",
                  "animate-scale-in"
                )}
              >
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700"
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  type="button"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-red-600 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Block content */}
      {children}
    </div>
  );
}

// ============================================================================
// PARAGRAPH BLOCK
// ============================================================================

interface ParagraphBlockRendererProps {
  block: ParagraphBlock;
  onUpdate: (props: Partial<ParagraphBlock["props"]>) => void;
}

export function ParagraphBlockRenderer({
  block,
  onUpdate,
}: ParagraphBlockRendererProps) {
  return (
    <RichTextEditor
      align={block.props.align}
      className="py-1"
      content={block.props.content}
      onChange={(content) => onUpdate({ content })}
      placeholder="Type '/' for commands..."
    />
  );
}

// ============================================================================
// HEADING BLOCK
// ============================================================================

interface HeadingBlockRendererProps {
  block: HeadingBlock;
  onUpdate: (props: Partial<HeadingBlock["props"]>) => void;
}

export function HeadingBlockRenderer({
  block,
  onUpdate,
}: HeadingBlockRendererProps) {
  const levelStyles = {
    h1: "text-4xl font-display font-normal tracking-tight",
    h2: "text-2xl font-semibold tracking-tight",
    h3: "text-xl font-semibold",
  };

  return (
    <RichTextEditor
      align={block.props.align}
      className="py-2"
      content={block.props.content}
      editorClassName={levelStyles[block.props.level]}
      onChange={(content) => onUpdate({ content })}
      placeholder={`Heading ${block.props.level.slice(1)}`}
    />
  );
}

// ============================================================================
// IMAGE BLOCK
// ============================================================================

interface ImageBlockRendererProps {
  block: ImageBlock;
  onUpdate: (props: Partial<ImageBlock["props"]>) => void;
}

export function ImageBlockRenderer({
  block,
  onUpdate,
}: ImageBlockRendererProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const widthStyles = {
    small: "max-w-sm",
    medium: "max-w-lg",
    large: "max-w-2xl",
    full: "max-w-full",
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Create object URL for preview (in production, upload to storage)
        const url = URL.createObjectURL(file);
        onUpdate({ src: url, alt: file.name });
      }
    },
    [onUpdate]
  );

  if (!block.props.src) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 px-6 py-12",
          "rounded-xl border-2 border-surface-300 border-dashed dark:border-surface-600",
          "bg-surface-50 dark:bg-surface-800/50",
          "cursor-pointer transition-colors hover:border-accent",
          "group"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="rounded-full bg-surface-100 p-3 transition-colors group-hover:bg-accent/10 dark:bg-surface-700">
          <ImagePlus className="h-8 w-8 text-surface-400 transition-colors group-hover:text-accent" />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm text-surface-600 dark:text-surface-400">
            Click to upload an image
          </p>
          <p className="mt-1 text-surface-400 text-xs">
            PNG, JPG, GIF up to 10MB
          </p>
        </div>
        <input
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          ref={fileInputRef}
          type="file"
        />
      </div>
    );
  }

  return (
    <figure className={cn("py-2", widthStyles[block.props.width], "mx-auto")}>
      <div className="group relative">
        <img
          alt={block.props.alt}
          className="w-full rounded-lg"
          src={block.props.src}
        />

        {/* Width controls */}
        <div
          className={cn(
            "absolute right-2 bottom-2 flex gap-1 p-1",
            "rounded-lg bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
          )}
        >
          {(["small", "medium", "large", "full"] as const).map((size) => (
            <button
              className={cn(
                "rounded px-2 py-1 text-xs",
                block.props.width === size
                  ? "bg-white text-black"
                  : "text-white hover:bg-white/20"
              )}
              key={size}
              onClick={() => onUpdate({ width: size })}
              type="button"
            >
              {size.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Caption */}
      <figcaption className="mt-2">
        <input
          className={cn(
            "w-full text-center text-sm text-surface-500 dark:text-surface-400",
            "border-none bg-transparent focus:outline-none focus:ring-0",
            "placeholder:text-surface-400"
          )}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Add a caption..."
          type="text"
          value={block.props.caption || ""}
        />
      </figcaption>
    </figure>
  );
}

// ============================================================================
// DIVIDER BLOCK
// ============================================================================

interface DividerBlockRendererProps {
  block: DividerBlock;
  onUpdate: (props: Partial<DividerBlock["props"]>) => void;
}

export function DividerBlockRenderer({
  block,
  onUpdate,
}: DividerBlockRendererProps) {
  const styleMap = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  return (
    <div className="group py-4">
      <hr
        className={cn(
          "border-surface-200 border-t-2 dark:border-surface-700",
          styleMap[block.props.style]
        )}
      />

      {/* Style selector (shown on hover) */}
      <div className="mt-2 flex justify-center opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
          {(["solid", "dashed", "dotted"] as const).map((style) => (
            <button
              className={cn(
                "rounded px-2 py-1 text-xs capitalize",
                block.props.style === style
                  ? "bg-white shadow-sm dark:bg-surface-700"
                  : "hover:bg-white/50 dark:hover:bg-surface-700/50"
              )}
              key={style}
              onClick={() => onUpdate({ style })}
              type="button"
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CALLOUT BLOCK
// ============================================================================

interface CalloutBlockRendererProps {
  block: CalloutBlock;
  onUpdate: (props: Partial<CalloutBlock["props"]>) => void;
}

export function CalloutBlockRenderer({
  block,
  onUpdate,
}: CalloutBlockRendererProps) {
  const variantStyles = {
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    warning:
      "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    success:
      "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  };

  const variantIcons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    error: XCircle,
  };

  const Icon = variantIcons[block.props.variant];

  const iconColors = {
    info: "text-blue-500",
    warning: "text-amber-500",
    success: "text-emerald-500",
    error: "text-red-500",
  };

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        variantStyles[block.props.variant]
      )}
    >
      <div className="flex-shrink-0 pt-0.5">
        {block.props.emoji ? (
          <span className="text-xl">{block.props.emoji}</span>
        ) : (
          <Icon className={cn("h-5 w-5", iconColors[block.props.variant])} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <RichTextEditor
          content={block.props.content}
          onChange={(content) => onUpdate({ content })}
          placeholder="Type your callout text..."
        />
      </div>
    </div>
  );
}

// ============================================================================
// CODE BLOCK
// ============================================================================

interface CodeBlockRendererProps {
  block: CodeBlock;
  onUpdate: (props: Partial<CodeBlock["props"]>) => void;
}

export function CodeBlockRenderer({ block, onUpdate }: CodeBlockRendererProps) {
  const languages = [
    "typescript",
    "javascript",
    "python",
    "html",
    "css",
    "json",
    "bash",
  ];

  return (
    <div className="overflow-hidden rounded-xl bg-surface-900 dark:bg-surface-950">
      {/* Header */}
      <div className="flex items-center justify-between border-surface-700 border-b bg-surface-800 px-4 py-2 dark:bg-surface-900">
        <select
          className={cn(
            "border-none bg-transparent text-surface-400 text-xs focus:outline-none focus:ring-0",
            "cursor-pointer"
          )}
          onChange={(e) => onUpdate({ language: e.target.value })}
          value={block.props.language}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <button
          className="text-surface-400 text-xs transition-colors hover:text-white"
          onClick={() => navigator.clipboard.writeText(block.props.code)}
          type="button"
        >
          Copy
        </button>
      </div>

      {/* Code content */}
      <div className="p-4">
        <textarea
          className={cn(
            "w-full bg-transparent font-mono text-sm text-surface-100",
            "resize-none border-none focus:outline-none focus:ring-0",
            "placeholder:text-surface-600"
          )}
          onChange={(e) => onUpdate({ code: e.target.value })}
          placeholder="// Enter your code here..."
          rows={Math.max(3, block.props.code.split("\n").length)}
          spellCheck={false}
          value={block.props.code}
        />
      </div>
    </div>
  );
}

// ============================================================================
// QUOTE BLOCK
// ============================================================================

interface QuoteBlockRendererProps {
  block: QuoteBlock;
  onUpdate: (props: Partial<QuoteBlock["props"]>) => void;
}

export function QuoteBlockRenderer({
  block,
  onUpdate,
}: QuoteBlockRendererProps) {
  return (
    <blockquote className="border-surface-300 border-l-4 py-2 pl-4 dark:border-surface-600">
      <RichTextEditor
        content={block.props.content}
        editorClassName="text-lg italic text-surface-600 dark:text-surface-400"
        onChange={(content) => onUpdate({ content })}
        placeholder="Type a quote..."
      />

      {/* Attribution */}
      <input
        className={cn(
          "mt-2 text-sm text-surface-500 dark:text-surface-500",
          "border-none bg-transparent focus:outline-none focus:ring-0",
          "placeholder:text-surface-400"
        )}
        onChange={(e) => onUpdate({ attribution: e.target.value })}
        placeholder="— Attribution"
        type="text"
        value={block.props.attribution || ""}
      />
    </blockquote>
  );
}

// ============================================================================
// COLUMNS BLOCK
// ============================================================================

interface ColumnsBlockRendererProps {
  block: ColumnsBlock;
  onUpdate: (props: Partial<ColumnsBlock["props"]>) => void;
  renderBlock: (
    blockId: string,
    columnContext?: { columnId: string; columnIndex: number }
  ) => React.ReactNode;
}

export function ColumnsBlockRenderer({
  block,
  onUpdate,
  renderBlock,
}: ColumnsBlockRendererProps) {
  const flexBasis = getColumnFlexBasis(block.props.layout);
  const layouts = ["1-1", "1-2", "2-1", "1-1-1"] as const;

  return (
    <div className="group/columns py-2">
      {/* Layout selector */}
      <div className="mb-3 flex justify-center opacity-0 transition-opacity group-hover/columns:opacity-100">
        <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
          {layouts.map((layout) => (
            <button
              className={cn(
                "rounded px-2 py-1 text-xs",
                block.props.layout === layout
                  ? "bg-white shadow-sm dark:bg-surface-700"
                  : "hover:bg-white/50 dark:hover:bg-surface-700/50"
              )}
              key={layout}
              onClick={() => {
                const numCols = layout === "1-1-1" ? 3 : 2;
                const currentCols = block.props.columns;

                // Adjust columns array if layout changes column count
                let newColumns = currentCols;
                if (numCols > currentCols.length) {
                  newColumns = [
                    ...currentCols,
                    ...new Array(numCols - currentCols.length).fill([]),
                  ];
                } else if (numCols < currentCols.length) {
                  // Merge extra columns into the last visible one
                  const merged = currentCols.slice(numCols - 1).flat();
                  newColumns = [...currentCols.slice(0, numCols - 1), merged];
                }

                onUpdate({ layout, columns: newColumns });
              }}
              type="button"
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div className="flex gap-4">
        {block.props.columns.map((columnBlockIds, colIndex) => (
          <div
            className={cn(
              "min-h-[80px] rounded-lg",
              "border-2 border-transparent border-dashed",
              "hover:border-surface-200 dark:hover:border-surface-700",
              "transition-colors"
            )}
            key={colIndex}
            style={{ flexBasis: flexBasis[colIndex] }}
          >
            {columnBlockIds.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-sm text-surface-400">
                Drop blocks here
              </div>
            ) : (
              <div className="space-y-2">
                {columnBlockIds.map((blockId) =>
                  renderBlock(blockId, {
                    columnId: block.props.id,
                    columnIndex: colIndex,
                  })
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// BLOCK RENDERER (Dispatcher)
// ============================================================================

interface BlockRendererProps {
  block: Block;
  onUpdate: (props: Partial<Block["props"]>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  renderBlock?: (
    blockId: string,
    columnContext?: { columnId: string; columnIndex: number }
  ) => React.ReactNode;
  dragHandleProps?: Record<string, unknown>;
}

export function BlockRenderer({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  renderBlock,
  dragHandleProps,
}: BlockRendererProps) {
  const content = (() => {
    switch (block.type) {
      case "paragraph":
        return <ParagraphBlockRenderer block={block} onUpdate={onUpdate} />;
      case "heading":
        return <HeadingBlockRenderer block={block} onUpdate={onUpdate} />;
      case "image":
        return <ImageBlockRenderer block={block} onUpdate={onUpdate} />;
      case "divider":
        return <DividerBlockRenderer block={block} onUpdate={onUpdate} />;
      case "callout":
        return <CalloutBlockRenderer block={block} onUpdate={onUpdate} />;
      case "code":
        return <CodeBlockRenderer block={block} onUpdate={onUpdate} />;
      case "quote":
        return <QuoteBlockRenderer block={block} onUpdate={onUpdate} />;
      case "columns":
        if (!renderBlock) {
          console.warn("renderBlock prop required for columns block");
          return null;
        }
        return (
          <ColumnsBlockRenderer
            block={block}
            onUpdate={onUpdate}
            renderBlock={renderBlock}
          />
        );
      default:
        return <div>Unknown block type</div>;
    }
  })();

  return (
    <BlockWrapper
      dragHandleProps={dragHandleProps}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      {content}
    </BlockWrapper>
  );
}
