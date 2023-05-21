// Name: Rubber Duck 🐥
// Description: Bounce Ideas off a Rubber Duck
// Author: John Lindquist
// Twitter: @johnlindquist
// Preview: docs

import "@johnlindquist/kit"
import { createAIStreamer, createShortcuts, docs, prompt } from "../lib/maggie-kit"

let aiStreamer = await createAIStreamer(prompt)
let { shortcuts } = await createShortcuts(aiStreamer)

await editor({
  previewWidthPercent: 25,
  preview: md(docs),
  shortcuts,
})
