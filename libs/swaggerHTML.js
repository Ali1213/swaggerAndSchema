const fs = require('fs');
const path = require('path');

const uiFile = fs.readFileSync(path.join(__dirname, 'swagger-ui.css'), 'utf-8');
const uiBundle = fs.readFileSync(path.join(__dirname, 'swagger-ui-bundle.js'), 'utf-8');
const uiStandalone = fs.readFileSync(path.join(__dirname, 'swagger-ui-standalone-preset.js'), 'utf-8');

const swaggerHTML = (apiPath, htmlTitle = 'Swagger UI') => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>${htmlTitle}</title>
    <style  type="text/css">
      ${uiFile}
    </style>
    <link rel="icon" type="image/png" href="./favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="./favicon-16x16.png" sizes="16x16" />
    <style>
      html
      {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *,
      *:before,
      *:after
      {
        box-sizing: inherit;
      }
      body
      {
        margin:0;
        background: #fafafa;
      }
    </style>
  </head>

  <body>
    <div id="swagger-ui"></div>
    <script type="text/javascript">
      ${uiBundle}
    </script>
    <script type="text/javascript">
      ${uiStandalone}
    </script>

    <script>
    window.onload = function() {
      // Begin Swagger UI call region
      const ui = SwaggerUIBundle({
        url: "${apiPath}",
        validatorUrl: null,
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
      // End Swagger UI call region
      window.ui = ui
    }
  </script>
  </body>
</html>

`;

module.exports = swaggerHTML;
