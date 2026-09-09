# Mime Apps

> Browse and change default applications for file types (mimeapps.list) on Linux

## 🎯 Features

- Browse every mime type any installed app can open — not just ones with a default already set — grouped by category
- Change the default app for any mime type, from a list of installed apps that declare support for it
- Fall back to browsing every installed app if none declare support (or the declaration is wrong)
- Reset a mime type back to the system-wide default
- Real app names and icons, resolved from `.desktop` files (including Flatpak exports)

## 🚀 Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) (recommended version 24 or higher)
- Linux with `xdg-mime` available and a `~/.config/mimeapps.list` (created automatically the first time you set a default)

### Installation

This extension is not yet published to the Vicinae Store. Install it by building from source below.

### Build From Source

1. Clone the repository:
   ```bash
   git clone https://github.com/brpaz/vicinae-mimeapps.git
2. Navigate to the project directory:
   ```bash
   cd mime-apps
3. Install dependencies:
   ```bash
   npm i
4. Build the project:
   ```bash
   npm run build
   ```

This will install the extension in `~/.local/share/vicinae/extensions`, and will be available immediately on your Vicinae app.

## Development

In development, you can use the following command to watch for changes and rebuild your extension automatically:

```bash
npm run dev
```

## 🧰 Usage

Run **Mime Types** to see every mime type known on your system — either because you've configured a default for it, or because some installed app declares it can open it — grouped by category (application, audio, image, text, video, inode, x-scheme-handler, ...). Search filters by mime type, app name, or desktop id. Mime types with no default yet show "No default set"; ones pointing at a `.desktop` id that no longer exists show a warning. From an entry:

- **Set Default App** — pick an app from the ones that declare support for that mime type
- **Reset to System Default** — remove your override (only shown when one is set)
- **Copy Mime Type**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.