require('dotenv').config();
import 'reflect-metadata';
import * as Koa from 'koa';
import * as Router from '@koa/router';
import * as Cors from '@koa/cors';
import { Container } from 'inversify';
import * as bodyParser from 'koa-bodyparser';
import CLIENTS from './constants/clients';
import CONFIGS from './constants/configs';
import CONTROLLERS from './constants/controllers';
import SERVICES from './constants/services';

import { LocalDynamoClient } from './client/localDynamoClient'
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { GameController } from './controller/gameController';
import { GameService } from './service/gameService';


const app = new Koa();
const router = new Router();
const container = new Container();
// TODO put this in a config or something
// TODO find a less redundant way to add the CORS response headers
// Add Category property to Movie objects
// extend randomMovie endpoint to take Category query param
const DynamoClientConfig: DynamoDBClientConfig = {
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
}

container.bind<DynamoDBClientConfig>(CONFIGS.DYNAMO_CLIENT_CONFIG).toConstantValue(DynamoClientConfig);
container.bind<LocalDynamoClient>(CLIENTS.DYNAMO_CLIENT).to(LocalDynamoClient);

container.bind(CONTROLLERS.PRIMARY).to(GameController);
container.bind(SERVICES.PRIMARY).to(GameService);

app.use(bodyParser());

// router.get('/availableMovies', async (ctx, next) => {
//     const controller: GameController = container.get(CONTROLLERS.PRIMARY);
//     ctx.body = await controller.getAvailableMovies(); 
// })

router.patch('/game', async (ctx, next) => {
    const controller: GameController = container.get(CONTROLLERS.PRIMARY);
    try {
        ctx.body = await controller.patchGame(ctx.params.id, ctx.request.body); 
    } catch(e) {
        ctx.status = e.code;
        ctx.body = e.message;
    }
})

router.get('/game/:id', async(ctx, next) => {
  const controller: GameController = container.get(CONTROLLERS.PRIMARY);
  try {
    ctx.body = await controller.getGameById(ctx.params.id); 
  } catch(e) {
    ctx.status = e.code;
    ctx.body = e.message;
  }
})

router.post('/game', async (ctx, next) => {
    const controller: GameController = container.get(CONTROLLERS.PRIMARY);
    ctx.status = 201;
    try {
        ctx.body = await controller.createGame(ctx.request.body); 
    } catch (e) {
        ctx.status = e.code;
        ctx.body = e.message;
    }
})

router.get('/health', (ctx, next) => {
    ctx.body = {
        "serviceName": "tic-tac-toe",
        "serviceVersion": "0.0.1"
    }
})


app
  .use(Cors())
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(process.env.PORT || 3000);