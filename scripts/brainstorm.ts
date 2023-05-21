// Name: Brainstorm 🧠
// Description: Dictate Your Thoughts
// Author: John Lindquist
// Twitter: @johnlindquist
// Preview: docs

import "@johnlindquist/kit"
import { createAIStreamer, createShortcuts, docs, prompt } from "../lib/maggie-kit"

let aiStreamer = await createAIStreamer(prompt)
let { shortcuts, dictate } = await createShortcuts(aiStreamer)

await editor({
  onInit: dictate,
  previewWidthPercent: 25,
  preview: md(docs),
  shortcuts,
})
