import { Game } from '../resource/game';
import { GameService } from '../service/gameService';
import SERVICES from '../constants/services';
import { inject, injectable } from 'inversify';

@injectable()
export class GameController { 
    private _gameService: GameService;
    constructor(@inject(SERVICES.PRIMARY) MovieSelectionService) {
        this._gameService = MovieSelectionService;
    }
    async getGameById(gameId: string) {
        return this._gameService.getGameById(gameId);
    }
    async createGame(game: Game) {
        return this._gameService.createGame(game);
    }
    async patchGame(gameId: string, patchOperation: any) {
        return this._gameService.patchGame(gameId, patchOperation);
    }

}