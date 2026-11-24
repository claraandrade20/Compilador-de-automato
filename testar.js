// Confere os exemplos e mais alguns casos pequenos.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { analisarFonte } from "./analisador.js";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const exemplos = path.join(raiz, "exemplos");

function etapas(resultado) {
  return new Set(resultado.erros.map(function (erro) {
    return erro.etapa;
  }));
}

function nomes(resultado, escopo) {
  let simbolos = resultado.tabela.historico;
  if (escopo !== undefined) {
    simbolos = simbolos.filter(function (simbolo) {
      return simbolo.escopo === escopo;
    });
  }
  return simbolos.map(function (simbolo) {
    return simbolo.nome;
  });
}

function iguais(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function exigir(condicao, nome, resultado) {
  if (condicao) {
    console.log("  ok  " + nome);
    return true;
  }
  console.log("  FALHOU  " + nome);
  if (resultado) {
    for (const erro of resultado.erros) {
      console.log("         [" + erro.etapa + "] linha " + erro.linha + ", coluna " + erro.coluna + ": " + erro.mensagem);
    }
  }
  return false;
}

function lerExemplo(arquivo) {
  return fs.readFileSync(path.join(exemplos, arquivo), "utf8");
}

function testarExemplos() {
  let ok = true;
  const casos = [
    ["01_valido.mini", []],
    ["02_escopo_valido.mini", []],
    ["03_erro_lexico.mini", ["léxico"]],
    ["04_erro_sintatico.mini", ["sintático"]],
    ["05_erros_semanticos.mini", ["semântico"]],
    ["06_erro_escopo.mini", ["semântico"]],
  ];
  for (const caso of casos) {
    const resultado = analisarFonte(lerExemplo(caso[0]));
    const obtido = Array.from(etapas(resultado)).sort();
    ok = exigir(iguais(obtido, caso[1].slice().sort()), caso[0], resultado) && ok;
  }
  return ok;
}

function testarValidoEmDetalhe() {
  const resultado = analisarFonte(lerExemplo("01_valido.mini"));
  let ok = true;
  ok = exigir(iguais(nomes(resultado, 0), ["x", "ok"]), "globais do exemplo 01", resultado) && ok;
  ok = exigir(iguais(nomes(resultado, 1), ["dobro"]), "dobro fica no escopo 1", resultado) && ok;
  return ok;
}

function testarEscopoEmDetalhe() {
  const resultado = analisarFonte(lerExemplo("02_escopo_valido.mini"));
  const xs = resultado.tabela.historico.filter(function (simbolo) {
    return simbolo.nome === "x";
  });
  return exigir(xs.length === 2 && xs[0].escopo === 0 && xs[1].escopo === 1, "dois x em escopos diferentes", resultado);
}

function testarColunaDoCifrao() {
  const codigo = lerExemplo("03_erro_lexico.mini");
  const resultado = analisarFonte(codigo);
  const linhas = codigo.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  let linha = 0;
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].includes("$") && !linhas[i].trim().startsWith("//")) {
      linha = i + 1;
      break;
    }
  }
  const coluna = linhas[linha - 1].indexOf("$") + 1;
  const erro = resultado.erros[0];
  return exigir(
    erro.etapa === "léxico" && erro.linha === linha && erro.coluna === coluna &&
      resultado.arvore && resultado.erros.length === 1,
    "posição do $ (esperado " + linha + ":" + coluna + ", obtido " + erro.linha + ":" + erro.coluna + ")",
    resultado
  );
}

function testarSintaxeNaoMontaArvore() {
  const resultado = analisarFonte(lerExemplo("04_erro_sintatico.mini"));
  return exigir(!resultado.arvore && !resultado.tabela, "erro sintático interrompe a árvore", resultado);
}

function testarMensagensSemanticas() {
  const resultado = analisarFonte(lerExemplo("05_erros_semanticos.mini"));
  const texto = resultado.erros.map(function (erro) {
    return erro.mensagem;
  }).join("\n");
  const esperados = [
    "já declarada",
    "não é possível atribuir um valor do tipo inteiro",
    "não declarada",
    "não é possível atribuir um valor do tipo logico",
    "condição do 'se'",
  ];
  const faltando = esperados.filter(function (trecho) {
    return !texto.includes(trecho);
  });
  return exigir(faltando.length === 0, "mensagens do exemplo 05" + (faltando.length ? " faltou " + faltando.join(", ") : ""), resultado);
}

function testarYForaDoBloco() {
  const resultado = analisarFonte(lerExemplo("06_erro_escopo.mini"));
  return exigir(
    resultado.erros.length === 1 && resultado.erros[0].mensagem.includes("não declarada") &&
      iguais(nomes(resultado), ["x", "y"]),
    "y só existe dentro do bloco",
    resultado
  );
}

function testarCasosExtras() {
  let ok = true;

  const vazio = analisarFonte("");
  ok = exigir(vazio.arvore && vazio.erros.length === 0, "arquivo vazio é um programa válido", vazio) && ok;

  const comentario = analisarFonte("// o caractere $ aqui não conta\ninteiro x;\nx = 1;\n");
  ok = exigir(comentario.erros.length === 0, "$ dentro de comentário não é erro", comentario) && ok;

  const precedencia = analisarFonte("inteiro x;\nx = 1 + 2 * 3;\n");
  const conta = precedencia.arvore.comandos[precedencia.arvore.comandos.length - 1].expr;
  ok = exigir(
    precedencia.erros.length === 0 && conta.no === "Binaria" && conta.operador === "+" &&
      conta.direita.no === "Binaria" && conta.direita.operador === "*",
    "multiplicação acontece antes da soma",
    precedencia
  ) && ok;

  const comparaBool = analisarFonte("logico ok;\nok = verdadeiro < falso;\n");
  ok = exigir(
    comparaBool.erros.some(function (erro) { return erro.mensagem.includes("exige inteiros"); }),
    "menor-que não aceita lógico",
    comparaBool
  ) && ok;

  const sombra = analisarFonte("inteiro x;\nx = 1;\n{\n    logico x;\n    x = verdadeiro;\n}\n");
  ok = exigir(sombra.erros.length === 0 && nomes(sombra).length === 2, "o x de dentro pode ter outro tipo", sombra) && ok;

  const redeclarada = analisarFonte("inteiro x;\n{\n    inteiro x;\n    inteiro x;\n}\n");
  ok = exigir(
    redeclarada.erros.length === 1 && nomes(redeclarada).length === 2,
    "redeclarar no mesmo bloco é erro",
    redeclarada
  ) && ok;

  const aninhado = analisarFonte("inteiro a;\n{\n    inteiro b;\n    {\n        inteiro c;\n    }\n}\n");
  const ids = {};
  for (const simbolo of aninhado.tabela.historico) {
    ids[simbolo.nome] = simbolo.escopo;
  }
  ok = exigir(
    aninhado.erros.length === 0 && ids.a === 0 && ids.b === 1 && ids.c === 2,
    "bloco dentro de bloco ganha outro número",
    aninhado
  ) && ok;

  return ok;
}

function main() {
  console.log("Exemplos:");
  let ok = testarExemplos();
  console.log("Detalhes:");
  ok = testarValidoEmDetalhe() && ok;
  ok = testarEscopoEmDetalhe() && ok;
  ok = testarColunaDoCifrao() && ok;
  ok = testarSintaxeNaoMontaArvore() && ok;
  ok = testarMensagensSemanticas() && ok;
  ok = testarYForaDoBloco() && ok;
  ok = testarCasosExtras() && ok;
  console.log();
  if (ok) {
    console.log("Todos os testes passaram.");
    process.exitCode = 0;
    return;
  }
  console.log("Há testes com falha.");
  process.exitCode = 1;
}

main();
