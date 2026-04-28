# Texture Manipulator

A powerful web-based texture manipulation tool built with Next.js and TypeScript
that allows you to split and combine texture channels (RGBA) with ease.

## ✨ Features

### 🔄 Channel Splitter

- Upload any texture and split it into separate RGBA channels
- Visualize individual color channels as grayscale textures
- Download each channel as a separate texture file
- Real-time preview of all channels

### 🎨 Channel Combiner

- Combine separate channel textures into a single RGBA texture
- Upload individual textures for Red, Green, Blue, and Alpha channels
- Set default values for channels when no texture is provided
- Interactive sliders for fine-tuning default channel values
- Real-time preview of the combined result

### 🖼️ Texture Resizing

- Automatically resize uploaded textures to a maximum dimension of 4096x4096 pixels
- Maintains aspect ratio during resizing

### **NEW** ❇️ Sprite Extractor

- Upload a sprite sheet and extract individual sprites based on user-defined grid settings
- Specify the number of rows and columns to define the grid
- Optionally skip transparent cells when extracting sprites
- Real-time preview of extracted sprites
- Download extracted sprites as separate PNG files

### 🎯 Key Capabilities

- **Multi-format Support**: Works with PNG, JPEG, WebP, and other common texture formats
- **High Quality Processing**: Maintains texture quality during channel manipulation
- **Intuitive Interface**: Clean, modern UI with dark/light theme support
- **Real-time Processing**: Instant feedback as you adjust parameters
- **Download Ready**: Export results in high quality PNG format

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm (required for Electron support; pnpm currently incompatible)

### Installation

1. Clone the repository:

```shell
git clone https://github.com/thanut-translucia/texture-manipulator.git
cd texture-manipulator
```

2. Install dependencies:

```shell
npm install
```

3. Start the development server:

```shell
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```shell
# Build for production
npm run build

# Start production server
npm start

# Export static files
npm run export
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.8
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI**: React 19.2.1
- **Linting**: ESLint 9
- **Formatting**: Prettier 3.7.4

## 📱 Usage

### Channel Splitter

1. Click on "Channel Splitter" tab
2. Upload an image using the file input
3. View the original image and its separated RGBA channels
4. Download individual channels by clicking the download buttons

### Channel Combiner

1. Click on "Channel Combiner" tab
2. Upload separate images for each channel (R, G, B, A) or use default values
3. Adjust default values using the sliders when no image is uploaded for a channel
4. Preview the combined result in real-time
5. Download the final combined image

## 🎨 Use Cases

- **Texture Creation**: Split textures to edit individual channels for game development
- **Alpha Channel Editing**: Separate and modify transparency information
- **Digital Art**: Create artistic effects by manipulating individual color channels
- **Image Analysis**: Analyze color distribution across different channels
- **Batch Processing**: Process multiple images through channel manipulation
- **Educational**: Learn about color theory and image composition

## Development

### Code Formatting

```shell
# Format code
npm run format

# Check formatting
npm run format:check
```

### Linting

```shell
npm run lint
```

## 🌐 Deployment

### Web Deployment

This project is configured for deployment on GitHub Pages:

```shell
npm run export
```

The built files will be in the `out/` directory, ready for static hosting.

### Desktop App with Electron

The project includes Electron support for building native desktop applications across platforms.

#### Development with Electron

Run the app in development mode with Electron:

```shell
# Start development server with Electron
npm run electron:dev
```

This will start the Next.js development server and launch the Electron app automatically.

#### Building Desktop Applications

##### Prerequisites for Electron Build

- All Node.js dependencies installed
- Platform-specific build tools (automatically handled by electron-builder)

##### Build Commands

```shell
# Build the Next.js app for Electron
npm run build:electron

# Package the app (creates distributable but doesn't build installer)
npm run electron:pack

# Build distributable installers for your current platform
npm run electron:dist
```

##### Platform-Specific Builds

The app will build for your current platform by default:

- **Windows**: Creates NSIS installer (`.exe`)
- **macOS**: Creates DMG file (`.dmg`)
- **Linux**: Creates AppImage (`.AppImage`)

Built applications will be available in the `release/` directory.

##### Configuration

Electron build settings can be customized in `package.json` under the `build` section:

- **App ID**: `com.luvikung.texture-manipulator`
- **Product Name**: "Texture Manipulator"
- **Output Directory**: `release/`

##### Running the Built App

After building, you can run the Electron app directly:

```shell
# Run the Electron app from source
npm run electron
```

Or install and run the generated installer from the `release/` directory.

> **Note**: To create executable installer files when running `npm run electron:dist`, ensure you run the terminal as **Administrator**. This is required for proper file permissions and installer generation on Windows.

##### Troubleshooting Build Issues

###### Missing Sharp Architecture on Windows

If you encounter an error about `@img/sharp-darwin-arm64` when building on Windows, create an empty folder to resolve the dependency:

```shell
mkdir node_modules/@img/sharp-darwin-arm64
```

This allows the build process to continue even though the macOS ARM64 sharp binary isn't needed for Windows builds.

## 📄 License

This project is open source and available under the [MIT No Attribution License](LICENSE.md).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and UI components for enhanced user experience
