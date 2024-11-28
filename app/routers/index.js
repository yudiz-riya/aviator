const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const authRoutes = require('./auth')
const gameRoutes = require('./game');

class Router {
    constructor() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.corsOptions = {
            origin: '*',
            methods: '*',
            allowedHeaders: ['Content-Type', 'Authorization', 'verification', 'authorization'],
            exposedHeaders: ['Authorization', 'authorization'],
            credentials: true,
        };
    }

    async initialize() {
        this.setupMiddleware();
        // this.setupServer();
    }

    setupMiddleware() {
        this.app.disable('etag');
        this.app.enable('trust proxy');

        this.app.use(helmet());
        this.app.use(cors(this.corsOptions));
        this.app.use(compression());
        this.app.use(bodyParser.json({ limit: '16mb' }));
        this.app.use(
            bodyParser.urlencoded({
                limit: '16mb',
                extended: true,
                parameterLimit: 50000,
            })
        );

        if (process.env.NODE_ENV !== 'prod')
            this.app.use(
                morgan('dev', {
                    skip: req => req.path === '/ping' || req.path === '/favicon.ico',
                })
            );

        this.app.use(this.routeConfig);
        this.app.use(express.static('./seeds'));

        this.app.use('/api/v1/auth', authRoutes);
        this.app.use('/api/v1/game', gameRoutes);

        this.app.use('*', this.routeHandler);
        this.app.use(this.logErrors);
        this.app.use(this.errorHandler);
    }

    // setupServer() {
    //     this.httpServer = http.Server(this.app);
    //     this.httpServer.timeout = 300000;
    //     this.httpServer.listen(process.env.PORT, '0.0.0.0', () => log.green(`Spinning on ${process.env.PORT}`));
    // }

    routeConfig(req, res, next) {
        req.sRemoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (req.path === '/ping') return res.status(200).send({});
        res.reply = ({ code, message }, data = {}, header = undefined) => {
            res.status(code).header(header).json({ message, data });
        };
        next();
    }

    routeHandler(req, res) {
        res.status(404);
        res.send({ message: 'Route not found' });
    }

    logErrors(err, req, res, next) {
        log.error('body -> ', req.body);
        log.error(`${req.method} ${req.url}`);
        log.error(err.stack);
        return next(err);
    }

    errorHandler(err, res) {
        res.status(500);
        res.send({ message: err });
    }
}

module.exports = new Router();
