import { ChatOpenAI } from "langchain/chat_models"
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from "langchain/prompts"
import { ConversationChain } from "langchain/chains"
import { CallbackHandlerMethods } from "langchain/callbacks"

type DictateProps = {
  placeholder?: string
  preview?: string
}

let defaultDictateProps:DictateProps = {
  placeholder: `Recording...`,
  preview: `Speak into the microphone and I'll transcribe it.`,
}
export let dictate = async ({placeholder, preview}:DictateProps = defaultDictateProps) => {
  let { Configuration, OpenAIApi } = await import("openai")
  let config = new Configuration({
    apiKey: await env("OPENAI_API_KEY"),
  })

  let openai = new OpenAIApi(config)
  let buffer = await mic({
    placeholder,
    preview,
  })

  let html = `<div class="h-full w-full flex flex-col justify-center items-center text-text-base">
  <h1 class="text-5xl animate-pulse">Whispering...</h1>
</div>`

  return await div({
    html,
    ignoreBlur: true,
    onInit: async el => {
      let stream = Readable.from(buffer)
      // https://github.com/openai/openai-node/issues/77#issuecomment-1463150451
      // @ts-ignore
      stream.path = "speech.webm"
      // @ts-ignore
      let response = await openai.createTranscription(stream, "whisper-1")
      submit(response.data.text)
    },
  })
}

// We're manually managing "memory" to get the current text from the editor
export let createAIEditor = async (systemPrompt: string, modelName = "gpt-4") => {
  let editorText = ``
  return async (instructions: string) => {
    let { default: Bottleneck } = await import("bottleneck")
    let limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 0,
    })
  
    let running = false
  
    let logPath = tmpPath(`transform-${Date.now()}.txt`)
  
    let callbacks = [
      {
        handleLLMStart: async (llm, prompt) => {
          running = true
          log({ prompt })
        },
        handleLLMNewToken: limiter.wrap(async token => {
          if (!token) return
          await editor.append(token)
          await appendFile(logPath, token)
        }),
        handleLLMEnd: async () => {
          running = false
        },
      } as CallbackHandlerMethods,
    ]
  
    let prompt = ChatPromptTemplate.fromPromptMessages([
      SystemMessagePromptTemplate.fromTemplate(
        `{systemPrompt}
  --- Chat History ---    
  {editorText}    
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
  
  
    let controller = new AbortController()
  
    let chain = new ConversationChain({
      llm,
      prompt,
    })
  

    let value = `${editorText}
    
${instructions}`.trim()

    return editor({
      value: value + `\n\n`,
      onSubmit: async input => {
        editorText = input
      },
      shortcuts: [
        // {
        //   name: "Stop Generating",
        //   key: `${cmd}+0`,
        //   onPress: async input => {
        //     editorText = input
        //     log({ running })
        //     if (running) controller.abort()
        //   },
        //   bar: "right",
        // },
        // Experimental: Not working correctly
        // {
        //   name: "Generate More",
        //   key: `${cmd}+2`,
        //   onPress: async input => {
        //     editorText = input
        //     new ConversationChain({
        //       llm,
        //       prompt,
        //     }).call({
        //       instructions: `Complete the sentence from right before "End Chat History". Make sure to follow any previous rules.`,
        //       systemPrompt,
        //       editorText,
        //       signal: getSignal(),
        //     })
        //   },
        //   bar: "right",
        // },
        {
          name: "Dictate More",
          key: `${cmd}+.`,
          bar: "right",
          onPress: async input => {
            editorText = input
            if (running) controller.abort()
            submit(input)
          },
        },
        {
          name: "Close",
          key: `${cmd}+w`,
          onPress: async input => {
            editorText = input
            if (running) controller.abort()
            let finalLogPath = tmpPath(`conversation-${Date.now()}.txt`)
            await writeFile(finalLogPath, editorText)
            process.exit()
          },
          bar: "left"
        }
      ],
      scrollTo: "bottom",
      onInit: async () => {
        chain.call({
          instructions,
          systemPrompt,
          editorText,
          signal: controller.signal,
        })
      },
      onEscape: async input => {
        if(running) {
          controller.abort()
        }else{
          process.exit()
        }
      },
    })
  }
}
