// Imprime a árvore sintática do mesmo jeito em todos os exemplos.

function espacos(nivel) {
  return "  ".repeat(nivel);
}

function comTipo(no) {
  if (no.tipoExpr) {
    return " : " + no.tipoExpr;
  }
  return "";
}

export function mostrar(no, nivel = 0) {
  const margem = espacos(nivel);

  if (no.no === "Programa") {
    console.log(margem + "Programa");
    if (no.comandos.length === 0) {
      console.log(espacos(nivel + 1) + "(nenhum comando)");
      return;
    }
    for (const comando of no.comandos) {
      mostrar(comando, nivel + 1);
    }
    return;
  }

  if (no.no === "Declaracao") {
    console.log(margem + "Declaracao " + no.tipo + ": " + no.nome + "  (linha " + no.linha + ")");
    return;
  }

  if (no.no === "Atribuicao") {
    console.log(margem + "Atribuicao " + no.nome + "  (linha " + no.linha + ")");
    mostrar(no.expr, nivel + 1);
    return;
  }

  if (no.no === "Se") {
    console.log(margem + "Se  (linha " + no.linha + ")");
    console.log(espacos(nivel + 1) + "condicao:");
    mostrar(no.condicao, nivel + 2);
    console.log(espacos(nivel + 1) + "entao:");
    mostrar(no.corpo, nivel + 2);
    return;
  }

  if (no.no === "Escreva") {
    console.log(margem + "Escreva  (linha " + no.linha + ")");
    mostrar(no.expr, nivel + 1);
    return;
  }

  if (no.no === "Bloco") {
    console.log(margem + "Bloco  (linha " + no.linha + ")");
    if (no.comandos.length === 0) {
      console.log(espacos(nivel + 1) + "(nenhum comando)");
      return;
    }
    for (const comando of no.comandos) {
      mostrar(comando, nivel + 1);
    }
    return;
  }

  if (no.no === "Binaria") {
    console.log(margem + "Binaria '" + no.operador + "'" + comTipo(no));
    mostrar(no.esquerda, nivel + 1);
    mostrar(no.direita, nivel + 1);
    return;
  }

  if (no.no === "Numero") {
    console.log(margem + "Numero " + no.valor + comTipo(no));
    return;
  }

  if (no.no === "Logico") {
    const texto = no.valor ? "verdadeiro" : "falso";
    console.log(margem + "Logico " + texto + comTipo(no));
    return;
  }

  if (no.no === "Variavel") {
    console.log(margem + "Variavel " + no.nome + comTipo(no));
  }
}
