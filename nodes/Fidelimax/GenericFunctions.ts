import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';

export async function fidelimaxApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `https://api.fidelimax.com.br${endpoint}`,
		headers: {
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body) {
		options.body = body;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'fidelimaxApi',
			options,
		)) as IDataObject;
	} catch (error: unknown) {
		const httpError = error as { response?: { body?: { CodigoResposta?: string; MensagemErro?: string } } };

		if (httpError.response?.body) {
			const errorBody = httpError.response.body;
			throw new Error(
				`[${errorBody.CodigoResposta ?? 'UNKNOWN'}] ${errorBody.MensagemErro ?? 'Erro na API Fidelimax'}`,
			);
		}

		throw error;
	}
}
