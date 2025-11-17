import {ModelMessage, Output, stepCountIs, streamText, tool, ToolApprovalRequest} from "ai"
import * as readline from "node:readline/promises"
import { ollama } from 'ollama-ai-provider-v2';
import z from "zod";


const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const LLM_MODEL_NAME = process.env.MODEL_NAME;

if(!LLM_MODEL_NAME){
    throw new Error("Please set the MODEL_NAME environment variable in your .env file")
}

const LLM = ollama(LLM_MODEL_NAME)

const messages: ModelMessage[] = []

async function main(){
    while(true){
        const userInput = await terminal.question("You: ")

        messages.push({role: "user", content: userInput})

        // ollama integration
        const result = streamText({
            model: LLM,
            messages,
            tools: {
                date: tool({
                    description: "Use this tool when the user asks about the curret date. Get the current date and time as a string",
                    inputSchema: z.object({}),
                    execute: async () => {
                        return new Date().toString()
                    }
                }),
                weather: tool({
                    description: "Get the weather in a location (celsius)",
                    inputSchema: z.object({
                        location: z.string().min(2).max(100)
                    }),
                    execute: async (input) => {
                        const { location } = input
                        const response = await fetch (`http://goweather.xyz/weather/${location}`)
                        const data = await response.json()
                        return data
                    },
                })
            },
            stopWhen: stepCountIs(5),
            onStepFinish: async ({toolResults})=>{
                if(toolResults.length === 0) return
                console.log(JSON.stringify(toolResults, null, 2))
            },
        })
        let assistantResponse = ''
        process.stdout.write("\nPossum AI: ")
        for await (const delta of result.textStream){
            assistantResponse += delta
            process.stdout.write(delta)
        }
        process.stdout.write("\n\n")

        messages.push({role: 'assistant', content: assistantResponse})
    }
}
main().catch(console.error)