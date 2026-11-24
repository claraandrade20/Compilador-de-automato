// Procura caracteres que não existem na linguagem.
// Comentário e espaço são mantidos para a linha e a coluna não mudarem.

const SIMPLES = "+-*<>=(){};";

export function preparar(codigo) {
  if (codigo.charCodeAt(0) === 0xfeff) {
    codigo = codigo.slice(1);
  }

  const erros = [];
  let texto = "";
  let linha = 1;
  let coluna = 1;

  for (let i = 0; i < codigo.length; i++) {
    const caractere = codigo[i];

    if (caractere === "\n") {
      texto += caractere;
      linha += 1;
      coluna = 1;
      continue;
    }

    if (caractere === " " || caractere === "\t" || caractere === "\r") {
      texto += caractere;
      coluna += 1;
      continue;
    }

    if (caractere === "/" && codigo[i + 1] === "/") {
      texto += "//";
      i += 2;
      coluna += 2;
      while (i < codigo.length && codigo[i] !== "\n") {
        texto += codigo[i];
        i += 1;
        coluna += 1;
      }
      i -= 1;
      continue;
    }

    if (caractere === "&" && codigo[i + 1] === "&") {
      texto += "&&";
      i += 1;
      coluna += 2;
      continue;
    }

    const letraOuDigito = /[A-Za-z0-9_]/.test(caractere);
    if (letraOuDigito || SIMPLES.includes(caractere)) {
      texto += caractere;
      coluna += 1;
      continue;
    }

    erros.push({
      etapa: "léxico",
      linha: linha,
      coluna: coluna,
      mensagem: "caractere inválido '" + caractere + "'",
    });
    texto += " ";
    coluna += 1;
  }

  return { texto: texto, erros: erros };
}
