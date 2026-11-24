// Ponto de entrada do analisador integrado.
//
// Uso:
//   node analisador.js exemplos/01_valido.mini

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mostrar } from "./compilador/ast.js";
import { preparar } from "./compilador/lexico.js";
import { analisar } from "./compilador/semantica.js";
import { analisarSintaxe, erroSintatico } from "./compilador/sintatico.js";
import { imprimirTabela } from "./compilador/tabela.js";

export function analisarFonte(codigo) {
  const preparado = preparar(codigo);
  const erros = preparado.erros.slice();
  let arvore = null;

  try {
    arvore = analisarSintaxe(preparado.texto);
  } catch (erro) {
    arvore = null;
    erros.push(erroSintatico(erro));
  }

  let tabela = null;
  const temErroSintatico = erros.some(function (erro) {
    return erro.etapa === "sintático";
  });
  if (arvore && !temErroSintatico) {
    tabela = analisar(arvore, erros);
  }

  erros.sort(function (a, b) {
    return a.linha - b.linha || a.coluna - b.coluna || a.etapa.localeCompare(b.etapa);
  });

  return { arvore: arvore, tabela: tabela, erros: erros };
}

function textoErro(erro) {
  if (erro.linha <= 0) {
    return "[" + erro.etapa + "] " + erro.mensagem;
  }
  return "[" + erro.etapa + "] linha " + erro.linha + ", coluna " + erro.coluna + ": " + erro.mensagem;
}

export function imprimirResultado(nome, codigo, resultado) {
  console.log("=".repeat(64));
  console.log("Arquivo: " + nome);
  console.log("=".repeat(64));

  console.log("\n--- Código-fonte ---");
  const linhas = quebrarLinhas(codigo);
  if (linhas.length === 0) {
    console.log("(arquivo vazio)");
  } else {
    const largura = String(linhas.length).length;
    linhas.forEach(function (linha, indice) {
      const numero = String(indice + 1).padStart(largura, " ");
      console.log(numero + " | " + linha);
    });
  }

  console.log("\n--- Árvore sintática ---");
  if (!resultado.arvore) {
    console.log("Não construída: há erro sintático e a derivação foi interrompida.");
  } else {
    mostrar(resultado.arvore);
  }

  console.log("\n--- Tabela de símbolos ---");
  if (!resultado.tabela) {
    console.log("Não preenchida: a análise semântica só roda com uma árvore válida.");
  } else {
    imprimirTabela(resultado.tabela);
  }

  console.log("\n--- Erros ---");
  if (resultado.erros.length === 0) {
    console.log("Nenhum erro encontrado.");
  } else {
    for (const erro of resultado.erros) {
      console.log(textoErro(erro));
    }
  }
  console.log();
}

function quebrarLinhas(codigo) {
  let texto = codigo.replace(/\r\n/g, "\n");
  if (texto.endsWith("\n")) {
    texto = texto.slice(0, -1);
  }
  if (texto.length === 0) {
    return [];
  }
  return texto.split("\n");
}

function main() {
  const argumentos = process.argv.slice(2);
  if (argumentos.length === 0) {
    console.error("Uso: node analisador.js arquivo.mini [outros.mini ...]");
    process.exitCode = 2;
    return;
  }

  let codigoSaida = 0;
  for (const caminho of argumentos) {
    if (!fs.existsSync(caminho) || !fs.statSync(caminho).isFile()) {
      console.error("Arquivo não encontrado: " + caminho);
      codigoSaida = 2;
      continue;
    }
    const codigo = fs.readFileSync(caminho, "utf8");
    const resultado = analisarFonte(codigo);
    imprimirResultado(caminho, codigo, resultado);
    if (resultado.erros.length > 0 && codigoSaida === 0) {
      codigoSaida = 1;
    }
  }
  process.exitCode = codigoSaida;
}

const executadoDireto = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (executadoDireto) {
  main();
}
