import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';

import { fidelimaxApiRequest } from '../GenericFunctions';

export const properties: INodeProperties[] = [
	{
		displayName: 'CPF',
		name: 'cpf',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['findCustomer'],
			},
		},
		default: '',
		description: 'CPF do cliente (obrigatorio se telefone nao for enviado)',
	},
	{
		displayName: 'Telefone',
		name: 'telefone',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['findCustomer'],
			},
		},
		default: '',
		description: 'Telefone do cliente (obrigatorio se CPF nao for enviado)',
	},
	{
		displayName: 'Retornar Categoria',
		name: 'categoria',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['findCustomer'],
			},
		},
		default: false,
		description: 'Whether to return the current category of the customer',
	},
];

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const cpf = this.getNodeParameter('cpf', i) as string;
			const telefone = this.getNodeParameter('telefone', i) as string;
			const categoria = this.getNodeParameter('categoria', i) as boolean;

			if (!cpf && !telefone) {
				throw new Error('CPF ou Telefone sao obrigatorios');
			}

			const body: IDataObject = {
				...(cpf && { cpf }),
				...(telefone && { telefone }),
				categoria,
			};

			const responseData = await fidelimaxApiRequest.call(
				this,
				'POST',
				'/api/Integracao/ConsultaConsumidor',
				body,
			);

			returnData.push({ json: responseData });
		} catch (error) {
			if (this.continueOnFail()) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				returnData.push({ json: { error: errorMessage } });
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
