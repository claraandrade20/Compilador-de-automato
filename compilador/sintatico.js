// Lê a gramática e monta o parser. Este arquivo é a configuração do gerador.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import peggy from "peggy";

const pasta = path.dirname(fileURLToPath(import.meta.url));
const gramatica = fs.readFileSync(path.join(pasta, "gramatica.pegjs"), "utf8");
const parser = peggy.generate(gramatica);

export function analisarSintaxe(texto) {
  return parser.parse(texto);
}

export function erroSintatico(erro) {
  const lugar = erro.location;
  if (!lugar) {
    return {
      etapa: "sintático",
      linha: 0,
      coluna: 0,
      mensagem: "fim inesperado do arquivo",
    };
  }

  const encontrado = erro.found == null ? "fim de arquivo" : erro.found;
  return {
    etapa: "sintático",
    linha: lugar.start.line,
    coluna: lugar.start.column,
    mensagem: "token inesperado '" + encontrado + "'",
  };
}
