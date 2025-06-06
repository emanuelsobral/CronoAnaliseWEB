# Plataforma de Cronoanálise 

![Captura de Tela de configuração vazia](https://i.imgur.com/RuqrBlY.png)

![Captura de Tela de configuração preenchida](https://i.imgur.com/RuqrBlY.png)

![Captura de Tela de analise vazia](https://i.imgur.com/NoEleVY.png)

![Captura de Tela de analise preenchida erro iniciar](https://i.imgur.com/S5g7R7a.png)

![Captura de Tela de analise preenchida erro exportar](https://i.imgur.com/sCtOVQL.png)

![Captura de Tela de analise preenchida tabela](https://i.imgur.com/Kt5kOpF.png)

![Captura de Tela de metricas preenchida](https://i.imgur.com/yag26qc.png)

Uma solução completa para análise temporal de atividades, desenvolvida com a identidade visual do Itaú, oferecendo controle preciso de processos e geração de relatórios.

## ✨ Funcionalidades Principais

Esta ferramenta é dividida em três abas principais, cada одна com um conjunto robusto de funcionalidades.

### 🔧 Aba de Configurações
Aqui você prepara toda a base para a sua análise.

* **Identificação da Análise**: Defina um nome para sua análise, que será usado para nomear o arquivo exportado.
* **Dados Estruturados**: Preencha os campos essenciais da análise, como Analista, Banco/Setor, Segmento e Entrevistado.
* **Gestão de Atividades Dinâmica**:
    * Adicione novas atividades de forma rápida, apenas digitando e pressionando `Enter`.
    * A lista de atividades é **reordenável** com um simples **arrastar e soltar** (drag and drop).
    * Exclua atividades individualmente, de forma imediata.
* **Controle de Dados**: Opções seguras para limpar apenas a lista de atividades ou **apagar todos os dados** da aplicação (com confirmação) para iniciar uma nova análise do zero.

### 📊 Aba de Análise
O centro de operações para a cronometragem e coleta de dados.

* **Controle Preciso de Cronometragem**:
    * Inicie e finalize a contagem de tempo para cada atividade selecionada.
    * Um **timer ativo** é exibido diretamente na tabela, mostrando o tempo decorrido da atividade atual.
* **Tabela Inteligente**:
    * **Detecção Automática de Retrabalho**: O sistema identifica e sinaliza automaticamente se uma mesma atividade para um mesmo entrevistado/setor já foi executada antes.
    * **Observações Editáveis**: Adicione ou edite observações diretamente na tabela para cada atividade registrada. As alterações são salvas automaticamente.
* **Interface de Usuário Reativa**:
    * O botão **"Iniciar Contagem"** só é habilitado quando todos os campos de configuração necessários são preenchidos e uma atividade é selecionada, prevenindo erros.
    * O botão **"Exportar"** fica desabilitado até que a análise tenha um nome e dados na tabela.
* **Layout Flexível**: Alterne entre a visualização padrão e um layout **"Lado a Lado"** para otimizar o espaço em telas maiores. Sua preferência de layout é salva e restaurada automaticamente.

### 📈 Aba de Métricas
Um dashboard que transforma seus dados brutos em insights valiosos.

* **Dashboard em Tempo Real**: As métricas são atualizadas automaticamente conforme você finaliza as atividades.
* **Indicadores de Desempenho (KPIs)**:
    * Total de Atividades Cronometradas.
    * Tempo Total da Análise.
    * Tempo Médio por Atividade.
    * Contagem Total de Retrabalhos.
    * Identificação da Atividade Mais Longa para análise de gargalos.
    * Lista detalhada de todas as atividades que foram classificadas como retrabalho.

### ⭐ Recursos Gerais

* **Persistência de Dados Completa**: Todo o seu trabalho, incluindo dados de configuração, atividades, tabela de análise e até mesmo a preferência de layout, é salvo localmente no seu navegador usando `localStorage`. Você pode fechar a aba e continuar de onde parou.
* **Exportação para Excel (.xlsx)**: Com um único clique, exporte um relatório completo contendo uma aba com os dados brutos da tabela e outra aba com o resumo das métricas. O arquivo é nomeado dinamicamente com os dados da análise.
* **Design Responsivo**: A interface se adapta para uma boa visualização tanto em desktops quanto em telas menores.

## 🛠️ Tecnologias Utilizadas

* **Core**: HTML5, CSS3, JavaScript (ES6+)
* **Bibliotecas**:
    * **SheetJS (xlsx.full.min.js)**: Para a geração de arquivos Excel.
    * **Font Awesome**: Para a iconografia da interface.

## 🚀 Como Utilizar

1.  Abra o arquivo `index.html` em qualquer navegador moderno (como Chrome, Firefox, Edge).
2.  Na aba **Configurações**, preencha os dados da análise e adicione as atividades que serão cronometradas.
3.  Mova para a aba **Análise**, selecione a primeira atividade e utilize os botões "Iniciar Contagem" e "Finalizar".
4.  Repita o passo 3 para todas as atividades. Adicione observações na tabela conforme necessário.
5.  Consulte a aba **Métricas** a qualquer momento para visualizar o progresso e os insights da sua análise.
6.  Ao concluir, preencha o "Nome da Análise" na aba de Configurações e clique em **Exportar** na aba de Análise para gerar seu relatório em Excel.

## 📂 Estrutura de Arquivos

cronoanalise/
├── index.html          # Interface principal
├── styles.css         # Estilos customizados
├── script.js          # Lógica de aplicação
└── README.md          # Documentação