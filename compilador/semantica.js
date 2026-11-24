// Regras de escopo e de tipo. O programa não é executado.

import {
  buscar,
  criarTabela,
  declaradoAqui,
  declarar,
  entrarEscopo,
  sairEscopo,
} from "./tabela.js";

export function analisar(programa, erros) {
  const tabela = criarTabela();
  for (const comando of programa.comandos) {
    visitarComando(comando, tabela, erros);
  }
  return tabela;
}

function visitarComando(no, tabela, erros) {
  if (no.no === "Declaracao") {
    visitarDeclaracao(no, tabela, erros);
  } else if (no.no === "Atribuicao") {
    visitarAtribuicao(no, tabela, erros);
  } else if (no.no === "Se") {
    visitarSe(no, tabela, erros);
  } else if (no.no === "Escreva") {
    visitarExpressao(no.expr, tabela, erros);
  } else if (no.no === "Bloco") {
    entrarEscopo(tabela, no.linha);
    for (const comando of no.comandos) {
      visitarComando(comando, tabela, erros);
    }
    sairEscopo(tabela);
  }
}

function visitarDeclaracao(no, tabela, erros) {
  const simbolo = declarar(tabela, no.nome, no.tipo, no.linha, no.coluna);
  if (simbolo) {
    return;
  }
  const anterior = declaradoAqui(tabela, no.nome);
  erros.push({
    etapa: "semântico",
    linha: no.linha,
    coluna: no.coluna,
    mensagem:
      "variável '" + no.nome + "' já declarada neste escopo " +
      "(primeira declaração na linha " + anterior.linha + ")",
  });
}

function visitarAtribuicao(no, tabela, erros) {
  const simbolo = buscar(tabela, no.nome);
  if (!simbolo) {
    erros.push({
      etapa: "semântico",
      linha: no.linha,
      coluna: no.coluna,
      mensagem: "variável '" + no.nome + "' não declarada",
    });
  }
  const tipoExpr = visitarExpressao(no.expr, tabela, erros);
  if (!simbolo || !tipoExpr) {
    return;
  }
  if (simbolo.tipo === tipoExpr) {
    return;
  }
  erros.push({
    etapa: "semântico",
    linha: no.linha,
    coluna: no.coluna,
    mensagem:
      "não é possível atribuir um valor do tipo " + tipoExpr +
      " à variável '" + no.nome + "' do tipo " + simbolo.tipo,
  });
}

function visitarSe(no, tabela, erros) {
  const tipo = visitarExpressao(no.condicao, tabela, erros);
  if (tipo && tipo !== "logico") {
    erros.push({
      etapa: "semântico",
      linha: no.condicao.linha,
      coluna: no.condicao.coluna,
      mensagem: "a condição do 'se' deve ser do tipo logico, mas é " + tipo,
    });
  }
  visitarComando(no.corpo, tabela, erros);
}

function visitarExpressao(no, tabela, erros) {
  if (no.no === "Numero" || no.no === "Logico") {
    return no.tipoExpr;
  }
  if (no.no === "Variavel") {
    return visitarVariavel(no, tabela, erros);
  }
  if (no.no === "Binaria") {
    return visitarBinaria(no, tabela, erros);
  }
  return null;
}

function visitarVariavel(no, tabela, erros) {
  const simbolo = buscar(tabela, no.nome);
  if (!simbolo) {
    erros.push({
      etapa: "semântico",
      linha: no.linha,
      coluna: no.coluna,
      mensagem: "variável '" + no.nome + "' não declarada",
    });
    return null;
  }
  no.tipoExpr = simbolo.tipo;
  return simbolo.tipo;
}

function visitarBinaria(no, tabela, erros) {
  const esquerda = visitarExpressao(no.esquerda, tabela, erros);
  const direita = visitarExpressao(no.direita, tabela, erros);
  const resultado = tipoBinario(no.operador, esquerda, direita, no.linha, no.coluna, erros);
  no.tipoExpr = resultado;
  return resultado;
}

function tipoBinario(operador, esquerda, direita, linha, coluna, erros) {
  if (!esquerda || !direita) {
    return null;
  }

  if (operador === "+" || operador === "-" || operador === "*") {
    if (esquerda === "inteiro" && direita === "inteiro") {
      return "inteiro";
    }
    erros.push({
      etapa: "semântico",
      linha: linha,
      coluna: coluna,
      mensagem: "operador '" + operador + "' exige inteiros, mas recebeu " + esquerda + " e " + direita,
    });
    return null;
  }

  if (operador === "<" || operador === ">") {
    if (esquerda === "inteiro" && direita === "inteiro") {
      return "logico";
    }
    erros.push({
      etapa: "semântico",
      linha: linha,
      coluna: coluna,
      mensagem: "operador '" + operador + "' exige inteiros, mas recebeu " + esquerda + " e " + direita,
    });
    return null;
  }

  if (operador === "==") {
    if (esquerda === direita) {
      return "logico";
    }
    erros.push({
      etapa: "semântico",
      linha: linha,
      coluna: coluna,
      mensagem: "não é possível comparar " + esquerda + " com " + direita,
    });
    return null;
  }

  if (operador === "&&") {
    if (esquerda === "logico" && direita === "logico") {
      return "logico";
    }
    erros.push({
      etapa: "semântico",
      linha: linha,
      coluna: coluna,
      mensagem: "operador '&&' exige valores lógicos, mas recebeu " + esquerda + " e " + direita,
    });
    return null;
  }

  return null;
}
