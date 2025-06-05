import OpenAI from 'openai';
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // This is also the default and can be omitted
});
export default openai;
