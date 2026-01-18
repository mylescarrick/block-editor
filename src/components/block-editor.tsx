import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Code2, FileText, Loader2, PenLine, Plus, Save } from "lucide-react";
import type { ClipboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDocumentStore } from "@/hooks/use-document-store";
import { parseHtmlToBlocks } from "@/lib/clipboard-parser";
import { cn } from "@/lib/utils";
import type { Block } from "@/types/blocks";
import { BlockRenderer } from "./block-renderer";
import { CommandPalette } from "./command-palette";
import { JsonPreview } from "./json-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// ============================================================================
// SORTABLE BLOCK WRAPPER
// ============================================================================

interface SortableBlockProps {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}

function SortableBlock({ id, children }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({ ...listeners })}
    </div>
  );
}

// ============================================================================
// ADD BLOCK BUTTON
// ============================================================================

interface AddBlockButtonProps {
  onClick: () => void;
}

function AddBlockButton({ onClick }: AddBlockButtonProps) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-center gap-2 py-3",
        "text-sm text-surface-400 hover:text-surface-600",
        "border-2 border-surface-200 border-dashed dark:border-surface-700",
        "hover:border-surface-300 dark:hover:border-surface-600",
        "rounded-xl transition-colors",
        "group"
      )}
      onClick={onClick}
      type="button"
    >
      <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span>Add block or press /</span>
    </button>
  );
}

// ============================================================================
// MAIN EDITOR
// ============================================================================

interface BlockEditorProps {
  documentId?: string;
}

export function BlockEditor({ documentId }: BlockEditorProps) {
  const {
    document,
    isLoading,
    isSaving,
    getBlock,
    updateBlock,
    addBlock,
    removeBlock,
    duplicateBlock,
    insertGeneratedBlocks,
    setTitle,
    moveBlock,
  } = useDocumentStore({ documentId });

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [insertAfterBlockId, setInsertAfterBlockId] = useState<
    string | undefined
  >();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        const isEditing =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.contentEditable === "true" ||
          target.closest(".ProseMirror");

        if (!isEditing) {
          e.preventDefault();
          setShowCommandPalette(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle drag events
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveBlockId(null);

      if (over && active.id !== over.id) {
        const oldIndex = document.rootBlockIds.indexOf(active.id as string);
        const newIndex = document.rootBlockIds.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
          moveBlock(active.id as string, newIndex);
        }
      }
    },
    [document.rootBlockIds, moveBlock]
  );

  // Insert block handler
  const handleInsertBlock = useCallback(
    (block: Block) => {
      addBlock(block, { afterBlockId: insertAfterBlockId });
      setInsertAfterBlockId(undefined);
    },
    [addBlock, insertAfterBlockId]
  );

  // Insert multiple blocks (from AI)
  const handleInsertBlocks = useCallback(
    (blocks: Block[]) => {
      insertGeneratedBlocks(blocks, insertAfterBlockId);
      setInsertAfterBlockId(undefined);
    },
    [insertGeneratedBlocks, insertAfterBlockId]
  );

  // Track last focused block for paste insertion position
  const lastFocusedBlockIdRef = useRef<string | undefined>(undefined);

  // Update last focused block when clicking on blocks
  const handleBlockFocus = useCallback((blockId: string) => {
    lastFocusedBlockIdRef.current = blockId;
  }, []);

  // Handle paste events from clipboard
  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      // If we're inside a TipTap editor (contenteditable), let TipTap handle the paste
      const isInEditor =
        target.contentEditable === "true" || target.closest(".ProseMirror");

      if (isInEditor) {
        return;
      }

      // Get HTML content from clipboard
      const html = event.clipboardData.getData("text/html");

      if (html) {
        event.preventDefault();

        const blocks = parseHtmlToBlocks(html);

        if (blocks.length > 0) {
          // Determine insertion position: use last focused block or append to end
          const insertAfter =
            lastFocusedBlockIdRef.current ?? document.rootBlockIds.at(-1);
          insertGeneratedBlocks(blocks, insertAfter);
        }
      }
      // If no HTML, don't prevent default - let plain text paste happen naturally
      // (Plain text fallback is handled in clipboard-plaintext-fallback-004)
    },
    [insertGeneratedBlocks, document.rootBlockIds]
  );

  // Render a block by ID (used for column children)
  const renderBlockById = useCallback(
    (
      blockId: string,
      _columnContext?: { columnId: string; columnIndex: number }
    ) => {
      const block = getBlock(blockId);
      if (!block) {
        return null;
      }

      return (
        <BlockRenderer
          block={block}
          key={blockId}
          onDelete={() => removeBlock(blockId)}
          onDuplicate={() => duplicateBlock(blockId)}
          onUpdate={(props) => updateBlock(blockId, props)}
          renderBlock={renderBlockById}
        />
      );
    },
    [getBlock, updateBlock, removeBlock, duplicateBlock]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-surface-50 dark:bg-surface-900"
      onPaste={handlePaste}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 border-surface-200 border-b bg-white/80 backdrop-blur-xs dark:border-surface-800 dark:bg-surface-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-accent" />
            <input
              className={cn(
                "bg-transparent font-semibold text-lg",
                "border-none focus:outline-hidden focus:ring-0",
                "placeholder:text-surface-400"
              )}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              type="text"
              value={document.title}
            />
          </div>

          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="flex items-center gap-2 text-sm text-surface-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-surface-400">
                <Save className="h-4 w-4" />
                Saved
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tabs for Editor / Structure views */}
      <Tabs className="mx-auto max-w-4xl px-6" defaultValue="editor">
        <TabsList className="my-4">
          <TabsTrigger value="editor">
            <PenLine className="mr-1.5 h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="structure">
            <Code2 className="mr-1.5 h-4 w-4" />
            Structure
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor">
          <main className="py-8">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              sensors={sensors}
            >
              <SortableContext
                items={document.rootBlockIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1 pl-12">
                  {document.rootBlockIds.map((blockId) => {
                    const block = getBlock(blockId);
                    if (!block) {
                      return null;
                    }

                    return (
                      <SortableBlock id={blockId} key={blockId}>
                        {(dragHandleProps) => (
                          <div onFocusCapture={() => handleBlockFocus(blockId)}>
                            <BlockRenderer
                              block={block}
                              dragHandleProps={dragHandleProps}
                              onDelete={() => removeBlock(blockId)}
                              onDuplicate={() => duplicateBlock(blockId)}
                              onUpdate={(props) => updateBlock(blockId, props)}
                              renderBlock={renderBlockById}
                            />
                          </div>
                        )}
                      </SortableBlock>
                    );
                  })}
                </div>
              </SortableContext>

              {/* Drag overlay */}
              <DragOverlay>
                {activeBlockId ? (
                  <div className="rounded-lg bg-white p-4 opacity-80 shadow-xl dark:bg-surface-800">
                    {(() => {
                      const block = getBlock(activeBlockId);
                      return block ? (
                        <div className="text-sm text-surface-600">
                          Dragging: {block.type}
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Add block button */}
            <div className="mt-6 pl-12">
              <AddBlockButton
                onClick={() => {
                  setInsertAfterBlockId(document.rootBlockIds.at(-1));
                  setShowCommandPalette(true);
                }}
              />
            </div>
          </main>
        </TabsContent>

        {/* Structure Tab */}
        <TabsContent value="structure">
          <div className="py-8">
            <JsonPreview document={document} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Command palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => {
          setShowCommandPalette(false);
          setInsertAfterBlockId(undefined);
        }}
        onInsertBlock={handleInsertBlock}
        onInsertBlocks={handleInsertBlocks}
      />

      {/* Keyboard hint */}
      <div className="fixed right-6 bottom-6 rounded-full border border-surface-200 bg-white px-3 py-2 text-surface-400 text-xs shadow-lg dark:border-surface-700 dark:bg-surface-800">
        Press{" "}
        <kbd className="rounded-sm bg-surface-100 px-1.5 py-0.5 font-mono dark:bg-surface-700">
          /
        </kbd>{" "}
        to add blocks
      </div>
    </div>
  );
}
