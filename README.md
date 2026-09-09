# Mime Apps

> Browse and change default applications for file types (mimeapps.list) on Linux

## 🎯 Features

- Browse every configured default application, grouped by mime type category
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

Run **Default Applications** to see every mime type with a configured default, grouped by category (application, audio, image, text, video, inode, x-scheme-handler, ...). Search filters by mime type. From an entry:

- **Set Default App** — pick an app from the ones that declare support for that mime type
- **Reset to System Default** — remove your override
- **Copy Mime Type**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.