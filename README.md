# n8n-nodes-fidelimax

This is an n8n community node that integrates with the [Fidelimax](https://fidelimax.com.br) loyalty program API. It allows you to manage customers and points directly from your n8n workflows.

## Installation

### In n8n (recommended)

1. Go to **Settings > Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-fidelimax`
4. Click **Install**

### Self-hosted

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-fidelimax
```

Then restart n8n.

## Credentials

You need a **Fidelimax API Token** to use this node.

To get your token:

1. Log in to the Fidelimax dashboard
2. Go to **Integracoes > API da Fidelimax**
3. Click **Quero Integrar**
4. Copy your API Token

In n8n, create a new **Fidelimax API** credential and paste your token.

## Operations

### Buscar Cliente (Find Customer)

Looks up an existing customer in the Fidelimax loyalty program.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| CPF | string | * | Customer CPF (required if phone not provided) |
| Telefone | string | * | Customer phone (required if CPF not provided) |
| Retornar Categoria | boolean | No | Whether to return the customer's current loyalty category |

*At least one of CPF or Telefone must be provided.*

### Criar Cliente (Create Customer)

Registers a new customer in the loyalty program.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Nome | string | Yes | Customer full name |
| CPF | string | No | Customer CPF |
| Telefone | string | No | Customer phone (format: (11)99999-9999) |
| Sexo | select | No | Gender (Masculino / Feminino) |
| Email | string | No | Customer email |
| Data de Nascimento | string | No | Birth date (format: dd/mm/yyyy) |
| Saldo Inicial | number | No | Initial points balance (default: 0) |

### Pontuar Cliente (Score Customer)

Adds or reverses points for an existing customer.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| CPF | string | * | Customer CPF (required if phone not provided) |
| Telefone | string | * | Customer phone (required if CPF not provided) |
| Pontuacao (em Reais) | number | Yes | Transaction value in R$ |
| Tipo de Compra | string | No | Purchase type description |
| Verificador | string | No | Unique transaction ID (required for reversals) |
| Realizar Estorno | boolean | No | If true, reverses the full score for this transaction |

*At least one of CPF or Telefone must be provided.*

## Compatibility

- Requires n8n version 1.0+
- Node.js 22+

## Resources

- [Fidelimax API Documentation](https://docs.fidelimax.com.br)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)
