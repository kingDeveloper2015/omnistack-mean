// # Ghost Configuration
// Setup your Ghost install for various environments
// Documentation can be found at http://support.ghost.org/config/

var path = require('path');
var serverConfig = require('./config/environment');
var config;

config = {
    // ### Production
    // When running Ghost in the wild, use the production environment
    // Configure your URL and mail settings here
    production: {
        url: serverConfig.domain + '/blog',
        mail: {
          transport: 'SMTP',
          host: 'smtp.mandrillapp.com',
          // port: 587,
          // from: 'support@omninox.org',
          options: {
            service: 'Mandrill',
            auth:{
              user: 'support@omninox.org',
              pass: serverConfig.mandrill.apiKey
            }
          }
        },
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/ghost-content/data/ghost.db')
            },
            debug: false
        },

        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '0.0.0.0',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '9000'
        },
        paths: {
          contentPath: path.join(__dirname, '/ghost-content/')
        }
    },

    // ### Development **(default)**
    development: {
        // The url to use when providing links to the site, E.g. in RSS and email.
        // Change this to your Ghost blogs published URL.
        url: 'https://localhost:9000/blog',

        mail: {
          transport: 'SMTP',
          host: 'smtp.mandrillapp.com',
          // port: 587,
          // from: 'support@omninox.org',
          options: {
            service: 'Mandrill',
            auth:{
              user: 'support@omninox.org',
              pass: serverConfig.mandrill.apiKey
            }
          }
        },

        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/ghost-content/data/ghost-dev.db')
            },
            debug: false
        },
        server: {
            // Host to be passed to node's `net.Server#listen()`
            host: '127.0.0.1',
            // Port to be passed to node's `net.Server#listen()`, for iisnode set this to `process.env.PORT`
            port: '9000'
        },
        paths: {
            contentPath: path.join(__dirname, '/ghost-content/')
        }
    },

    // **Developers only need to edit below here**

    // ### Testing
    // Used when developing Ghost to run tests and check the health of Ghost
    // Uses a different port number
    testing: {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'sqlite3',
            connection: {
                filename: path.join(__dirname, '/ghost-content/data/ghost-test.db')
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        },
        logging: false
    },

    // ### Testing MySQL
    // Used by Travis - Automated testing run through GitHub
    'testing-mysql': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'mysql',
            connection: {
                host     : '127.0.0.1',
                user     : 'root',
                password : '',
                database : 'ghost_testing',
                charset  : 'utf8'
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        },
        logging: false
    },

    // ### Testing pg
    // Used by Travis - Automated testing run through GitHub
    'testing-pg': {
        url: 'http://127.0.0.1:2369',
        database: {
            client: 'pg',
            connection: {
                host     : '127.0.0.1',
                user     : 'postgres',
                password : '',
                database : 'ghost_testing',
                charset  : 'utf8'
            }
        },
        server: {
            host: '127.0.0.1',
            port: '2369'
        },
        logging: false
    }
};

// Export config
module.exports = config;
