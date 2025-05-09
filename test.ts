// import handler from "./handler";
// import fs from "node:fs/promises"

// import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// const url = "https://www.pixiv.net/novel/show.php?id=13312682";
// const [{ paragraphArr, series_title, indexPrefix, title }] = await handler(url);

// let text = `file_name: ${indexPrefix}-${title}_translated.txt\n`
// text += `title: ${title}` + "\n"
// text += `URL: ${url}` + "\n"

// text += "請仔細閱讀文章，理解並辨識其中所包含的人名、專有名詞，並翻譯成台灣慣用的繁體中文。人名與專有名詞無需翻譯，維持日文原文即可。**僅輸出翻譯內容**，無須加入額外的說明。 \n```\n"
// text += paragraphArr.join("\n")
// text += "\n```"

// await fs.writeFile("./test.txt", text)



class obj {
    value = 123
    update = (e: number) => {
        this.value = e
    }
}

const state = new obj()

function test(updateFunction: (a: number) => void) {
    updateFunction(456)
}

test(state.update)
console.log(state.value)

// some change
// e.g. new state
