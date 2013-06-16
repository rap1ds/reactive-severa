requirejs.config({
    "baseUrl": "js",
    "paths": {
      "jquery": "../components/jquery/jquery",
      "Bacon": "../components/baconjs/dist/Bacon",
      "lodash": "../components/lodash/lodash",
      "html": "../html"
    }
});

// Load the main app module to start the app
requirejs(["main"]);