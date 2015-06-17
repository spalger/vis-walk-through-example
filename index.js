define(function (require) {
  var apps = require('registry/apps');
  apps.register(function VisualizeAppModule() {
    return {
      id: 'vis-walk-through-example',
      name: 'Vis Walk-Through Example',
      order: 10
    };
  });

  // load our applications routes, controllers and views are required from there
  require('plugins/vis-walk-through-example/vis-example-route');
});
