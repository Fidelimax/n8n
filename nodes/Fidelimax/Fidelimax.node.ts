import {
	NodeConnectionTypes,
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import * as findCustomer from './actions/findCustomer';
import * as createCustomer from './actions/createCustomer';
import * as scoreCustomer from './actions/scoreCustomer';

export class Fidelimax implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fidelimax',
		name: 'fidelimax',
		icon: 'file:fidelimax.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Integracao com a API Fidelimax - Programa de Fidelidade',
		defaults: {
			name: 'Fidelimax',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'fidelimaxApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operacao',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Buscar Cliente',
						value: 'findCustomer',
						description: 'Busca dados de um cliente existente',
						action: 'Buscar cliente',
					},
					{
						name: 'Criar Cliente',
						value: 'createCustomer',
						description: 'Cria um novo cliente no programa',
						action: 'Criar cliente',
					},
					{
						name: 'Pontuar Cliente',
						value: 'scoreCustomer',
						description: 'Adiciona ou estorna pontos de um cliente',
						action: 'Pontuar cliente',
					},
				],
				default: 'findCustomer',
			},
			...findCustomer.properties,
			...createCustomer.properties,
			...scoreCustomer.properties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'findCustomer') {
			return findCustomer.execute.call(this);
		}

		if (operation === 'createCustomer') {
			return createCustomer.execute.call(this);
		}

		if (operation === 'scoreCustomer') {
			return scoreCustomer.execute.call(this);
		}

		throw new NodeOperationError(this.getNode(), `Operacao '${operation}' nao e conhecida!`);
	}
}
