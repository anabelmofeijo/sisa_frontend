# SISA Frontend - Dashboard de Sustentabilidade

Interface web (HTML, CSS e JavaScript puro) para monitorização energética, baterias, alertas, manutenção e distribuição de energia em edifícios.

## Visão Geral

Este projeto implementa um conjunto de telas interligadas com sidebar fixa e navegação entre módulos:

- Login
- Registo
- Dashboard Geral
- Energia
- Gestão das Baterias
- Alertas & Segurança
- Manutenção
- Energia para o Edifício

## Estrutura do Projeto

```text
app/
├── index.html                # Entrada principal (redireciona para login)
├── login.html                # Tela de login
├── registo.html              # Tela de registo
├── dashboard.html            # Dashboard geral
├── energia.html              # Módulo energia
├── baterias.html             # Gestão das baterias
├── alertas.html              # Alertas e segurança
├── manutencao.html           # Manutenção
├── edificio.html             # Energia para o edifício
├── css/
│   └── style.css             # Estilos globais
├── js/
│   └── main.js               # Interações e comportamento dinâmico
└── assets/
    ├── icons/
    └── images/
```

## Credenciais Padrão

Na tela de login, os dados padrão são:

- Email: `anabelmofeijo@gmail.com`
- Palavra-passe: `admin@admin`

## Funcionalidades Implementadas

- Sidebar fixa com navegação entre telas.
- Login e registo com validações básicas no frontend.
- Botão `Sair` em todas as telas redirecionando para login.
- Gráficos e cards com atualização visual dinâmica em vários módulos.
- Tela de energia com abas (`Diário`, `Semanal`, `Mensal`) e interação por cursor.
- Tela de edifício com:
  - Distribuição atual dinâmica por destino;
  - Gráfico de pizza com tooltip por cursor;
  - Histórico de distribuição com hover e tooltip;
  - Animação em "câmera lenta" ao abrir a tela.
- Tela de manutenção com marcação de manutenção concluída.

## Como Executar

Como o projeto é estático, pode ser aberto diretamente no navegador ou via servidor local.

### Opção 1: Abrir arquivo

1. Abra `app/index.html` no navegador.
2. O sistema redireciona automaticamente para `login.html`.

### Opção 2: Servidor local (recomendado)

No terminal, dentro da pasta `app`:

```bash
python3 -m http.server 5500
```

Depois abra:

```text
http://localhost:5500
```

## Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)

## Observações

- Não há backend nesta versão (dados simulados em frontend).
- Os fluxos de autenticação e cadastro são demonstrativos.
- O projeto está preparado para evolução futura com API e persistência real.
