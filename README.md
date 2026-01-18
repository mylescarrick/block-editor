# Block Editor

A Notion-like block-based visual editor built with React, TipTap, and a unified schema system that supports both manual editing and AI generation.

## Architecture

This editor demonstrates how to combine:

- **TipTap/ProseMirror** - For rich text editing within blocks
- **Zod schemas** - For type-safe block definitions that work with AI generation
- **DnD Kit** - For drag-and-drop block reordering
- **Tailwind CSS** - For styling

### Key Concepts

#### Unified Block Schema

All blocks conform to Zod schemas defined in `src/types/blocks.ts`. This enables:

- **Type safety** - Full TypeScript inference for all block operations
- **AI compatibility** - Same schema can be used to constrain AI generation (similar to json-render's approach)
- **Validation** - Runtime validation of block data

```typescript
// Example block schema
export const HeadingBlockSchema = z.object({
  type: z.literal('heading'),
  props: BaseBlockPropsSchema.extend({
    content: RichTextSchema,
    level: z.enum(['h1', 'h2', 'h3']).default('h2'),
    align: z.enum(['left', 'center', 'right']).default('left'),
  }),
});
```

#### Block Types

| Block Type | Description |
|------------|-------------|
| `paragraph` | Rich text paragraph with alignment |
| `heading` | H1, H2, or H3 heading |
| `image` | Image with caption and width controls |
| `divider` | Horizontal rule with style options |
| `callout` | Highlighted callout box (info, warning, success, error) |
| `code` | Syntax-highlighted code block |
| `quote` | Blockquote with attribution |
| `columns` | Multi-column layout (1-1, 1-2, 2-1, 1-1-1) |

#### Document Structure

```typescript
interface BlockDocument {
  id: string;
  title: string;
  blocks: Record<string, Block>;  // All blocks by ID
  rootBlockIds: string[];         // Order of top-level blocks
  createdAt: string;
  updatedAt: string;
}
```

## Usage

### Adding Blocks

1. **Press `/`** anywhere to open the command palette
2. **Click "Add block"** button at the bottom
3. **Use AI** - Select "Ask AI" from the command palette

### AI Generation (Demo)

The AI generation is stubbed with mock responses. Try these prompts:

- "Add an intro" - Generates a heading and paragraph
- "Two-column layout" - Creates a 2-column block with content
- "Three-column layout" - Creates a 3-column block
- "Code example" - Adds a code block with sample code
- "Image gallery" - Adds an image block
- "Feature list" - Generates callout blocks

### Editing

- **Click** any text block to edit
- **Select text** to show formatting toolbar (bold, italic, underline, etc.)
- **Drag** the grip handle to reorder blocks
- **Hover** over a block to see the actions menu (duplicate, delete)

### Column Layouts

1. Add a "2 Columns" or "3 Columns" block
2. Drag blocks into the column areas
3. Use the layout selector to change ratios (1-1, 1-2, 2-1, 1-1-1)

## Project Structure

```
src/
├── components/
│   ├── BlockEditor.tsx      # Main editor component
│   ├── BlockRenderer.tsx    # Individual block renderers
│   ├── CommandPalette.tsx   # Slash command menu
│   └── RichTextEditor.tsx   # TipTap-based text editor
├── hooks/
│   └── useDocumentStore.ts  # Document state management
├── lib/
│   ├── ai.ts                # AI generation (stub)
│   ├── persistence.ts       # LocalStorage persistence (stub)
│   └── utils.ts             # Utility functions
└── types/
    └── blocks.ts            # Zod schemas and types
```

## Extending

### Adding a New Block Type

1. **Define the schema** in `src/types/blocks.ts`:

```typescript
export const MyBlockSchema = z.object({
  type: z.literal('myblock'),
  props: BaseBlockPropsSchema.extend({
    // your props here
  }),
});
```

2. **Add to the union** in `BlockSchema`

3. **Create the renderer** in `src/components/BlockRenderer.tsx`

4. **Add to command palette** in `src/components/CommandPalette.tsx`

### Integrating Real AI

Replace the stub in `src/lib/ai.ts` with your actual API:

```typescript
export async function generateBlocksFromPrompt(prompt: string): Promise<Block[]> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      systemPrompt: generateBlockCatalogPrompt(),
    }),
  });
  
  const json = await response.json();
  return parseAIResponse(json.content);
}
```

### Integrating Real Persistence

Replace the stub in `src/lib/persistence.ts` with your database:

```typescript
export async function saveDocument(doc: BlockDocument): Promise<BlockDocument> {
  const response = await fetch(`/api/documents/${doc.id}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });
  return response.json();
}
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **TipTap** - Rich text editing (built on ProseMirror)
- **Zod** - Schema validation
- **DnD Kit** - Drag and drop
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## License

MIT
