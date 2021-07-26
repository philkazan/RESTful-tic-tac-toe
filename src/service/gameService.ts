import { injectable, inject } from 'inversify';
import CLIENTS from '../constants/clients'
import { LocalDynamoClient } from '../client/localDynamoClient';
import { Game } from '../resource/game';
import { v4 } from 'uuid';
import * as _ from 'underscore';
import * as jsonpatch from 'fast-json-patch';

@injectable()
export class GameService { 
    private _dbClient: LocalDynamoClient;
    constructor(
        @inject(CLIENTS.DYNAMO_CLIENT) localDynamoClient: LocalDynamoClient
    ) {
        this._dbClient = localDynamoClient;
    }

    async getGameById(gameId: string): Promise<Game> {
        let game: Game;
        try {
            game = await this._dbClient.scanById(gameId);
        } catch (err) {
            console.log(err);
        }

        if (!game) {
            throw new Error(`Game with ID ${gameId} was not found!`);
            //throw new NotFoundException(`Movie with ID ${movieId} was not found.`);
        }
        return game;
    }

    async createGame(game: Game): Promise<Game> {
        game._id = v4();
        // add a validator here?
        let result: Game;
        try {
            result = await this._dbClient.putItem(game);
        } catch (err) {
            console.log(err);
        }
        return result;
    }

    async patchGame(gameId: string, patchOperation: any) {
        // fetch the specific movie from dynamo
        const existingGame: Game = await this._dbClient.scanById(gameId);

        let result;
        if (existingGame) {
            const patchedGame = jsonpatch.applyPatch(existingGame,patchOperation, true);
            // this.validatePatchOp(patchOperation);
            // const patchedMovie = this.applyPatch(existingMovie, patchOperation);
            try{
                result = await this._dbClient.putItem(patchedGame.newDocument);
            } catch (err) {
                throw new Error(err);
                //throw new BadRequestException(err);
            }
        // validate patch request - make sure they're not changing the ID
        // persist movie to dynamo
        } else {
            // this should be a 404
            throw new Error(`Game with ID ${gameId} was not found!`);
            //throw new BadRequestException(`Movie with ID ${movieId} was not found`);
        }
        return result;
    }

    private validatePatchOp(patchOperation: any):void {
        const allowedAttributes = [
            'poster',
            'title',
            'releaseYear',
            'hasBeenWatched',
            'category'
        ];

        for(const attribute in patchOperation) {
            if(!allowedAttributes.find(a => a === attribute)) {
                throw new Error(`${attribute} is not allowed!`)
                // throw new BadRequestException(`${attribute} is not allowed`);
            }
        }
    }

    private applyPatch(movie: Game, patchOperation: any): Game {
        let patchedMovie: any = JSON.parse(JSON.stringify(movie)) // add type and fix this
        let exceptions = '';
        for(const key in patchOperation){
            if (_.has(patchedMovie, key)) {
                patchedMovie[key] = patchOperation[key];
            } else {
                exceptions += `| Property "${key}" is not allowed. |`;      
            }
        }


        if (exceptions.length > 0) {
            throw new Error(exceptions);
            // throw new BadRequestException(exceptions);
        }
        return patchedMovie;
    }
} 