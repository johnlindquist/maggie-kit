import { Configuration, OpenAIApi } from "openai"
import { ChatOpenAI } from "langchain/chat_models"
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts"
import { ConversationChain } from "langchain/chains"
import { CallbackHandlerMethods } from "langchain/callbacks"
import { Shortcut } from "@johnlindquist/kit"

let controller = new AbortController()

export let createAIStreamer = async (systemPrompt: string, modelName = "gpt-4") => {
  return (instructions: string = "", currentText: string = "") => {
    let logPath = tmpPath(`transform-${Date.now()}.txt`)

    let running = false
    let callbacks = [
      {
        handleLLMStart: async (llm, prompt) => {
          running = true
          log({ prompt })
        },
        handleLLMNewToken: async token => {
          if (!token) return
          await editor.append(token)
          await appendFile(logPath, token)
        },
        handleLLMEnd: async () => {
          running = false
          await editor.append("\n\n")
        },
      } as CallbackHandlerMethods,
    ]

    let prompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `{systemPrompt}
  --- Chat History ---    
  {currentText}    
  --- End Chat History ---
      `.trim()
      ),
      HumanMessagePromptTemplate.fromTemplate(`{instructions}`),
    ])

    let llm = new ChatOpenAI({
      modelName,
      streaming: true,
      callbacks,
    })

    let chain = new ConversationChain({
      llm,
      prompt,
    })

    controller = new AbortController()

    chain.call({
      instructions,
      systemPrompt,
      currentText,
      signal: controller.signal,
    })

    return controller
  }
}

type ShortcutsWithDictate = {
  shortcuts: Shortcut[]
  dictate: (input?: string) => void
}

export let createShortcuts = async (
  aiStreamer: Awaited<ReturnType<typeof createAIStreamer>>,
  startWithDictate = false
): Promise<ShortcutsWithDictate> => {
  let config = new Configuration({
    apiKey: await env("OPENAI_API_KEY"),
  })

  let openai = new OpenAIApi(config)

  let onPressStopDictation = async () => {
    await mic.stop()
    await setShortcuts(dictateShortcuts)
  }

  let onPressDictate = async input => {
    await setShortcuts(stopShortcuts)
    let buffer = await mic({
      dot: true,
    })

    let stream = Readable.from(buffer)
    // @ts-ignore
    stream.path = "speech.webm"
    // @ts-ignore (bug in openai)
    let response = await openai.createTranscription(stream, "whisper-1")

    await editor.append(response.data.text)

    await editor.append("\n\n")

    controller = aiStreamer(response.data.text, input)
  }
  let closeShortcut = {
    name: `Close`,
    key: `${cmd}+w`,
    onPress: () => {
      process.exit()
    },
    bar: "left" as const,
  }

  let abortShortcut = {
    name: `Abort`,
    key: `escape`,
    onPress: () => {
      controller.abort()
    },
    bar: "left" as const,
  }

  let stopShortcuts = [
    closeShortcut,
    abortShortcut,
    {
      name: `Stop Dictation`,
      key: `${cmd}+.`,
      onPress: onPressStopDictation,
      bar: "right" as const,
    },
  ]

  let dictateShortcuts = [
    closeShortcut,
    abortShortcut,
    {
      name: `Dictate`,
      key: `${cmd}+.`,
      onPress: onPressDictate,
      bar: "right" as const,
    },
  ]

  return {
    shortcuts: dictateShortcuts,
    dictate: onPressDictate,
  }
}

// This works because esbuild will bundle this file with the main script.
export let filename = path.parse(import.meta.url).name + ".md"
export let docs = await readFile(projectPath("docs", filename), "utf-8")
export let prompt = docs.split("## AI Prompt")?.[1]?.trim()
