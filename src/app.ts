import 'dotenv/config';
import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import http from 'http';
import bodyParser from 'body-parser';
import path from 'path';
import Errsole from 'errsole';
import ErrsolePostgres from 'errsole-postgres';
import moment from 'moment';
// import MulterMiddleware from './middlewares/MulterMiddleware';

import { ApiKeyMiddleware, MulterMiddleware } from './middlewares';
import { inngestPokemon, functions } from './jobs/PokemonJobs';
import { serve } from 'inngest/express';
import ScrapController from './controllers/scrap/ScrapController';
import PokemonController from './controllers/pokemon/PokemonController';

class App {
  public app: Application;
  public port: number;
  public server: http.Server;

  constructor(port: number) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = port;
    this.app.enable('trust proxy');
    this.app.use('/errsole', Errsole.expressProxyMiddleware());
    this.plugins();
    this.middlewares();
    this.routes();
  }

  public plugins(): void {
    morgan.token('date', function () {
      return moment().format('D/M/Y HH:mm:ss');
    });
    this.app.use(
      morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        skip: function (req, res) {
          if (process.env.NODE_ENV === 'production') {
            return res.statusCode < 300;
          }
          return false;
        },
      }),
    );

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(MulterMiddleware);
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(
      helmet({
        crossOriginResourcePolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );
    this.app.use('/storage', express.static(process.env.STORAGE_PATH || path.join(__dirname, 'public/storage')));
  }

  public middlewares(): void {
    // insert middleware here
    this.app.use(ApiKeyMiddleware);
  }

  public routes(): void {
    // this.app.use("/v1/debitur/restructures", AuthMiddleware, RestructureController);

    this.app.use('/scrap', ApiKeyMiddleware, ScrapController);
    this.app.use('/pokemon', ApiKeyMiddleware, PokemonController);

    // For inngest background jobs
    this.app.use('/api/inngest', express.json(), serve({ client: inngestPokemon, functions }));

    // dont change this route (for unknown route, send 404 response)
    this.app.all('*', (req: Request, res: Response) => {
      return res.status(404).json({
        data: null,
        message: 'YOO IS THIS THE ROUTE?',
        status: 404,
      });
    });
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      console.log(`App running on port :${this.port}`);
    });
  }
}

Errsole.initialize({
  storage: new ErrsolePostgres({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: decodeURIComponent(process.env.DB_PASSWORD || ''),
    database: process.env.DB_DATABASE,
  }),
  port: parseInt(process.env.APP_PORT || '3000') + 1,
  enableConsoleOutput: true,
});

const app = new App(process.env.APP_PORT as unknown as number);
app.listen();
