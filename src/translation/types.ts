import type { LanguageModelV1 } from "ai";
import type { input_one_or_two_step_translation } from "../utils";

export type DoTranslationProps = {
    model: LanguageModelV1;
    divide_line: number;
    with_Cookies?: boolean;
    provider: string;
    one_or_two_step: Awaited<
        ReturnType<typeof input_one_or_two_step_translation>
    >;
};

export type TranslationParameter = {
    provider: string;
    auto_retry: boolean;
    url_string: string;
    start_from: number;
} & DoTranslationProps;

export type TranslateTextParams = {
    paragraphArr: string[];
    divide_line: number;
    model: LanguageModelV1;
    provider: string;
    one_or_two_step: Awaited<
        ReturnType<typeof input_one_or_two_step_translation>
    >;
};
