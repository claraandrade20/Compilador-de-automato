// Tabela de símbolos com escopos empilhados.
// A pilha só guarda os escopos abertos. O histórico guarda tudo para a impressão.

export function criarTabela() {
  return {
    pilha: [{}],
    ids: [0],
    proximoId: 1,
    historico: [],
    blocos: [],
  };
}

export function entrarEscopo(tabela, linha) {
  const identificador = tabela.proximoId;
  tabela.proximoId += 1;
  tabela.pilha.push({});
  tabela.ids.push(identificador);
  const profundidade = tabela.pilha.length - 1;
  tabela.blocos.push({ identificador: identificador, profundidade: profundidade, linha: linha });
}

export function sairEscopo(tabela) {
  tabela.pilha.pop();
  tabela.ids.pop();
}

export function declarar(tabela, nome, tipo, linha, coluna) {
  const atual = tabela.pilha[tabela.pilha.length - 1];
  if (Object.prototype.hasOwnProperty.call(atual, nome)) {
    return null;
  }
  const simbolo = {
    nome: nome,
    tipo: tipo,
    linha: linha,
    coluna: coluna,
    escopo: tabela.ids[tabela.ids.length - 1],
  };
  atual[nome] = simbolo;
  tabela.historico.push(simbolo);
  return simbolo;
}

export function declaradoAqui(tabela, nome) {
  const atual = tabela.pilha[tabela.pilha.length - 1];
  return atual[nome] || null;
}

export function buscar(tabela, nome) {
  for (let i = tabela.pilha.length - 1; i >= 0; i--) {
    if (tabela.pilha[i][nome]) {
      return tabela.pilha[i][nome];
    }
  }
  return null;
}

function campo(texto, largura) {
  return String(texto).padEnd(largura, " ");
}

export function imprimirTabela(tabela) {
  console.log("Escopos:");
  console.log("  0   global");
  for (const bloco of tabela.blocos) {
    console.log(
      "  " + bloco.identificador + "   bloco da linha " + bloco.linha +
      " (profundidade " + bloco.profundidade + ")"
    );
  }

  console.log();
  if (tabela.historico.length === 0) {
    console.log("Nenhum símbolo declarado.");
    return;
  }

  console.log(
    campo("Nome", 12) + " " + campo("Tipo", 10) + " " + campo("Escopo", 8) + " " +
    campo("Linha", 8) + " " + campo("Coluna", 8)
  );
  console.log("-".repeat(50));
  for (const simbolo of tabela.historico) {
    console.log(
      campo(simbolo.nome, 12) + " " + campo(simbolo.tipo, 10) + " " +
      campo(simbolo.escopo, 8) + " " + campo(simbolo.linha, 8) + " " +
      campo(simbolo.coluna, 8)
    );
  }
}
