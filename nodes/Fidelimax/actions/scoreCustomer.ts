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
				operation: ['scoreCustomer'],
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
				operation: ['scoreCustomer'],
			},
		},
		default: '',
		description: 'Telefone do cliente (obrigatorio se CPF nao for enviado)',
	},
	{
		displayName: 'Pontuacao (Em Reais)',
		name: 'pontuacao_reais',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: 0,
		required: true,
		description: 'Valor bruto da transacao em R$',
	},
	{
		displayName: 'Tipo De Compra',
		name: 'tipo_compra',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: '',
		description: 'Descricao do tipo de compra',
	},
	{
		displayName: 'Verificador',
		name: 'verificador',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: '',
		description: 'ID unico da transacao (necessario para estorno)',
	},
	{
		displayName: 'Realizar Estorno',
		name: 'estorno',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: false,
		description: 'Whether to reverse the full score for this transaction',
	},
];

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const cpf = this.getNodeParameter('cpf', i) as string;
			const telefone = this.getNodeParameter('telefone', i) as string;
			const pontuacaoReais = this.getNodeParameter('pontuacao_reais', i) as number;
			const tipoCompra = this.getNodeParameter('tipo_compra', i) as string;
			const verificador = this.getNodeParameter('verificador', i) as string;
			const estorno = this.getNodeParameter('estorno', i) as boolean;

			if (!cpf && !telefone) {
				throw new Error('CPF ou Telefone sao obrigatorios');
			}

			const body: IDataObject = { pontuacao_reais: pontuacaoReais };

			if (cpf) body.cpf = cpf;
			if (telefone) body.telefone = telefone;
			if (tipoCompra) body.tipo_compra = tipoCompra;
			if (verificador) body.verificador = verificador;
			if (estorno) body.estorno = estorno;

			const responseData = await fidelimaxApiRequest.call(
				this,
				'POST',
				'/api/Integracao/PontuaConsumidor',
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
