# 📚 Guia Completo: n8n Community Node - API Fidelimax

## 🎯 Objetivo

Criar um node customizado para n8n que integre a API Fidelimax, permitindo que outros usuários usem a Fidelimax diretamente no n8n como se fosse um node nativo.

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- ✅ **Node.js v22+** - [Download aqui](https://nodejs.org/)
- ✅ **npm ou yarn** - Vem com Node.js
- ✅ **Git** - Para controle de versão
- ✅ **VS Code ou IDE de sua preferência**
- ✅ **Conta npm** - Para publicar o package (https://www.npmjs.com/)

### Conhecimentos Necessários

- TypeScript/JavaScript básico
- Familiaridade com n8n
- Estrutura de dados do n8n
- APIs REST

---

## 🚀 Passo 1: Setup Inicial do Projeto

### Opção A: Usar o Gerador Automático (RECOMENDADO)

```bash
npm create @n8n/node
```

Será feita uma série de perguntas:

| Pergunta | Resposta |
|----------|----------|
| **Project name** | `n8n-nodes-fidelimax` |
| **Node template** | `declarative/custom` (para APIs REST) |
| **Authentication** | `Custom` (criaremos nossa própria lógica) |
| **Skip install** | `No` (instalar dependências) |

### Opção B: Usar o Template Starter

```bash
git clone https://github.com/n8n-io/n8n-nodes-starter.git
cd n8n-nodes-starter
npm install
```

---

## 📁 Passo 2: Estrutura do Projeto

Após setup, você terá uma estrutura assim:

```
n8n-nodes-fidelimax/
├── nodes/
│   └── Fidelimax/
│       ├── Fidelimax.node.ts              # Definição principal do node
│       ├── fidelimax.svg                  # Ícone do node
│       ├── actions/                       # Ações específicas
│       │   ├── findCustomer.ts            # Buscar cliente
│       │   ├── createCustomer.ts          # Criar cliente
│       │   └── scoreCustomer.ts           # Pontuar cliente
│       └── GenericFunctions.ts            # Funções utilitárias
├── credentials/
│   └── FidelimaxApi.credentials.ts        # Configuração de credenciais
├── dist/                                  # Build compilado (gerado)
├── package.json                           # Dependências
├── tsconfig.json                          # Configuração TypeScript
├── .eslintrc.json                         # Linter
├── README.md                              # Documentação
└── LICENSE                                # Licença

```

---

## 🔐 Passo 3: Configurar Credenciais

Edite ou crie `credentials/FidelimaxApi.credentials.ts`:

```typescript
import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class FidelimaxApi implements ICredentialType {
	name = 'fidelimaxApi';
	displayName = 'Fidelimax API';
	documentationUrl = 'https://docs.fidelimax.com.br';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,  // Campo de senha (escondido)
			},
			default: '',
			required: true,
			description: 'Token obtido em Painel > Integrações > API da Fidelimax',
		},
	];

	// Define como a autenticação será feita
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'AuthToken': '={{$credentials.apiToken}}',
			},
		},
	};

	// Testa se a credencial é válida
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.fidelimax.com.br',
			url: '/api/Integracao/ListarConsumidores',
			method: 'POST',
			json: true,
			data: {
				novos: false,
				skip: 0,
				take: 1,
			},
		},
	};
}
```

---

## 🛠️ Passo 4: Criar o Node Principal

Edite `nodes/Fidelimax/Fidelimax.node.ts`:

```typescript
import { 
	IExecuteFunctions, 
	INodeExecutionData, 
	INodeType, 
	INodeTypeDescription,
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
		description: 'Integração com a API Fidelimax - Programa de Fidelidade',
		defaults: {
			name: 'Fidelimax',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'fidelimaxApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operação',
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
			// Properties específicas de cada operação serão adicionadas aqui
			...findCustomer.properties,
			...createCustomer.properties,
			...scoreCustomer.properties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;

		const operationFunctions: { [key: string]: Function } = {
			findCustomer: findCustomer.execute,
			createCustomer: createCustomer.execute,
			scoreCustomer: scoreCustomer.execute,
		};

		const operationFunction = operationFunctions[operation];

		if (operationFunction === undefined) {
			throw new Error(`Operação '${operation}' não é conhecida!`);
		}

		return operationFunction.call(this);
	}
}
```

---

## 📍 Passo 5: Criar Funções Genéricas

Crie `nodes/Fidelimax/GenericFunctions.ts`:

```typescript
import { IExecuteFunctions } from 'n8n-workflow';

export async function apiRequest(
	this: IExecuteFunctions,
	method: string,
	endpoint: string,
	body?: object,
	query?: object,
) {
	const credentials = await this.getCredentials('fidelimaxApi');

	const options: any = {
		method,
		url: `https://api.fidelimax.com.br${endpoint}`,
		headers: {
			'AuthToken': credentials.apiToken,
			'Content-Type': 'application/json',
		},
		json: true,
	};

	if (body) {
		options.data = body;
	}

	if (query) {
		options.qs = query;
	}

	try {
		return await this.helpers.request(options);
	} catch (error: any) {
		// Melhor mensagem de erro
		if (error.response && error.response.body) {
			const errorBody = error.response.body;
			throw new Error(
				`[${errorBody.CodigoResposta}] ${errorBody.MensagemErro || 'Erro na API'}`
			);
		}
		throw error;
	}
}
```

---

## 🎯 Passo 6: Criar Ações

### 6.1 Buscar Cliente (`actions/findCustomer.ts`)

```typescript
import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

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
		description: 'CPF do cliente (obrigatório se telefone não for enviado)',
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
		description: 'Telefone do cliente (obrigatório se CPF não for enviado)',
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
		description: 'Se verdadeiro, retorna a categoria atual do cliente',
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
				throw new Error('CPF ou Telefone são obrigatórios');
			}

			const body = {
				...(cpf && { cpf }),
				...(telefone && { telefone }),
				categoria,
			};

			const responseData = await apiRequest.call(
				this,
				'POST',
				'/api/Integracao/ConsultaConsumidor',
				body,
			);

			returnData.push({
				json: responseData,
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
```

### 6.2 Criar Cliente (`actions/createCustomer.ts`)

```typescript
import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

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
		description: 'CPF do cliente (obrigatório se telefone não for enviado)',
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
		default: '',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['createCustomer'],
			},
		},
		default: '',
	},
	{
		displayName: 'Data de Nascimento',
		name: 'nascimento',
		type: 'string',
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

			const body: any = {
				nome,
			};

			if (cpf) body.cpf = cpf;
			if (telefone) body.telefone = telefone;
			if (sexo) body.sexo = sexo;
			if (email) body.email = email.toLowerCase();
			if (nascimento) body.nascimento = nascimento;
			if (saldo) body.saldo = saldo;

			const responseData = await apiRequest.call(
				this,
				'POST',
				'/api/Integracao/CadastrarConsumidor',
				body,
			);

			returnData.push({
				json: responseData,
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
```

### 6.3 Pontuar Cliente (`actions/scoreCustomer.ts`)

```typescript
import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../GenericFunctions';

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
		description: 'CPF do cliente (obrigatório se telefone não for enviado)',
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
		description: 'Telefone do cliente (obrigatório se CPF não for enviado)',
	},
	{
		displayName: 'Pontuação (em Reais)',
		name: 'pontuacao_reais',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: 0,
		required: true,
		description: 'Valor bruto da transação em R$',
	},
	{
		displayName: 'Tipo de Compra',
		name: 'tipo_compra',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['scoreCustomer'],
			},
		},
		default: '',
		description: 'Descrição do tipo de compra',
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
		description: 'ID único da transação (necessário para estorno)',
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
		description: 'Se verdadeiro, estorna toda a pontuação',
	},
];

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const cpf = this.getNodeParameter('cpf', i) as string;
			const telefone = this.getNodeParameter('telefone', i) as string;
			const pontuacao_reais = this.getNodeParameter('pontuacao_reais', i) as number;
			const tipo_compra = this.getNodeParameter('tipo_compra', i) as string;
			const verificador = this.getNodeParameter('verificador', i) as string;
			const estorno = this.getNodeParameter('estorno', i) as boolean;

			if (!cpf && !telefone) {
				throw new Error('CPF ou Telefone são obrigatórios');
			}

			const body: any = {
				pontuacao_reais,
			};

			if (cpf) body.cpf = cpf;
			if (telefone) body.telefone = telefone;
			if (tipo_compra) body.tipo_compra = tipo_compra;
			if (verificador) body.verificador = verificador;
			if (estorno) body.estorno = estorno;

			const responseData = await apiRequest.call(
				this,
				'POST',
				'/api/Integracao/PontuaConsumidor',
				body,
			);

			returnData.push({
				json: responseData,
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
				});
				continue;
			}
			throw error;
		}
	}

	return [returnData];
}
```

---

## 🧪 Passo 7: Testar Localmente

### Iniciar em Desenvolvimento

```bash
# Rodar em desenvolvimento com hot reload
npm run dev

# Isso vai:
# 1. Iniciar uma instância n8n local
# 2. Carregar seu node customizado
# 3. Auto-rebuild quando você salva arquivos
```

### Testar o Node

1. Abra http://localhost:5678 no seu navegador
2. Crie um novo workflow
3. Procure por "Fidelimax" no painel de nodes
4. Seu node deve aparecer!

---

## ✅ Passo 8: Lint e Build

```bash
# Verificar erros de código
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Build final para produção
npm run build

# Isso vai gerar a pasta 'dist/' com os arquivos compilados
```

---

## 📦 Passo 9: Configurar package.json

Edite `package.json` para que pareça assim:

```json
{
	"name": "n8n-nodes-fidelimax",
	"version": "1.0.0",
	"description": "n8n node para integração com API Fidelimax",
	"license": "MIT",
	"author": "Seu Nome",
	"repository": {
		"type": "git",
		"url": "https://github.com/seu-usuario/n8n-nodes-fidelimax.git"
	},
	"keywords": [
		"n8n",
		"n8n-community-node-package",
		"fidelimax",
		"loyalty",
		"points"
	],
	"main": "dist/index.js",
	"scripts": {
		"build": "n8n-node build",
		"dev": "n8n-node dev",
		"lint": "n8n-node lint",
		"lint:fix": "n8n-node lint --fix",
		"test": "jest"
	},
	"n8n": {
		"nodes": [
			"dist/nodes/Fidelimax/Fidelimax.node.js"
		],
		"credentials": [
			"dist/credentials/FidelimaxApi.credentials.js"
		]
	},
	"devDependencies": {
		"@n8n/node-cli": "^1.0.0",
		"n8n-core": "^1.0.0",
		"n8n-workflow": "^1.0.0"
	}
}
```

---

## 🌐 Passo 10: Publicar no npm

### 1. Criar conta npm

```bash
npm adduser
# ou
npm login
```

### 2. Publicar o package

```bash
# Verificar versão no package.json
npm version patch  # aumenta 1.0.0 → 1.0.1

# Publicar
npm publish

# Se for scoped (@sua-org/n8n-nodes-fidelimax)
npm publish --access public
```

**Verificar se foi publicado:**
```bash
npm view n8n-nodes-fidelimax
```

---

## 📋 Passo 11: Submeter para Verificação no n8n

### Requisitos de Verificação

Seu node deve atender:

✅ Nome começar com `n8n-nodes-` (ex: `n8n-nodes-fidelimax`)

✅ Incluir `n8n-community-node-package` nos keywords

✅ Passar no linter: `npm run lint`

✅ Sem erros no build: `npm run build`

✅ Documentação completa em README.md

✅ Sem runtime dependencies desnecessárias

✅ Seguir diretrizes UX do n8n

### Submeter

1. Acesse https://creators.n8n.io/
2. Faça login com sua conta n8n
3. Clique em "Submit a Community Node"
4. Preencha os dados:
   - **Package Name**: `n8n-nodes-fidelimax`
   - **NPM URL**: Link do seu package no npm
   - **GitHub URL**: (opcional) Link do repositório
   - **Description**: Descrição clara
   - **Category**: Integration > CRM/Loyalty

5. Aguarde a revisão do n8n (geralmente 3-7 dias)

---

## 📖 Passo 12: Documentação (README.md)

Atualize `README.md`:

```markdown
# n8n-nodes-fidelimax

Integração com a API Fidelimax para n8n.

## Funcionalidades

- ✅ Buscar dados de clientes
- ✅ Criar novos clientes
- ✅ Adicionar/estornar pontos

## Instalação

### No n8n Cloud
Procure por "Fidelimax" no painel de nodes após aprovação.

### Auto-host
```bash
npm install n8n-nodes-fidelimax
```

## Uso

1. Adicione o node "Fidelimax" ao seu workflow
2. Configure as credenciais com seu API Token
3. Selecione a operação desejada
4. Configure os parâmetros

## Credenciais

Você precisa de um **API Token** obtido em:
- Painel de Controle Fidelimax
- Menu: Integrações > API da Fidelimax
- Clique: "Quero Integrar"

## Operações Disponíveis

### Buscar Cliente
Procura informações de um cliente existente.
- **Parâmetros**: CPF ou Telefone
- **Retorna**: Dados do cliente, saldo, pontos, etc.

### Criar Cliente
Cadastra um novo cliente no programa.
- **Parâmetros**: Nome, CPF/Telefone, Email, etc.
- **Retorna**: Confirmação e dados do novo cliente

### Pontuar Cliente
Adiciona ou estorna pontos de um cliente.
- **Parâmetros**: CPF/Telefone, Valor em Reais
- **Retorna**: Novo saldo e confirmação

## Suporte

Para dúvidas ou problemas:
- GitHub Issues: [seu-repo/issues]
- Documentação API: https://docs.fidelimax.com.br
- Community n8n: https://community.n8n.io/
```

---

## 🎓 Checklist Final

Antes de publicar, verifique:

- [ ] Node.js v22+ instalado
- [ ] Projeto criado com `npm create @n8n/node`
- [ ] Credenciais configuradas (`FidelimaxApi.credentials.ts`)
- [ ] Node principal criado (`Fidelimax.node.ts`)
- [ ] 3 ações implementadas (find, create, score)
- [ ] Funções genéricas criadas (`GenericFunctions.ts`)
- [ ] Testado localmente com `npm run dev`
- [ ] Sem erros: `npm run lint`
- [ ] Build sem erros: `npm run build`
- [ ] package.json atualizado corretamente
- [ ] README.md completo
- [ ] Publicado no npm: `npm publish`
- [ ] Submetido para verificação em creators.n8n.io

---

## 📚 Documentação Oficial

- [Building Community Nodes](https://docs.n8n.io/integrations/community-nodes/build-community-nodes/)
- [n8n-node CLI Tool](https://docs.n8n.io/integrations/creating-nodes/build/n8n-node/)
- [Submit Community Nodes](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/)
- [GitHub Starter Template](https://github.com/n8n-io/n8n-nodes-starter)

---

## 💡 Dicas Extras

1. **Hot Reload**: Durante `npm run dev`, suas alterações são aplicadas automaticamente
2. **Testar Credenciais**: Use a função `test` em `credentials` para validar o token
3. **Erro Handling**: Sempre use try/catch e `continueOnFail()` para workflows robustos
4. **Documentação**: Descreva bem cada parâmetro nos `displayOptions`
5. **Versionamento**: Use [Semantic Versioning](https://semver.org/) para seu package

---

## 🚀 Próximos Passos

1. Setup do projeto com `npm create @n8n/node`
2. Implementar credenciais
3. Implementar node principal
4. Implementar 3 ações
5. Testar localmente
6. Publicar no npm
7. Submeter para verificação
8. Aguardar aprovação
9. **Celebrar!** 🎉

---

**Última atualização**: Março 2026
**Status**: Pronto para implementação