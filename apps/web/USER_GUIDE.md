# Syosetsu Translator User Guide

Welcome to **Syosetsu Translator**, a powerful web application designed to help you translate and archive Japanese web novels from platforms like Syosetsu and Kakuyomu directly to your Google Drive using advanced AI models.

---

## 🚀 Getting Started

To use the application effectively, you need to complete a one-time setup of your storage and AI provider credentials.

### 1. Authentication
- Click the **Login** button on the top right.
- Sign in with your **Google Account**. This is required to integrate with Google Drive for saving your translated novels.

### 2. Configure Storage (Google Drive)
- Navigate to **Settings > Storage**.
- Ensure your Google Drive is connected.
- Use the **Folder Picker** to select a destination folder in your Google Drive where translated files will be saved.
- *Tip: Create a dedicated folder like "Translated Novels" in your Drive first.*

### 3. Add AI Provider API Keys
- Navigate to **Settings > API Keys**.
- Click **Add API Key**.
- Select your preferred provider (e.g., OpenAI, Anthropic, Google AI Studio, OpenRouter).
- Paste your API key and give it a memorable name.
- Click **Save**.

---

## 📖 How to Translate a Novel

Once your setup is complete, you can start translating novels in a few simple steps.

### Step 1: Input Novel URL
- On the **Home** page, paste the URL of the novel you want to translate (e.g., a Syosetsu or Kakuyomu table of contents page).
- Click **Go** or press Enter.

### Step 2: Browse and Select
- You will be taken to the **Novel View**.
- The left sidebar displays the list of chapters/episodes.
- Click on a chapter to preview the original Japanese content in the main area.
- **Select Chapters**: Use the checkboxes in the sidebar to select one or more chapters you wish to translate.

### Step 3: Configure Translation
- Click the **Translate** button (usually appears after selecting chapters).
- In the **Translation Dialogue**:
    - **Provider**: Choose the AI provider you added earlier.
    - **API Key**: Select the specific key to use.
    - **Model**: Choose the AI model (e.g., `gpt-4o`, `claude-3-5-sonnet`, `gemini-1.5-pro`).
    - **Batch Size**: Adjust how many chapters are processed together (default is usually fine).
- Click **Start Translation**.

### Step 4: Track Progress
- You can monitor the status of your translation in the **History** section.
- The app uses background workflows, so you can close the tab or browse other novels while it works.
- Once finished, the translated `.docx` or `.txt` file will appear in your configured Google Drive folder.

---

## 🛠️ Advanced Features

### Keyword Replacement
The translator includes a specialized dictionary to ensure consistent translation of names and terms for popular series. This prevents "The Hero" from becoming "The Protagonist" or "Leads" in different chapters.

### Multi-Source Support
Supported platforms include:
- **Syosetsu** (ncode.syosetsu.com)
- **Kakuyomu** (kakuyomu.jp)
- **Alphapolis** (alphapolis.co.jp)
- **Pixiv Novel** (pixiv.net)

---

## 💡 Tips for Best Results

- **Model Selection**: For the highest quality literary translation, **Claude 3.5 Sonnet** or **GPT-4o** are highly recommended.
- **Cost Management**: Use **Gemini 1.5 Flash** or **GPT-4o-mini** for a more cost-effective translation of long series.
- **Folder Organization**: You can change the destination folder in settings at any time to organize different series into different Drive folders.

---

## ❓ Troubleshooting

- **Translation Stuck?**: Check the **History** page for error logs. Ensure your API key has sufficient credits.
- **Files Not Appearing?**: Re-verify your **Storage Settings** and ensure the app still has permission to access your Google Drive.
- **URL Not Recognized?**: Double-check that the URL is from a supported platform and points to either the table of contents or a specific chapter.

---
*Happy Reading!*
