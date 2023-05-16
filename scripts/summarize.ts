// Preview: docs
// Name: Summarize Selected Text

import "@johnlindquist/kit"
import { createAIEditor } from "../lib/maggie-kit"

let text = await getSelectedText()

let systemPrompt = `
- Summarize selected text using Markdown
- Lean heavily on using lists
- Place double-square brackets around key words
    Examples:
    - [[key word]]
`

let summarizeEditor = await createAIEditor(systemPrompt)

await summarizeEditor(text)

