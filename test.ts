import { input_select_model } from "./utils";

const model = await input_select_model();
console.log(model.model.modelId)