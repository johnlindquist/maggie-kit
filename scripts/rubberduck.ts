// Preview: docs
// Name: Rubberduck 🐥

import "@johnlindquist/kit"
import { createAIEditor, dictate } from "../lib/maggie-kit"

let systemPrompt = `
- Act as a "rubberduck" that helps someone solve a problem.
- The following is a transcript of dictated text
- The AI will begin offering suggestions
- The suggestions should be concise and in a numbered list
`

// The editor has its own internal memory
let rubberDuckEditor = await createAIEditor(systemPrompt)

while (true) {
  let instructions = await dictate({
    placeholder: `🐥`,
  })

  await rubberDuckEditor(instructions)
}
