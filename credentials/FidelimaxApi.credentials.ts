import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FidelimaxApi implements ICredentialType {
	name = 'fidelimaxApi';

	displayName = 'Fidelimax API';

	icon: Icon = 'file:../nodes/Fidelimax/fidelimax.svg';

	documentationUrl = 'https://docs.fidelimax.com.br';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Token obtido em Painel > Integracoes > API da Fidelimax',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				AuthToken: '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.fidelimax.com.br',
			url: '/api/Integracao/ListarConsumidores',
			method: 'POST',
			body: {
				novos: false,
				skip: 0,
				take: 1,
			},
		},
	};
}
