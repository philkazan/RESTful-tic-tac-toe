import { DynamoDBClient, PutItemCommand, ScanCommand, DynamoDBClientConfig, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { injectable, inject } from 'inversify';
import { Game} from '../resource/game';
import CONFIGS from '../constants/configs'

@injectable()
export class LocalDynamoClient {

    private _client: DynamoDBClient;
    // Are KeyConditionExpressions necessary?
    constructor(@inject(CONFIGS.DYNAMO_CLIENT_CONFIG)config: DynamoDBClientConfig) {
        this._client = new DynamoDBClient(config);
    }
    async scan(): Promise<any> {
        const command = new ScanCommand({
            TableName: "tic-tac-toe-game"
        });
        const response = await this._client.send(command);
        return response.Items.map(m => unmarshall(m) );
    }

    async query(queryParams): Promise<any> {
        const command = new QueryCommand({
            TableName: "tic-tac-toe-game",
            KeyConditionExpression: 'category = :category',
            ExpressionAttributeValues: {
                ':category': { 'S': queryParams.category}
            },
            IndexName: 'category-index'
        });

        const response = await this._client.send(command);
        return response.Items.map(m => unmarshall(m))
    }

    async scanById(id: string): Promise<any> {
        // this is immediate tech debt
        const command = new ScanCommand({
            TableName: "tic-tac-toe-game"
        });
        const response = await this._client.send(command);
        const unmarsahlledResposne = response.Items.map(m => unmarshall(m) );
        return unmarsahlledResposne.find(m => m.id === id);
    };

    async putItem(game: any): Promise<Game> {
        const command = new PutItemCommand({
            TableName: "tic-tac-toe-game",
            Item: marshall(game),
            ReturnValues: "ALL_OLD"
        });
       await this._client.send(command);
        return game;
    }
}