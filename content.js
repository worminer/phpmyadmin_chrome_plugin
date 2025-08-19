// phpMyAdmin Export Helper Content Script
(function() {
  'use strict';

  // Settings - Easy to modify
  const settings = {
    debug: false  // Set to true to enable debug mode
  };

  // Make debug mode toggleable from console
  window.togglePhpMyAdminDebug = function() {
    settings.debug = !settings.debug;
    console.log(`[phpMyAdmin Export Helper] Debug mode ${settings.debug ? 'ENABLED' : 'DISABLED'}`);
    return settings.debug;
  };

  // Make debug mode accessible globally
  window.phpMyAdminDebugMode = function() {
    return settings.debug;
  };

  // Logging function
  function log(message, data = null) {
    if (settings.debug) {
      const timestamp = new Date().toISOString();
      const logMessage = `[phpMyAdmin Export Helper ${timestamp}] ${message}`;
      console.log(logMessage);
      if (data) {
        console.log('Data:', data);
      }
    }
  }

  // Add visual debug indicator
  function addDebugIndicator() {
    if (!settings.debug) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'pma-debug-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ff6b6b;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      z-index: 10000;
      cursor: pointer;
    `;
    indicator.textContent = 'DEBUG ON';
    indicator.title = 'Click to toggle debug mode';
    
    indicator.addEventListener('click', () => {
      window.togglePhpMyAdminDebug();
      indicator.textContent = settings.debug ? 'DEBUG ON' : 'DEBUG OFF';
      indicator.style.background = settings.debug ? '#ff6b6b' : '#6b6b6b';
    });
    
    document.body.appendChild(indicator);
    log('Debug indicator added to page');
  }

  // Wait for the page to be fully loaded
  function waitForElement(selector, callback, maxTries = 50) {
    if (maxTries <= 0) {
      log(`Failed to find element: ${selector} after 50 attempts`);
      return;
    }
    
    const element = document.querySelector(selector);
    if (element) {
      log(`Found element: ${selector}`);
      callback(element);
    } else {
      log(`Element not found: ${selector}, attempt ${51 - maxTries}/50`);
      setTimeout(() => waitForElement(selector, callback, maxTries - 1), 100);
    }
  }

  // Get SQL query from either textarea or CodeMirror editor
  function getSqlQuery() {
    const sqlTextarea = document.querySelector('textarea[name="sql_query"]');
    if (!sqlTextarea) {
      log('ERROR: SQL textarea not found');
      return null;
    }

    log('Found SQL textarea:', sqlTextarea);
    log('Textarea value:', sqlTextarea.value);
    log('Textarea next sibling:', sqlTextarea.nextElementSibling);

    // Check if CodeMirror is being used
    if (sqlTextarea.nextElementSibling && 
        sqlTextarea.nextElementSibling.classList.contains('CodeMirror')) {
      log('CodeMirror detected, reading from editor instance');
      
      // Try to get the CodeMirror instance
      const codeMirrorElement = sqlTextarea.nextElementSibling;
      const codeMirrorInstance = codeMirrorElement.CodeMirror;
      
      if (codeMirrorInstance && codeMirrorInstance.getValue) {
        const query = codeMirrorInstance.getValue();
        log('Got query from CodeMirror instance:', query);
        log('CodeMirror method: instance.getValue()');
        return cleanSqlQuery(query);
      } else {
        log('CodeMirror instance found but getValue method not available');
        log('CodeMirror element:', codeMirrorElement);
        // Fallback: try to get from the CodeMirror text content
        const codeMirrorText = codeMirrorElement.querySelector('.CodeMirror-code');
        if (codeMirrorText) {
          const query = codeMirrorText.textContent || codeMirrorText.innerText;
          log('Got query from CodeMirror DOM:', query);
          log('CodeMirror method: DOM textContent/innerText');
          return cleanSqlQuery(query);
        }
      }
    } else {
      log('No CodeMirror detected, using regular textarea');
    }

    // Fallback to regular textarea value
    log('Using regular textarea value');
    log('Textarea method: textarea.value');
    return cleanSqlQuery(sqlTextarea.value);
  }

  // Clean and decode SQL query text
  function cleanSqlQuery(query) {
    if (!query) return '';
    
    log('Raw query before cleaning:', query);
    
    // Create a temporary div to decode HTML entities
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = query;
    let cleaned = tempDiv.textContent || tempDiv.innerText || '';
    
    // If the above didn't work, try direct replacement
    if (cleaned === query) {
      cleaned = query
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ');
    }
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Remove any non-SQL characters that might have been prepended
    // Look for common SQL keywords and start from there
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
    let startIndex = 0;
    
    for (const keyword of sqlKeywords) {
      const index = cleaned.toUpperCase().indexOf(keyword);
      if (index !== -1) {
        startIndex = index;
        break;
      }
    }
    
    if (startIndex > 0) {
      cleaned = cleaned.substring(startIndex);
      log('Removed prefix, query now starts with:', cleaned.substring(0, 20));
    }
    
    log('Cleaned query:', cleaned);
    return cleaned;
  }

  // Create the export button and select
  function createExportControls() {
    log('Starting createExportControls function');
    
    // Check if we already added the controls
    if (document.getElementById('pma-export-helper')) {
      log('Export controls already exist, skipping');
      return;
    }

    // Find the SQL query textarea
    const sqlTextarea = document.querySelector('textarea[name="sql_query"]');
    if (!sqlTextarea) {
      log('ERROR: SQL textarea not found');
      log('Available textareas:', document.querySelectorAll('textarea'));
      log('Page URL:', window.location.href);
      
      // Try alternative selectors
      const alternativeSelectors = [
        'textarea[name="sqlquery"]',
        'textarea[name="query"]',
        'textarea[id*="sql"]',
        'textarea[id*="query"]',
        'textarea[placeholder*="SQL"]',
        'textarea[placeholder*="query"]'
      ];
      
      log('Trying alternative selectors...');
      alternativeSelectors.forEach(selector => {
        const altElement = document.querySelector(selector);
        if (altElement) {
          log(`Found alternative element: ${selector}`, altElement);
        }
      });
      
      return;
    }

    log('Found SQL textarea:', sqlTextarea);

    // Get the textarea dimensions for consistent sizing
    const textareaRect = sqlTextarea.getBoundingClientRect();
    const textareaWidth = textareaRect.width;
    const textareaHeight = textareaRect.height;

    log('Textarea dimensions:', { width: textareaWidth, height: textareaHeight });

    // Create container for export controls - place it AFTER the textarea, outside any forms
    const exportContainer = document.createElement('div');
    exportContainer.id = 'pma-export-helper';
    exportContainer.style.cssText = `
      margin: 3px 0;
      padding: 3px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background-color: #f9f9f9;
      display: flex;
      align-items: center;
      gap: 4px;
    `;

    // Create CSV/SQL export type selector
    const exportTypeSelect = document.createElement('select');
    exportTypeSelect.id = 'pma-export-type';
    exportTypeSelect.style.cssText = `
      padding: 2px 6px;
      border: 1px solid #ccc;
      border-radius: 3px;
      font-size: 13px;
      background-color: white;
    `;

    // Create plugin icon
    const pluginIcon = document.createElement('span');
    pluginIcon.innerHTML = '🔌'; // Plugin icon
    pluginIcon.style.cssText = `
      font-size: 14px;
      margin-right: 2px;
      opacity: 0.8;
      cursor: help;
    `;
    pluginIcon.title = 'phpMyAdmin Export Helper Extension';

    const csvOption = document.createElement('option');
    csvOption.value = 'csv';
    csvOption.textContent = 'CSV Export';
    
    const sqlOption = document.createElement('option');
    sqlOption.value = 'sql';
    sqlOption.textContent = 'SQL Export';

    exportTypeSelect.appendChild(csvOption);
    exportTypeSelect.appendChild(sqlOption);

    // Create export button
    const exportButton = document.createElement('button');
    exportButton.id = 'pma-export-btn';
    exportButton.textContent = 'Export Query';
    exportButton.type = 'button'; // IMPORTANT: Prevent form submission
    exportButton.style.cssText = `
      padding: 2px 8px;
      background-color: #007cba;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
    `;

    // Add hover effect
    exportButton.addEventListener('mouseenter', () => {
      exportButton.style.backgroundColor = '#005a87';
    });
    exportButton.addEventListener('mouseleave', () => {
      exportButton.style.backgroundColor = '#007cba';
    });

    // Add click handler with explicit event prevention
    exportButton.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      log('Export button clicked, preventing default form submission');
      handleExport();
      return false; // Extra safety
    });

    // Create status message
    const statusMsg = document.createElement('div');
    statusMsg.id = 'pma-export-status';
    statusMsg.style.cssText = `
      margin-left: 10px;
      font-size: 14px;
      color: #666;
      flex: 1;
      min-width: 150px;
    `;

    // Add all elements to container
    exportContainer.appendChild(pluginIcon); // Add plugin icon
    exportContainer.appendChild(exportTypeSelect);
    exportContainer.appendChild(exportButton);
    exportContainer.appendChild(statusMsg);

    // Insert AFTER the textarea, completely outside any forms
    try {
      // Find the textarea's parent container and insert after it
      const textareaParent = sqlTextarea.parentElement;
      const insertAfter = textareaParent.nextSibling;
      
      if (insertAfter) {
        textareaParent.parentNode.insertBefore(exportContainer, insertAfter);
      } else {
        textareaParent.parentNode.appendChild(exportContainer);
      }
      
      log('Successfully inserted export controls below query input box');
      log('Export container created:', exportContainer);
    } catch (error) {
      log('ERROR: Failed to insert export controls:', error);
    }
  }

  // Handle export functionality
  async function handleExport() {
    log('Export button clicked, starting export process');
    
    const exportType = document.getElementById('pma-export-type').value;
    const sqlQuery = getSqlQuery();
    const statusMsg = document.getElementById('pma-export-status');
    const exportButton = document.getElementById('pma-export-btn');

    if (!sqlQuery || sqlQuery.trim() === '') {
      log('ERROR: No SQL query found');
      statusMsg.textContent = 'Please enter a SQL query first.';
      statusMsg.style.color = '#d32f2f';
      return;
    }

    log('SQL Query resolved from getSqlQuery():', sqlQuery);
    log('Query length:', sqlQuery.length);
    log('Query type:', typeof sqlQuery);

    // Disable button and show loading
    exportButton.disabled = true;
    exportButton.textContent = 'Exporting...';
    statusMsg.textContent = 'Preparing export...';
    statusMsg.style.color = '#1976d2';

    try {
      // Get current page URL to extract base URL and parameters
      const currentUrl = new URL(window.location.href);
      const baseUrl = currentUrl.origin + currentUrl.pathname;
      
      log('Current URL:', window.location.href);
      log('Base URL:', baseUrl);
      
      // Extract database and table from URL or form
      const urlParams = new URLSearchParams(window.location.search);
      const db = urlParams.get('db') || '';
      const table = urlParams.get('table') || '';
      
      log('URL parameters:', { db, table });
      log('Full URL search params:', window.location.search);
      
      // Get token from the page (look for hidden input or extract from URL)
      let token = '';
      const tokenInput = document.querySelector('input[name="token"]');
      if (tokenInput) {
        token = tokenInput.value;
        log('Found token in hidden input:', token);
      } else {
        // Try to extract from URL
        const tokenMatch = window.location.href.match(/[?&]token=([^&]+)/);
        if (tokenMatch) {
          token = tokenMatch[1];
          log('Found token in URL:', token);
        } else {
          log('WARNING: No token found in hidden input or URL');
        }
      }

      // Log all form inputs for debugging
      log('All form inputs found:');
      document.querySelectorAll('input').forEach(input => {
        log(`  ${input.name}: ${input.value}`);
      });

      // Prepare export data - match exactly the working request parameters from network tab
      const exportData = new URLSearchParams();
      
      // Send critical parameters first, in the exact order from working request
      exportData.append('db', db);
      exportData.append('table', table);
      exportData.append('export_type', 'table');
      exportData.append('export_method', 'quick');
      exportData.append('template_id', '');
      exportData.append('single_table', '1');
      exportData.append('sql_query', sqlQuery.trim());
      exportData.append('token', token);
      exportData.append('quick_or_custom', 'quick');
      exportData.append('what', exportType === 'csv' ? 'csv' : 'sql');
      exportData.append('allrows', '1');
      exportData.append('aliases_new', '');
      exportData.append('output_format', 'sendit');
      exportData.append('filename_template', '@SERVER@');
      exportData.append('remember_template', 'on');
      exportData.append('charset', 'utf-8');
      exportData.append('compression', 'none');
      exportData.append('maxsize', '');
      exportData.append('codegen_structure_or_data', 'data');
      exportData.append('codegen_format', '0');

      // Add format-specific parameters
      if (exportType === 'csv') {
        exportData.append('csv_separator', ',');
        exportData.append('csv_enclosed', '"');
        exportData.append('csv_escaped', '"');
        exportData.append('csv_terminated', 'AUTO');
        exportData.append('csv_null', 'NULL');
        exportData.append('csv_columns', 'something');
        exportData.append('csv_structure_or_data', 'data');
      } else {
        exportData.append('sql_include_comments', 'something');
        exportData.append('sql_header_comment', '');
        exportData.append('sql_use_transaction', 'something');
        exportData.append('sql_compatibility', 'NONE');
        exportData.append('sql_structure_or_data', 'structure_and_data');
        exportData.append('sql_create_table', 'something');
        exportData.append('sql_auto_increment', 'something');
        exportData.append('sql_create_view', 'something');
        exportData.append('sql_create_trigger', 'something');
        exportData.append('sql_backquotes', 'something');
        exportData.append('sql_type', 'INSERT');
        exportData.append('sql_insert_syntax', 'both');
        exportData.append('sql_max_query_size', '50000');
        exportData.append('sql_hex_for_binary', 'something');
        exportData.append('sql_utc_time', 'something');
      }

      // Add all the additional parameters from the working request
      exportData.append('excel_null', 'NULL');
      exportData.append('excel_columns', 'something');
      exportData.append('excel_edition', 'win');
      exportData.append('excel_structure_or_data', 'data');
      exportData.append('json_structure_or_data', 'data');
      exportData.append('json_unicode', 'something');
      exportData.append('latex_caption', 'something');
      exportData.append('latex_structure_or_data', 'structure_and_data');
      exportData.append('latex_structure_caption', 'Structure of table @TABLE@');  // Missing parameter
      exportData.append('latex_structure_continued_caption', 'Structure of table @TABLE@ (continued)');  // Missing parameter
      exportData.append('latex_structure_label', 'tab:@TABLE@-structure');  // Missing parameter
      exportData.append('latex_comments', 'something');  // Missing parameter
      exportData.append('latex_columns', 'something');
      exportData.append('latex_data_caption', 'Content of table @TABLE@');
      exportData.append('latex_data_continued_caption', 'Content of table @TABLE@ (continued)');
      exportData.append('latex_data_label', 'tab:@TABLE@-data');
      exportData.append('latex_null', '\\textit{NULL}');
      exportData.append('mediawiki_structure_or_data', 'data');
      exportData.append('mediawiki_caption', 'something');
      exportData.append('mediawiki_headers', 'something');
      exportData.append('htmlword_structure_or_data', 'structure_and_data');
      exportData.append('htmlword_null', 'NULL');
      exportData.append('ods_null', 'NULL');
      exportData.append('ods_structure_or_data', 'data');
      exportData.append('odt_structure_or_data', 'structure_and_data');
      exportData.append('odt_comments', 'something');  // Missing parameter
      exportData.append('odt_columns', 'something');
      exportData.append('odt_null', 'NULL');
      exportData.append('pdf_report_title', '');
      exportData.append('pdf_structure_or_data', 'data');
      exportData.append('phparray_structure_or_data', 'data');
      exportData.append('texytext_structure_or_data', 'structure_and_data');
      exportData.append('texytext_null', 'NULL');
      exportData.append('xml_structure_or_data', 'data');
      exportData.append('xml_export_events', 'something');
      exportData.append('xml_export_functions', 'something');
      exportData.append('xml_export_procedures', 'something');
      exportData.append('xml_export_tables', 'something');
      exportData.append('xml_export_triggers', 'something');
      exportData.append('xml_export_views', 'something');
      exportData.append('xml_export_contents', 'something');
      exportData.append('yaml_structure_or_data', 'data');

      log('Export data prepared:', exportData.toString());
      log('Export URL:', `${baseUrl}?route=/export`);
     
      // Check if critical parameters are present
      log('Critical parameter check:');
      log(`  what: ${exportData.get('what')}`);
      log(`  export_type: ${exportData.get('export_type')}`);
      log(`  sql_query: ${exportData.get('sql_query')}`);
      log(`  token: ${exportData.get('token')}`);

      // Try constructing the body string manually like the working request
      const bodyString = exportData.toString();
      log('Body string:', bodyString);
      
      // Alternative: Try sending as a simple string instead of URLSearchParams
      const alternativeBody = `db=${encodeURIComponent(db)}&table=${encodeURIComponent(table)}&export_type=table&export_method=quick&template_id=&single_table=1&sql_query=${encodeURIComponent(sqlQuery.trim())}&token=${encodeURIComponent(token)}&quick_or_custom=quick&what=${exportType === 'csv' ? 'csv' : 'sql'}&allrows=1&aliases_new=&output_format=sendit&filename_template=@SERVER@&remember_template=on&charset=utf-8&compression=none&maxsize=&codegen_structure_or_data=data&codegen_format=0&csv_separator=%2C&csv_enclosed=%22&csv_escaped=%22&csv_terminated=AUTO&csv_null=NULL&csv_columns=something&csv_structure_or_data=data`;
      
      log('Alternative body string:', alternativeBody);
      
      // Send export request using proper form submission instead of fetch
      log('Sending export request via form submission...');
      
      // Create a hidden form for proper submission
      const exportForm = document.createElement('form');
      exportForm.method = 'POST';
      exportForm.action = `${baseUrl}?route=/export`;
      exportForm.target = '_blank'; // Open in new tab
      exportForm.style.display = 'none';
      
      // Add all the parameters as hidden inputs
      const params = {
        'db': db,
        'table': table,
        'export_type': 'table',
        'export_method': 'quick',
        'template_id': '',
        'single_table': '1',
        'sql_query': sqlQuery.trim(),
        'token': token,
        'quick_or_custom': 'quick',
        'what': exportType === 'csv' ? 'csv' : 'sql',
        'allrows': '1',
        'aliases_new': '',
        'output_format': 'sendit',
        'filename_template': '@SERVER@',
        'remember_template': 'on',
        'charset': 'utf-8',
        'compression': 'none',
        'maxsize': '',
        'codegen_structure_or_data': 'data',
        'codegen_format': '0'
      };
      
      // Add CSV-specific parameters if needed
      if (exportType === 'csv') {
        params['csv_separator'] = ',';
        params['csv_enclosed'] = '"';
        params['csv_escaped'] = '"';
        params['csv_terminated'] = 'AUTO';
        params['csv_null'] = 'NULL';
        params['csv_columns'] = 'something';
        params['csv_structure_or_data'] = 'data';
      }
      
      // Create hidden inputs for all parameters
      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        exportForm.appendChild(input);
      });
      
      // Add the form to the page and submit it
      document.body.appendChild(exportForm);
      log('Form created with parameters:', params);
      
      try {
        exportForm.submit();
        log('Form submitted successfully');
        
        // Clean up the form
        setTimeout(() => {
          document.body.removeChild(exportForm);
        }, 1000);
        
        // Show success message
        statusMsg.textContent = `${exportType.toUpperCase()} export submitted! Check the new tab.`;
        statusMsg.style.color = '#388e3c';
        
      } catch (error) {
        log('Form submission failed:', error);
        document.body.removeChild(exportForm);
        throw new Error(`Form submission failed: ${error.message}`);
      }

    } catch (error) {
      log('Export error occurred:', error);
      console.error('Export error:', error);
      statusMsg.textContent = `Export failed: ${error.message}`;
      statusMsg.style.color = '#d32f2f';
    } finally {
      // Re-enable button
      exportButton.disabled = false;
      exportButton.textContent = 'Export Query';
      log('Export process completed');
    }
  }

  // Initialize when page loads
  function init() {
    log('Initializing phpMyAdmin Export Helper');
    log('Current URL:', window.location.href);
    log('Page title:', document.title);
    log('Document ready state:', document.readyState);
    
    // Add debug indicator
    addDebugIndicator();
    
    // Check if we're on the right page - be more specific
    const isPhpMyAdminPage = window.location.href.includes('phpmyadmin') || 
                             window.location.href.includes('index.php') ||
                             window.location.href.includes('/sql') ||
                             window.location.href.includes('/query');
    
    if (isPhpMyAdminPage) {
      log('Possible phpMyAdmin page detected, looking for SQL textarea...');
      // Wait for the SQL textarea to be available
      waitForElement('textarea[name="sql_query"]', createExportControls);
    } else {
      log('Not on a phpMyAdmin page, skipping initialization');
      log('Current path:', window.location.pathname + window.location.search);
    }
  }

  // Run initialization
  if (document.readyState === 'loading') {
    log('Document still loading, waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    log('Document already loaded, running init immediately');
    init();
  }

  // Also run on navigation changes (for SPA-like behavior)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      log('URL changed, reinitializing...', { from: lastUrl, to: url });
      lastUrl = url;
      setTimeout(init, 1000); // Wait a bit for new content to load
    }
  }).observe(document, { subtree: true, childList: true });

  log('phpMyAdmin Export Helper script loaded successfully');
  log('Debug commands available:');
  log('  - window.togglePhpMyAdminDebug() - Toggle debug mode');
  log('  - window.phpMyAdminDebugMode() - Check debug mode status');

})();
