# GEMINI.md

## Project Overview

This project is a command-line tool built with TypeScript and Bun for translating Japanese web novels from Syosetsu and other sources into Traditional Chinese. It leverages various AI models for translation and includes features for handling cookies, retrying failed translations, and replacing specific words in the output.

The tool is interactive, using prompts to guide the user through the translation process, including selecting the AI model, providing the novel's URL, and choosing between one-step or two-step translation.

## Building and Running

### Prerequisites

*   [Bun](https://bun.sh/)

### Installation

To install the dependencies, run:

```bash
bun install
```

### Running the Application

To start the translation tool, run:

```bash
bun run index.ts
```

This will launch an interactive command-line interface that will guide you through the translation process.

### Building the Project

To build the project for production, run:

```bash
bun run build
```

This will create a production-ready build in the `out` directory.

## Development Conventions

### Project Structure

*   `index.ts`: The main entry point of the application, which handles the main menu and user selections.
*   `src/`: Contains the core logic of the application.
    *   `translation/`: This directory contains all the logic related to the translation process.
        *   `index.ts`: The main file for the translation process, which orchestrates the different steps.
        *   `prompts.ts`: Contains the prompts used to instruct the AI models for translation.
        *   `translateText.ts`: Handles the actual text translation, including chunking the text, calling the AI model, and handling retries.
        *   `translation-utils.ts`: Provides utility functions for the translation process, such as progress bars and sleep functions.
    *   `url_handler/`: This directory is responsible for handling URLs, including fetching the content and extracting the novel's text.
    *   `utils.ts`: Contains various utility functions used throughout the application, such as user input prompts and model selection.
    *   `replace.ts`: Implements the functionality for replacing specific words in the translated text.
*   `output/`: The default directory where the translated `.txt` files are saved.

### Key Dependencies

*   `@ai-sdk/*`: A suite of libraries for interacting with various AI models.
*   `@inquirer/prompts`: For creating interactive command-line prompts.
*   `cheerio`: For parsing HTML and extracting content from the novel's web page.
*   `cli-progress`: To display progress bars for the translation process.
*   `bun`: Used as the runtime, package manager, and bundler.
