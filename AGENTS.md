# AGENTS.md - Coding Agent Instructions

Monorepo with AI SDK experimentation projects. Uses **pnpm** as the package manager.

## Repository Structure

- **my-ai-app/** - Node.js/Express backend with AI SDK, Drizzle ORM, and RAG
- **test-ai-sdk-ui/** - React + Vite frontend with AI SDK UI (React 19, Tailwind v4)

Both use **TypeScript** with ES modules.

## Build/Lint/Test Commands

### my-ai-app (Backend)

```bash
cd my-ai-app

# Development
pnpm dev              # Start dev server with hot reload
pnpm terminal         # Run terminal CLI
pnpm agent            # Run agent CLI

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Drizzle Studio

# Linting
pnpm lint             # Check with ultracite
pnpm lint:fix         # Auto-fix issues

# Other
pnpm ingest           # Run document ingestion
```

### test-ai-sdk-ui (Frontend)

```bash
cd test-ai-sdk-ui

pnpm dev              # Start Vite dev server
pnpm build            # Build for production (tsc + vite build)
pnpm preview          # Preview production build

# Linting
pnpm lint             # Run ESLint
pnpm biome:check      # Run Biome check
pnpm ultracite:fix    # Auto-fix with ultracite
```

### Running Tests

```bash
# Run single test file with vitest (installed in my-ai-app)
npx vitest run path/to/test.ts

# Run all tests with verbose output
npx vitest run --reporter=verbose

# Watch mode for development
npx vitest
```

**Testing best practices:**
- Write assertions inside `it()` or `test()` blocks
- Use async/await, not done callbacks
- Don't commit `.only` or `.skip` in tests
- Keep test suites flat, avoid excessive nesting

## Code Style Guidelines

### Linting & Formatting

- **Ultracite** (Biome-based) is used in both projects
- Configuration in `biome.jsonc` in each project
- Run `pnpm lint:fix` before committing
- Most issues auto-fixed; focus on business logic and naming

### TypeScript Conventions

- Use **ES modules** (`"type": "module"`)
- **Strict mode** - no implicit any
- Use `const` by default, `let` only when reassigning, never `var`
- Prefer explicit types for function parameters and return values
- Use `unknown` over `any` when type is genuinely unknown
- Use const assertions (`as const`) for immutable values
- Use type narrowing instead of type assertions
- Path alias: `@/*` maps to project root

### Import Ordering

```typescript
// 1. External packages
import { convertToModelMessages } from "ai";
import cors from "cors";

// 2. Internal absolute imports (sorted)
import { ragAgent } from "@/lib/ai/agents/rag-agent";

// 3. Type imports
import type { UIMessage } from "ai";
import type { Request, Response } from "express";
```

### Modern JavaScript/TypeScript Patterns

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer template literals over string concatenation
- Use destructuring for objects and arrays
- Use `async/await` instead of promise chains

### Naming Conventions

- **Variables/functions**: camelCase (`myVariable`, `doSomething()`)
- **Types/interfaces**: PascalCase (`UserData`, `ApiResponse`)
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Files**: camelCase or kebab-case (match existing patterns)
- **React components**: PascalCase (`ChatMessage.tsx`)

### React Specific (test-ai-sdk-ui)

- Use function components, not class components
- Hooks at top level only, never conditionally
- Specify all dependencies in hook arrays correctly
- Use `key` prop with unique IDs (not array indices)
- React 19+: Use ref as prop instead of `React.forwardRef`
- Nest children between tags instead of passing as props
- Don't define components inside other components

### Accessibility Requirements

- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Provide meaningful `alt` text for images
- Use proper heading hierarchy (h1 → h2 → h3)
- Add labels for form inputs
- Include keyboard handlers alongside mouse events
- Use ARIA attributes when semantic HTML isn't enough

### Error Handling

- Remove `console.log`, `debugger`, and `alert` from production code
- Throw `Error` objects with descriptive messages, not strings
- Use `try-catch` meaningfully - don't catch just to rethrow
- Prefer early returns over nested conditionals for error cases
- Check if headers sent before sending error response (Express)

### Code Organization

- Keep functions focused and under reasonable complexity
- Extract complex conditions into well-named booleans
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together, separate concerns
- Avoid barrel files (index files that re-export everything)

### Security Best Practices

- Add `rel="noopener"` with `target="_blank"` links
- Avoid `dangerouslySetInnerHTML` unless necessary
- Don't use `eval()` or assign to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals, not created in loops
- Prefer specific imports over namespace imports
- Use proper image components over `<img>` tags

## Pre-commit Checklist

1. Run `pnpm lint:fix` to auto-fix formatting and imports
2. Ensure TypeScript compiles without errors (`tsc --noEmit`)
3. Remove any debug `console.log` statements
4. Verify error handling is appropriate
5. Test the specific feature you modified

## Environment Setup

Both projects use `.env` files for configuration. Check `.env.example` files for required variables.

## Additional Resources

Both projects have detailed rules in `.github/copilot-instructions.md` covering:
- Ultracite code standards
- Type safety guidelines
- React patterns
- Testing best practices

These are automatically enforced via linting.
