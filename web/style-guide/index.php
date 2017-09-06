<?php include_once('functions.php'); ?>
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
  <title>Loconomics Brand Guide</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#000000">

  <!-- Style Guide Boilerplate Styles -->
  <link rel="stylesheet" href="css/sg-style.css">
  <!--[if lt IE 9]><link rel="stylesheet" href="css/sg-style-old-ie.css"><![endif]-->

  <!-- https://github.com/sindresorhus/github-markdown-css -->
  <link rel="stylesheet" href="css/github-markdown.css">

  <!-- Replace below stylesheet with your own stylesheet -->
  <link rel="stylesheet" href="css/app.css">

  <!-- prism Syntax Highlighting Styles -->
  <link rel="stylesheet" href="vendor/prism/prism.css">
</head>
<body>
  <a href="#main" class="sg-visually-hidden sg-visually-hidden-focusable">Skip to main content</a>

  <div id="top" class="sg-header" role="banner">
    <div class="sg-container">
      <h1 class="sg-logo">
        <span class="sg-logo-initials">LC</span>
        <span class="sg-logo-full">LOCONOMICS</span> <em>STYLE GUIDE</em>
      </h1>
      <button type="button" class="sg-nav-toggle">Menu</button>
    </div>
  </div><!--/.sg-header-->

  <div class="sg-wrapper sg-clearfix">
    <div id="nav" class="sg-sidebar" role="navigation">
      <h2 class="sg-h2 sg-subnav-title">About</h2>
      <ul class="sg-nav-group">
        <li>
          <a href="#sg-about">Getting Started</a>
        </li>
        <li>
          <a href="#sg-colors">Colors</a>
        </li>
        <li>
          <a href="#sg-fontStacks">Fonts</a>
        </li>
      </ul>

      <?php listFilesInFolder('markup'); ?>
    </div><!--/.sg-sidebar-->

    <div id="main" class="sg-main" role="main">
      <div class="sg-container">
        <div class="sg-info">
          <div class="sg-about sg-section">
            <h2 id="sg-about" class="sg-h2">Getting Started</h2>
            <p>A living style guide is a great tool to promote visual consistency, unify UX designers and front-end developers, as well as speed up development times. Add some documentation here on how to get started with your new style guide and start customizing this boilerplate to your liking.</p>
            <p>If you are looking for resources on style guides, check out <a href="http://styleguides.io">styleguides.io</a>. There are a ton of great articles, books, podcasts, talks, and other style guide tools!</p>
          </div><!--/.sg-about-->

          <!-- Manually add your UI colors here. -->
          <div class="sg-colors sg-section">
            <h2 id="sg-colors" class="sg-h2">Colors</h2>
            <div class="sg-color-grid">
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #007a7c;"></div>
                <div class="sg-color-name">$brand-primary</div>
                <div class="sg-color-value">#007a7c</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 4.7</div>
                <div class="sg-color-value">White: 5.2</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #d3424e;"></div>
                <div class="sg-color-name">$brand-secondary</div>
                <div class="sg-color-value">#d3424e</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 4.1</div>
                <div class="sg-color-value">White: 4.5</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #2176ae;"></div>
                <div class="sg-color-name">$brand-info</div>
                <div class="sg-color-value">#2176ae</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 4.5</div>
                <div class="sg-color-value">White: 4.9</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #00aa55;"></div>
                <div class="sg-color-name">$brand-success</div>
                <div class="sg-color-value">#00aa55</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value" style="color: #ff0000">$background-gray: 2.8</div>
                <div class="sg-color-value">White: 3.1</div>
              </div>
            </div><!--/.sg-color-grid-->
            <div class="sg-color-grid">
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #f9dc5c;"></div>
                <div class="sg-color-name">$brand-warning</div>
                <div class="sg-color-value">#f9dc5c</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Border only</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value" style="color: #ff0000">$background-gray: 1.2</div>
                <div class="sg-color-value" style="color: #ff0000">White: 1.4</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #ff0000;"></div>
                <div class="sg-color-name">$brand-danger</div>
                <div class="sg-color-value">#ff0000</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 3.7</div>
                <div class="sg-color-value">White: 4.0</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #222222;"></div>
                <div class="sg-color-name">$gray-darker</div>
                <div class="sg-color-value">#222222</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 0.85rem</div>
                <div class="sg-color-value">Font weight: 400</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 14.6</div>
                <div class="sg-color-value">White: 15.9</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #333333;"></div>
                <div class="sg-color-name">$gray-dark</div>
                <div class="sg-color-value">#333333</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 0.85rem</div>
                <div class="sg-color-value">Font weight: 400</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 11.6</div>
                <div class="sg-color-value">White: 12.6</div>
              </div>
            </div><!--/.sg-color-grid-->
            <div class="sg-color-grid">
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #555555;"></div>
                <div class="sg-color-name">$gray</div>
                <div class="sg-color-value">#555555</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 0.85rem</div>
                <div class="sg-color-value">Font weight: 400</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 6.8</div>
                <div class="sg-color-value">White: 7.5</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #777777;"></div>
                <div class="sg-color-name">$gray-light</div>
                <div class="sg-color-value">#777777</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value">$background-gray: 4.1</div>
                <div class="sg-color-value">White: 4.5</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #eeeeee;"></div>
                <div class="sg-color-name">$gray-lighter</div>
                <div class="sg-color-value">#eeeeee</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Font size: 1.125rem</div>
                <div class="sg-color-value">Font weight: 700</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value" style="color: #ff0000">$background-gray: 1.1</div>
                <div class="sg-color-value" style="color: #ff0000">White: 1.2</div>
              </div>
              <div class="sg-color">
                <div class="sg-color-swatch" style="background-color: #f5f5f5;"></div>
                <div class="sg-color-name">$gray-background</div>
                <div class="sg-color-value">#f5f5f5</div>
                <div class="sg-color-name">Minimum use:</div>
                <div class="sg-color-value">Background color only</div>
                <div class="sg-color-value">Font weight: 400</div>
                <div class="sg-color-name">Contrast ratios:</div>
                <div class="sg-color-value" style="color: #ff0000">$background-gray: 1.0</div>
                <div class="sg-color-value" style="color: #ff0000">White: 1.1</div>
              </div>
            </div><!--/.sg-color-grid-->
          </div><!--/.sg-colors-->

          <!-- Manually add your fonts here. -->
          <div class="sg-font-stacks sg-section">
            <h2 id="sg-fontStacks" class="sg-h2">Font Stacks</h2>
            <dl class="sg-font-list">
              <dt>Primary Font:</dt>
              <dd style='font-family: "HelveticaNeue", Helvetica, Arial, sans-serif;'>"HelveticaNeue", Helvetica, Arial, sans-serif;</dd>

              <dt>Primary Font Italic:</dt>
              <dd style='font-family: "HelveticaNeue", Helvetica, Arial, sans-serif; font-style: italic;'>"HelveticaNeue", Helvetica, Arial, sans-serif;</dd>

              <dt>Primary Font Bold:</dt>
              <dd style='font-family: "HelveticaNeue", Helvetica, Arial, sans-serif; font-weight: 800;'>"HelveticaNeue", Helvetica, Arial, sans-serif;</dd>

              <dt>Secondary Font:</dt>
              <dd style='font-family: Georgia, Times, "Times New Roman", serif;'>Georgia, Times, "Times New Roman", serif;</dd>

              <dt>Secondary Font Italic:</dt>
              <dd style='font-family: Georgia, Times, "Times New Roman", serif; font-style: italic;'>Georgia, Times, "Times New Roman", serif;</dd>

              <dt>Secondary Font Bold:</dt>
              <dd style='font-family: Georgia, Times, "Times New Roman", serif; font-weight: 800;'>Georgia, Times, "Times New Roman", serif;</dd>
            </dl>
            <div class="sg-markup-controls"><a class="sg-btn--top" href="#top">Back to Top</a></div>
          </div><!--/.sg-font-stacks-->
        </div><!--/.sg-info-->

        <?php renderFilesInFolder('markup'); ?>
      </div><!--/.sg-container-->
    </div><!--/.sg-main-->
  </div><!--/.sg-wrapper-->

  <!--[if gt IE 8]><!--><script src="vendor/prism/prism.js"></script><!--<![endif]-->
  <script src="js/sg-scripts.js"></script>
</body>
</html>

