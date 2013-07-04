define([
  "page",
  "text!html/index.html", 
  "text!css/styles.css"
  ], function(page, tmpl, css) {

  // Load CSS (append style element to head)
  function loadCss() {
      var head = page.$bottomFrame('head'),
          style = document.createElement('style');

      style.type = 'text/css';
      if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      head.append(style);
    }

  function loadHtml(data) {
    var compiled = _.template(tmpl, data);
    page.$bottomFrame("body").append(compiled);
  }

  return {
    loadCss: loadCss,
    loadHtml: loadHtml
  }
});