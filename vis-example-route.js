define(function (require) {

  require('css!plugins/vis-walk-through-example/vis-example-style.css');
  require('plugins/vis-walk-through-example/vis-example-controller');

  // define when angualr should load our view
  require('routes')
  .when('/vis-walk-through-example/:indexPattern?', {
    template: require('text!plugins/vis-walk-through-example/vis-example-view.html'),
    resolve: {
      indexPattern: function (indexPatterns, $route) {
        return indexPatterns.get($route.current.params.indexPattern || 'logstash-*')
        .catch(function (e) {
          if (e.savedObjectType === 'index-pattern') {
            throw new Error(
              'Unable to load the "logstash-*" index pattern. Try adding your index pattern as a route param.'
            );
          }
        });
      }
    }
  });

});