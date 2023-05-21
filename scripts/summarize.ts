// Preview: docs
// Name: Summarize Selected Text
// Author: John Lindquist
// Twitter: @johnlindquist
// Preview: docs

import "@johnlindquist/kit"
import { createAIStreamer, createShortcuts, prompt } from "../lib/maggie-kit"

let text = await getSelectedText()

let aiStreamer = await createAIStreamer(prompt)
let { shortcuts } = await createShortcuts(aiStreamer)

await editor({
  onInit: async () => {
    aiStreamer(text)
  },
  shortcuts,
})
