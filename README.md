# Image Manipulator

A powerful web-based image manipulation tool built with Next.js and TypeScript
that allows you to split and combine image channels (RGBA) with ease.

## ✨ Features

### 🔄 Channel Splitter

- Upload any image and split it into separate RGBA channels
- Visualize individual color channels as grayscale images
- Download each channel as a separate image file
- Real-time preview of all channels

### 🎨 Channel Combiner

- Combine separate channel images into a single RGBA image
- Upload individual images for Red, Green, Blue, and Alpha channels
- Set default values for channels when no image is provided
- Interactive sliders for fine-tuning default channel values
- Real-time preview of the combined result

### 🎯 Key Capabilities

- **Multi-format Support**: Works with PNG, JPEG, WebP, and other common image formats
- **High Quality Processing**: Maintains image quality during channel manipulation
- **Intuitive Interface**: Clean, modern UI with dark/light theme support
- **Real-time Processing**: Instant feedback as you adjust parameters
- **Download Ready**: Export results in high quality PNG format

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

```shell
git clone https://github.com/thanut-translucia/image-manipulator.git
cd image-manipulator
```

2. Install dependencies:

```shell
pnpm install
```

3. Start the development server:

```shell
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Build

```shell
# Build for production
pnpm build

# Start production server
pnpm start

# Export static files
pnpm export
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

## 📂 Project Structure

```text
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Main application page
│   └── not-found.tsx        # 404 page
└── components/
    ├── imagechannelsplitter.tsx    # Channel splitting component
    └── imagechannelcombiner.tsx    # Channel combining component
```

## 🔧 Development

### Code Formatting

```shell
# Format code
pnpm format

# Check formatting
pnpm format:check
```

### Linting

```shell
pnpm lint
```

## 🌐 Deployment

### Web Deployment

This project is configured for deployment on GitHub Pages:

```shell
pnpm export
```

The built files will be in the `out/` directory, ready for static hosting.

### Desktop App with Electron

The project includes Electron support for building native desktop applications across platforms.

#### Development with Electron

Run the app in development mode with Electron:

```shell
# Start development server with Electron
pnpm electron:dev
```

This will start the Next.js development server and launch the Electron app automatically.

#### Building Desktop Applications

##### Prerequisites for Electron Build

- All Node.js dependencies installed
- Platform-specific build tools (automatically handled by electron-builder)

##### Build Commands

```shell
# Build the Next.js app for Electron
pnpm build:electron

# Package the app (creates distributable but doesn't build installer)
pnpm electron:pack

# Build distributable installers for your current platform
pnpm electron:dist
```

##### Platform-Specific Builds

The app will build for your current platform by default:

- **Windows**: Creates NSIS installer (`.exe`)
- **macOS**: Creates DMG file (`.dmg`)
- **Linux**: Creates AppImage (`.AppImage`)

Built applications will be available in the `release/` directory.

##### Configuration

Electron build settings can be customized in `package.json` under the `build` section:

- **App ID**: `com.luvikung.image-manipulator`
- **Product Name**: "Image Manipulator"
- **Output Directory**: `release/`

##### Running the Built App

After building, you can run the Electron app directly:

```shell
# Run the Electron app from source
pnpm electron
```

Or install and run the generated installer from the `release/` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons and UI components for enhanced user experience
