# Backlog Attachment Cleaner

A web application to bulk delete attachments from Backlog issues.

## Features

- **Issue Attachment Deletion**: Delete files directly attached to issues
- **Comment Attachment Deletion**: Delete files attached to comments
- **Issue Key Range Specification**: Search and delete within specific issue ranges
- **Rate Limit Handling**: Automatic retry functionality to avoid 429 errors
- **Progress Display**: Detailed progress display during deletion process
- **Settings Persistence**: Automatic saving of settings to browser localStorage

## Security

⚠️ **Important Security Notice**

This application operates **client-side only** and handles input information as follows:

### Safe Aspects
- **No Server Transmission**: Confidential information like API keys and space URLs are not sent to external servers
- **Local Storage Only**: Configuration information is stored only in browser localStorage
- **Direct API Communication**: Communicates directly with Backlog API without intermediate servers

### Points to Consider
- **Browser Storage**: Configuration information (including API keys) is stored in browser localStorage
- **Shared PC Usage**: Avoid using on computers accessible by others
- **Browser History**: API communication logs may appear in browser developer tools console

### Recommendations
- Use on personal computers is recommended
- Clear browser history and cache after use
- Use "Private Browsing" mode in shared environments

## Usage

### 1. Online Version (Recommended)

**GitHub Pages**: https://kondo-masaki.github.io/backlog-attachment-cleaner/

- Access directly from browser
- No installation required
- Latest version automatically available

### 2. Local Environment Usage

```bash
# Clone repository
git clone https://github.com/kondo-masaki/backlog-attachment-cleaner.git
cd backlog-attachment-cleaner

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Application Usage

1. **Connection Settings**
   - Backlog Space URL (e.g. https://yourspace.backlog.jp)
   - API Key (obtained from Backlog personal settings)

2. **Project Selection**
   - Select target project after connection

3. **Issue Key Range Specification (Optional)**
   - Specify specific issue range (e.g. PROJ-1 to PROJ-100)
   - All issues targeted if left blank

4. **Search & Delete**
   - Search for issues with attachments
   - Select files to delete
   - Execute bulk deletion

## Technical Specifications

- **Frontend**: React 18
- **Build Tool**: Webpack 5
- **Styling**: CSS
- **API Communication**: Axios
- **Supported Browsers**: Modern browsers (Chrome, Firefox, Safari, Edge)

## API Limitations

- Supports Backlog API rate limiting
- Automatic retry functionality for 429 errors
- Automatic adjustment of deletion process intervals

## Development

```bash
# Start development server
npm run dev

# Production build
npm run build

# Build for GitHub Pages
npm run build:gh-pages

# Deploy to GitHub Pages
npm run deploy
```

## GitHub Pages Deployment

### Automatic Deployment
1. Push repository to GitHub
2. Set Settings > Pages > Source to "GitHub Actions"
3. Automatic deployment on push to main branch

### Manual Deployment
```bash
npm run deploy
```

## License

MIT License

## Disclaimer

The developer assumes no responsibility for any damages caused by the use of this tool.
Please make sure to backup before use and use at your own risk.

## Contributing

Please report bugs and feature requests through GitHub Issues.

