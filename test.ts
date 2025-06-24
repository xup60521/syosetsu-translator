import { pixiv_handler } from "./novel_handler/pixiv";
import { url_string_handler } from "./url_string_handler";


const urls = await url_string_handler("https://www.pixiv.net/novel/series/10899513")
console.log(urls);