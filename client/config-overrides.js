const { override } = require('customize-cra');

module.exports = {
  // The function to use to create a webpack dev server configuration when running the development server with webpack-dev-server
  devServer: function(configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack Dev Server config
    return function(proxy, allowedHost) {
      const config = configFunction(proxy, allowedHost);
      
      // Set allowedHosts to all to fix the error
      config.allowedHosts = 'all';
      
      return config;
    };
  }
};