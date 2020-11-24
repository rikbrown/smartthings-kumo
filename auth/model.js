module.exports = {
    // We support returning promises.
    getAccessToken: function() {
      return new Promise('works!');
    },
  
    // Or, calling a Node-style callback.
    getAuthorizationCode: function(done) {
      done(null, 'works!');
    },
  
    // Or, using generators.
    getClient: function*() {
      yield somethingAsync();
      return 'works!';
    },
  
    // Or, async/wait (using Babel).
    getUser: async function() {
      await somethingAsync();
      return 'works!';
    }
  };
  