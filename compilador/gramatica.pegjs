// Gramática da mini-linguagem.
// Este arquivo é a especificação do analisador sintático (o papel do .cup).
// O Peggy, sucessor do PEG.js, lê estas regras e monta o parser.

{
  function posicao() {
    const lugar = location();
    return { linha: lugar.start.line, coluna: lugar.start.column };
  }

  function binaria(operador, esquerda, direita, linha, coluna) {
    return {
      no: "Binaria",
      operador: operador,
      esquerda: esquerda,
      direita: direita,
      linha: linha,
      coluna: coluna,
      tipoExpr: null,
    };
  }
}

programa
  = __ comandos:comando* __ {
      return { no: "Programa", comandos: comandos };
    }

comando
  = cmd:(declaracao / atribuicao / se / escreva / bloco) __ {
      return cmd;
    }

declaracao
  = tipoVar:tipo __ nome:identificador __ ";" {
      return {
        no: "Declaracao",
        tipo: tipoVar,
        nome: nome.nome,
        linha: nome.linha,
        coluna: nome.coluna,
      };
    }

tipo
  = tipoVar:("inteiro" / "logico") ![A-Za-z0-9_] {
      return tipoVar;
    }

atribuicao
  = nome:identificador __ "=" __ expr:expressao __ ";" {
      return {
        no: "Atribuicao",
        nome: nome.nome,
        expr: expr,
        linha: nome.linha,
        coluna: nome.coluna,
      };
    }

se
  = "se" ![A-Za-z0-9_] __ "(" __ condicao:expressao __ ")" __ corpo:comando {
      const lugar = posicao();
      return {
        no: "Se",
        condicao: condicao,
        corpo: corpo,
        linha: lugar.linha,
        coluna: lugar.coluna,
      };
    }

escreva
  = "escreva" ![A-Za-z0-9_] __ "(" __ expr:expressao __ ")" __ ";" {
      const lugar = posicao();
      return {
        no: "Escreva",
        expr: expr,
        linha: lugar.linha,
        coluna: lugar.coluna,
      };
    }

bloco
  = "{" __ comandos:comando* __ "}" {
      const lugar = posicao();
      return {
        no: "Bloco",
        comandos: comandos,
        linha: lugar.linha,
        coluna: lugar.coluna,
      };
    }

expressao
  = expressaoE

expressaoE
  = primeiro:expressaoRelacional resto:passoE* {
      return resto.reduce(function (esquerda, passo) {
        return binaria("&&", esquerda, passo.direita, passo.linha, passo.coluna);
      }, primeiro);
    }

passoE
  = __ op:operadorE __ direita:expressaoRelacional {
      return { linha: op.linha, coluna: op.coluna, direita: direita };
    }

operadorE
  = "&&" {
      return posicao();
    }

expressaoRelacional
  = esquerda:expressaoAditiva __ op:operadorRelacional __ direita:expressaoAditiva {
      return binaria(op.operador, esquerda, direita, op.linha, op.coluna);
    }
  / expressaoAditiva

operadorRelacional
  = operador:("==" / "<" / ">") {
      const lugar = posicao();
      return { operador: operador, linha: lugar.linha, coluna: lugar.coluna };
    }

expressaoAditiva
  = primeiro:expressaoMultiplicativa resto:passoAditivo* {
      return resto.reduce(function (esquerda, passo) {
        return binaria(passo.operador, esquerda, passo.direita, passo.linha, passo.coluna);
      }, primeiro);
    }

passoAditivo
  = __ op:operadorAditivo __ direita:expressaoMultiplicativa {
      return {
        operador: op.operador,
        linha: op.linha,
        coluna: op.coluna,
        direita: direita,
      };
    }

operadorAditivo
  = operador:("+" / "-") {
      const lugar = posicao();
      return { operador: operador, linha: lugar.linha, coluna: lugar.coluna };
    }

expressaoMultiplicativa
  = primeiro:expressaoPrimaria resto:passoMultiplicativo* {
      return resto.reduce(function (esquerda, passo) {
        return binaria("*", esquerda, passo.direita, passo.linha, passo.coluna);
      }, primeiro);
    }

passoMultiplicativo
  = __ op:operadorMultiplicativo __ direita:expressaoPrimaria {
      return { linha: op.linha, coluna: op.coluna, direita: direita };
    }

operadorMultiplicativo
  = "*" {
      return posicao();
    }

expressaoPrimaria
  = numero
  / verdadeiro
  / falso
  / variavel
  / "(" __ expr:expressao __ ")" {
      return expr;
    }

numero
  = texto:$([0-9]+) {
      const lugar = posicao();
      return {
        no: "Numero",
        valor: Number(texto),
        linha: lugar.linha,
        coluna: lugar.coluna,
        tipoExpr: "inteiro",
      };
    }

verdadeiro
  = "verdadeiro" ![A-Za-z0-9_] {
      const lugar = posicao();
      return {
        no: "Logico",
        valor: true,
        linha: lugar.linha,
        coluna: lugar.coluna,
        tipoExpr: "logico",
      };
    }

falso
  = "falso" ![A-Za-z0-9_] {
      const lugar = posicao();
      return {
        no: "Logico",
        valor: false,
        linha: lugar.linha,
        coluna: lugar.coluna,
        tipoExpr: "logico",
      };
    }

variavel
  = id:identificador {
      return {
        no: "Variavel",
        nome: id.nome,
        linha: id.linha,
        coluna: id.coluna,
        tipoExpr: null,
      };
    }

identificador
  = !palavraReservada texto:$([A-Za-z_][A-Za-z0-9_]*) {
      const lugar = posicao();
      return { nome: texto, linha: lugar.linha, coluna: lugar.coluna };
    }

palavraReservada
  = ("inteiro" / "logico" / "se" / "escreva" / "verdadeiro" / "falso") ![A-Za-z0-9_]

__
  = ([ \t\r\n] / comentario)*

comentario
  = "//" [^\n]*
