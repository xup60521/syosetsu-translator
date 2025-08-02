import { generateText } from "ai";
import { input_select_model } from "./utils";

const model = await input_select_model();
const { text } = await generateText({ model: model.model, prompt: "Hello, world!" });
console.log(text);