# Compilador de autômato

Front-end de um compilador para uma mini-linguagem. O programa não é executado: cada arquivo `.mini` passa pelo analisador léxico, pelo sintático e pelo semântico. No fim, o terminal mostra o código com números de linha, a árvore sintática, a tabela de símbolos e os erros encontrados.

## Como rodar

É preciso ter o [Node.js](https://nodejs.org/) instalado.

No Windows, dê dois cliques em `run.bat`. Ele instala as dependências, se ainda não existirem, e analisa os seis exemplos da pasta `exemplos`.

Pela linha de comando:

```bash
npm install
node analisador.js exemplos/01_valido.mini
```

Vários arquivos de uma vez:

```bash
node analisador.js exemplos/01_valido.mini exemplos/05_erros_semanticos.mini
```

Para conferir os casos de teste:

```bash
npm test
```

O processo termina com código `0` quando não há erro, `1` quando o fonte tem erro léxico, sintático ou semântico, e `2` quando o arquivo informado não existe.

## A mini-linguagem

Há dois tipos: `inteiro` e `logico`. Um programa é uma sequência de comandos.

```text
inteiro x;
logico ok;

x = 10;
ok = x > 0 && x < 100;

se (ok) {
    inteiro dobro;
    dobro = x * 2;
    escreva(dobro);
}

escreva(x);
```

| Construção | Forma |
| --- | --- |
| Declaração | `inteiro nome;` ou `logico nome;` |
| Atribuição | `nome = expressao;` |
| Condicional | `se (expressao) comando` |
| Saída | `escreva(expressao);` |
| Bloco | `{ comandos }` |
| Comentário | `//` até o fim da linha |

Operadores: `+`, `-`, `*`, `<`, `>`, `==` e `&&`. Números são inteiros sem sinal. Os literais lógicos são `verdadeiro` e `falso`. Palavras reservadas: `inteiro`, `logico`, `se`, `escreva`, `verdadeiro` e `falso`.

Um bloco `{ }` abre um escopo novo. Uma variável declarada dentro dele deixa de existir quando o bloco fecha. Um nome interno pode esconder um nome externo.

## O que cada fase faz

1. **Léxico** (`compilador/lexico.js`). Rejeita caractere que não pertence à linguagem e registra linha e coluna. Comentário e espaço são preservados para a posição do erro não mudar.
2. **Sintático** (`compilador/gramatica.pegjs` e `compilador/sintatico.js`). A gramática em Peggy descreve a linguagem e constrói a árvore. Se a derivação falha, a análise semântica não começa.
3. **Semântico** (`compilador/semantica.js` e `compilador/tabela.js`). Confere declaração, declaração repetida no mesmo escopo, uso fora do escopo e compatibilidade de tipos. A condição do `se` precisa ser `logico`. `+`, `-`, `*` , `<` e `>` exigem `inteiro`. `==` compara valores do mesmo tipo. `&&` exige `logico`.

## Exemplos

| Arquivo | O que mostra |
| --- | --- |
| `exemplos/01_valido.mini` | Programa aceito, com conta, `se` e bloco |
| `exemplos/02_escopo_valido.mini` | Nome interno escondendo o externo |
| `exemplos/03_erro_lexico.mini` | Caractere `$` inválido |
| `exemplos/04_erro_sintatico.mini` | Declaração sem `;` |
| `exemplos/05_erros_semanticos.mini` | Nome repetido, tipo incompatível e variável não declarada |
| `exemplos/06_erro_escopo.mini` | Uso de variável depois que o bloco fechou |

## Estrutura

```text
analisador.js              entrada do compilador
testar.js                  testes dos exemplos
compilador/lexico.js       caracteres válidos
compilador/gramatica.pegjs gramática da linguagem
compilador/sintatico.js    parser e erro sintático
compilador/ast.js          impressão da árvore
compilador/semantica.js    tipos e escopo
compilador/tabela.js       tabela de símbolos
exemplos/                  fontes .mini
```
