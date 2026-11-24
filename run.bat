@echo off
cd /d "%~dp0"
if not exist node_modules npm install
node analisador.js exemplos\01_valido.mini exemplos\02_escopo_valido.mini exemplos\03_erro_lexico.mini exemplos\04_erro_sintatico.mini exemplos\05_erros_semanticos.mini exemplos\06_erro_escopo.mini
echo.
echo Pressione uma tecla para fechar.
pause >nul
