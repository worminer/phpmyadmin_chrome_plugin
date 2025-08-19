# phpMyAdmin Export Helper Chrome Extension
A Chrome extension that adds direct export functionality to phpMyAdmin SQL pages, allowing you to export queries without executing them first.

## Features

- **Direct Export**: Export SQL queries directly without executing them
- **Multiple Formats**: Support for CSV and SQL export formats
- **Easy Integration**: Automatically appears on phpMyAdmin SQL pages
- **User-Friendly**: Simple dropdown selection and export button
- **Debug Mode**: Comprehensive logging for troubleshooting

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the folder containing this extension
5. The extension should now appear in your extensions list

### Method 2: Install from Chrome Web Store (When Available)

1. Visit the Chrome Web Store
2. Search for "phpMyAdmin Export Helper"
3. Click "Add to Chrome"

## Usage

1. Navigate to any phpMyAdmin page with the path `/index.php?route=/table/sql`
2. You'll see a new export section below the SQL query textarea
3. Enter your SQL query in the textarea
4. Select your desired export format (CSV or SQL) from the dropdown
5. Click the "Export Query" button
6. The file will be downloaded automatically

## Debugging

The extension includes comprehensive debugging to help troubleshoot issues:

### Visual Debug Indicator
- A red "DEBUG ON" indicator appears in the top-right corner when debug mode is active
- Click the indicator to toggle debug mode on/off
- Debug mode is enabled by default

### Console Logging
Open the browser console (F12 → Console) to see detailed logs:
- Extension initialization
- Element detection
- Export process details
- Error messages

### Debug Commands
In the browser console, you can use these commands:
```javascript
// Toggle debug mode
window.togglePhpMyAdminDebug()

// Check debug mode status
window.phpMyAdminDebugMode()

// Check if extension is loaded
window.phpMyAdminDebugMode !== undefined
```

### Common Debug Scenarios

#### Extension Not Appearing
1. Check console for initialization logs
2. Verify you're on the correct page path
3. Look for "SQL textarea not found" errors
4. Check if the page has loaded completely

#### Export Button Not Working
1. Check console for export process logs
2. Verify SQL query is entered
3. Look for token extraction errors
4. Check network tab for failed requests

#### Page Path Issues
The extension looks for these URL patterns:
- `/index.php?route=/table/sql` (primary)
- `/index.php?route=/database/sql` (fallback)
- `/index.php?route=/sql` (fallback)

## How It Works

The extension:
- Injects a custom export interface into phpMyAdmin SQL pages
- Captures the SQL query from the textarea
- Sends a POST request to `/index.php?route=/export` with the appropriate parameters
- Handles the response and triggers a file download
- Provides real-time status updates during the export process

## Supported Export Formats

### CSV Export
- Comma-separated values format
- Properly handles NULL values
- Configurable separators and enclosures

### SQL Export
- Standard SQL INSERT statements
- Includes table structure and data
- Configurable options for compatibility

## Technical Details

- **Manifest Version**: 3 (Latest Chrome extension standard)
- **Permissions**: `activeTab`, `scripting` (minimal permissions)
- **Content Scripts**: Automatically injected on matching phpMyAdmin pages
- **Cross-Origin**: Works with any phpMyAdmin installation that I know of

## Troubleshooting

### Export Button Not Appearing
- Ensure you're on a page with the path `/index.php?route=/table/sql`
- Check that the extension is enabled in Chrome
- Refresh the page if needed
- Check console for debug logs

### Export Fails
- Verify you have a valid SQL query in the textarea
- Check that you're logged into phpMyAdmin
- Ensure the phpMyAdmin installation supports the export functionality
- Check the browser console for error messages
- Look for token extraction issues in debug logs

### File Not Downloading
- Check if popup blockers are enabled
- Verify that the phpMyAdmin server is responding correctly
- Check the network tab in Developer Tools for the export request
- Review console logs for response handling details

### Debug Mode Not Working
- Ensure the extension is properly loaded
- Check that content scripts are running
- Verify the debug indicator appears on the page
- Try refreshing the page

## Development

### File Structure
```
phpmyadmin-helper/
├── manifest.json      # Extension manifest
├── content.js         # Main content script
├── README.md          # This file
└── icon*.png          # Extension icons (optional)
```

### Customization
You can modify the export parameters in `content.js` by editing the `exportData` object in the `handleExport` function.

### Debug Mode
To disable debug mode by default, change `let DEBUG_MODE = true;` to `let DEBUG_MODE = false;` in `content.js`.

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this extension.

## Support

If you encounter any issues or have questions, please check the troubleshooting section above or create an issue in the project repository.
