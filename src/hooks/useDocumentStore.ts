import { useCallback, useEffect, useRef, useState } from "react";
import { loadDocument, saveDocument } from "@/lib/persistence";
import { cloneDocument, createDocument, generateId } from "@/lib/utils";
import type { Block, BlockDocument } from "@/types/blocks";

interface UseDocumentStoreOptions {
  documentId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function useDocumentStore(options: UseDocumentStoreOptions = {}) {
  const { documentId, autoSave = true, autoSaveDelay = 1000 } = options;

  const [document, setDocument] = useState<BlockDocument>(() =>
    createDocument()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!documentId);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load document on mount if ID provided
  useEffect(() => {
    if (documentId) {
      setIsLoading(true);
      loadDocument(documentId)
        .then((doc) => {
          if (doc) {
            setDocument(doc);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [documentId]);

  // Auto-save logic
  const scheduleSave = useCallback(
    (doc: BlockDocument) => {
      if (!autoSave) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
          await saveDocument(doc);
        } catch (error) {
          console.error("Failed to save document:", error);
          setSaveError(
            error instanceof Error ? error.message : "Failed to save"
          );
        } finally {
          setIsSaving(false);
        }
      }, autoSaveDelay);
    },
    [autoSave, autoSaveDelay]
  );

  // Update document and schedule save
  const updateDocument = useCallback(
    (updater: (doc: BlockDocument) => BlockDocument) => {
      setDocument((prev) => {
        const next = updater(cloneDocument(prev));
        next.updatedAt = new Date().toISOString();
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  // Get a block by ID
  const getBlock = useCallback(
    (blockId: string): Block | undefined => {
      return document.blocks[blockId];
    },
    [document.blocks]
  );

  // Update a single block
  const updateBlock = useCallback(
    <T extends Block>(blockId: string, updates: Partial<T["props"]>) => {
      updateDocument((doc) => {
        const block = doc.blocks[blockId];
        if (block) {
          doc.blocks[blockId] = {
            ...block,
            props: { ...block.props, ...updates },
          } as Block;
        }
        return doc;
      });
    },
    [updateDocument]
  );

  // Add a new block
  const addBlock = useCallback(
    (
      block: Block,
      options?: {
        afterBlockId?: string;
        parentColumnId?: string;
        columnIndex?: number;
      }
    ) => {
      updateDocument((doc) => {
        // Add the block to the blocks map
        doc.blocks[block.props.id] = block;

        // If adding to a column
        if (
          options?.parentColumnId !== undefined &&
          options?.columnIndex !== undefined
        ) {
          const parentBlock = doc.blocks[options.parentColumnId];
          if (parentBlock?.type === "columns") {
            const columns = [...parentBlock.props.columns];
            columns[options.columnIndex] = [
              ...columns[options.columnIndex],
              block.props.id,
            ];
            doc.blocks[options.parentColumnId] = {
              ...parentBlock,
              props: { ...parentBlock.props, columns },
            };
          }
        } else {
          // Add to root blocks
          if (options?.afterBlockId) {
            const index = doc.rootBlockIds.indexOf(options.afterBlockId);
            if (index >= 0) {
              doc.rootBlockIds.splice(index + 1, 0, block.props.id);
            } else {
              doc.rootBlockIds.push(block.props.id);
            }
          } else {
            doc.rootBlockIds.push(block.props.id);
          }
        }

        return doc;
      });
    },
    [updateDocument]
  );

  // Remove a block
  const removeBlock = useCallback(
    (blockId: string) => {
      updateDocument((doc) => {
        // Remove from root blocks
        doc.rootBlockIds = doc.rootBlockIds.filter((id) => id !== blockId);

        // Remove from any columns
        Object.values(doc.blocks).forEach((block) => {
          if (block.type === "columns") {
            const newColumns = block.props.columns.map((col) =>
              col.filter((id) => id !== blockId)
            );
            doc.blocks[block.props.id] = {
              ...block,
              props: { ...block.props, columns: newColumns },
            };
          }
        });

        // Delete the block itself
        delete doc.blocks[blockId];

        return doc;
      });
    },
    [updateDocument]
  );

  // Move a block
  const moveBlock = useCallback(
    (
      blockId: string,
      targetIndex: number,
      targetColumnId?: string,
      targetColumnIndex?: number
    ) => {
      updateDocument((doc) => {
        // First, remove from current location
        doc.rootBlockIds = doc.rootBlockIds.filter((id) => id !== blockId);
        Object.values(doc.blocks).forEach((block) => {
          if (block.type === "columns") {
            const newColumns = block.props.columns.map((col) =>
              col.filter((id) => id !== blockId)
            );
            doc.blocks[block.props.id] = {
              ...block,
              props: { ...block.props, columns: newColumns },
            };
          }
        });

        // Then, add to new location
        if (targetColumnId && targetColumnIndex !== undefined) {
          const parentBlock = doc.blocks[targetColumnId];
          if (parentBlock?.type === "columns") {
            const columns = [...parentBlock.props.columns];
            columns[targetColumnIndex] = [
              ...columns[targetColumnIndex].slice(0, targetIndex),
              blockId,
              ...columns[targetColumnIndex].slice(targetIndex),
            ];
            doc.blocks[targetColumnId] = {
              ...parentBlock,
              props: { ...parentBlock.props, columns },
            };
          }
        } else {
          doc.rootBlockIds.splice(targetIndex, 0, blockId);
        }

        return doc;
      });
    },
    [updateDocument]
  );

  // Duplicate a block
  const duplicateBlock = useCallback(
    (blockId: string) => {
      const block = document.blocks[blockId];
      if (!block) {
        return;
      }

      const newBlock = {
        ...block,
        props: { ...block.props, id: generateId() },
      } as Block;

      addBlock(newBlock, { afterBlockId: blockId });
    },
    [document.blocks, addBlock]
  );

  // Insert blocks from AI generation
  const insertGeneratedBlocks = useCallback(
    (blocks: Block[], afterBlockId?: string) => {
      updateDocument((doc) => {
        // Add all blocks to the map
        blocks.forEach((block) => {
          doc.blocks[block.props.id] = block;
        });

        // Get root-level block IDs (blocks that are in columns will be handled by the columns block)
        const rootBlockIds = blocks
          .filter((block) => {
            // Check if this block is referenced in any columns block
            const isInColumn = blocks.some(
              (b) =>
                b.type === "columns" &&
                b.props.columns.some((col) => col.includes(block.props.id))
            );
            return !isInColumn;
          })
          .map((b) => b.props.id);

        // Insert at the correct position
        if (afterBlockId) {
          const index = doc.rootBlockIds.indexOf(afterBlockId);
          if (index >= 0) {
            doc.rootBlockIds.splice(index + 1, 0, ...rootBlockIds);
          } else {
            doc.rootBlockIds.push(...rootBlockIds);
          }
        } else {
          doc.rootBlockIds.push(...rootBlockIds);
        }

        return doc;
      });
    },
    [updateDocument]
  );

  // Update document title
  const setTitle = useCallback(
    (title: string) => {
      updateDocument((doc) => {
        doc.title = title;
        return doc;
      });
    },
    [updateDocument]
  );

  return {
    document,
    isLoading,
    isSaving,
    saveError,
    getBlock,
    updateBlock,
    addBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    insertGeneratedBlocks,
    setTitle,
  };
}
