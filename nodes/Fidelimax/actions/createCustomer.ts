import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	IDataObject,
} from 'n8n-workflow';

import { fidelimaxApiRequest } from '../GenericFunctions';

export const properties: INodeProperties[] = [
	{
		displayName: 'Nome',
		name: 'nome',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		default: '',
		required: true,
		description: 'Nome completo do cliente',
	},
	{
		displayName: 'CPF',
		name: 'cpf',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
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
				operation: ['createCustomer'],
			},
		},
		default: '',
		description: 'Formato: (11)99999-9999',
	},
	{
		displayName: 'Sexo',
		name: 'sexo',
		type: 'options',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		options: [
			{ name: 'Masculino', value: 'Masculino' },
			{ name: 'Feminino', value: 'Feminino' },
		],
		default: 'Masculino',
		description: 'Sexo do cliente',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'nome@email.com',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		default: '',
		description: 'Email do cliente',
	},
	{
		displayName: 'Data De Nascimento',
		name: 'nascimento',
		type: 'string',
		placeholder: 'dd/mm/yyyy',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		default: '',
		description: 'Formato: dd/mm/yyyy',
	},
	{
		displayName: 'Saldo Inicial',
		name: 'saldo',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		default: 0,
		description: 'Saldo inicial em pontos',
	},
];

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const nome = this.getNodeParameter('nome', i) as string;
			const cpf = this.getNodeParameter('cpf', i) as string;
			const telefone = this.getNodeParameter('telefone', i) as string;
			const sexo = this.getNodeParameter('sexo', i) as string;
			const email = this.getNodeParameter('email', i) as string;
			const nascimento = this.getNodeParameter('nascimento', i) as string;
			const saldo = this.getNodeParameter('saldo', i) as number;

			const body: IDataObject = { nome };

			if (cpf) body.cpf = cpf;
			if (telefone) body.telefone = telefone;
			if (sexo) body.sexo = sexo;
			if (email) body.email = email.toLowerCase();
			if (nascimento) body.nascimento = nascimento;
			if (saldo) body.saldo = saldo;

			const responseData = await fidelimaxApiRequest.call(
				this,
				'POST',
				'/api/Integracao/CadastrarConsumidor',
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
