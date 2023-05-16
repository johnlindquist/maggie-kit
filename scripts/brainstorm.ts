// Preview: docs
// Name: Brainstorm 🧠

import "@johnlindquist/kit"
import { createAIEditor, dictate } from "../lib/maggie-kit"

let systemPrompt = `
- Act as a thought organizer
- The following is a transcript of a dictated brainstorm of wandering thoughts and ideas
- The AI will organize them into key points and action items
`

// The editor has its own internal memory
let brainStormEditor = await createAIEditor(systemPrompt)

while (true) {
  let instructions = await dictate({
    placeholder: `🧠`,
  })

  await brainStormEditor(instructions)
}
