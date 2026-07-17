import { pipeline } from '@xenova/transformers';

async function main() {
  const generator = await pipeline('text-generation', 'Xenova/TinyLlama-1.1B-Chat-v1.0');
  const chatMessages = [
    { role: 'user', content: 'Please summarize this document.' }
  ];
  
  if (typeof generator.tokenizer.apply_chat_template === 'function') {
    const prompt = generator.tokenizer.apply_chat_template(chatMessages, {
      tokenize: false,
      add_generation_prompt: true,
    });
    console.log("PROMPT:", prompt);
  } else {
    console.log("apply_chat_template is NOT a function");
  }
}
main();
