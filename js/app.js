requirejs.config({
    "baseUrl": "js",
    "paths": {
      "jquery": "../components/jquery/jquery",
      "Bacon": "../components/baconjs/dist/Bacon"
    },
    "shim": {
      "Bacon": ["jquery"]
    }
});

// Load the main app module to start the app
requirejs(["main"]);