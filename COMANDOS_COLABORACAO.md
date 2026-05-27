# Comandos de colaboracao

## 1. Primeira vez no PC do colaborador

```powershell
git clone URL_DO_REPOSITORIO
cd "GERAÇÃO 3 D"
npm.cmd run setup
npm.cmd run dev:local
```

Abrir:

```text
http://127.0.0.1:5173
```

## 2. Validar antes de enviar alteracoes

```powershell
npm.cmd run check
```

## 3. Subir alteracoes para o GitHub

```powershell
git status
git add .
git commit -m "descricao curta da alteracao"
git push
```

## 4. Pegar alteracoes do amigo

```powershell
git pull
npm.cmd run setup
npm.cmd run dev:local
```

## 5. Criar repositorio no GitHub pelo site

1. Entre em https://github.com/new
2. Crie um repositorio vazio.
3. Nao marque README, .gitignore ou license, porque o projeto ja tem esses arquivos.
4. Copie a URL do repositorio.
5. Rode os comandos abaixo na pasta `D:\GERAÇÃO 3 D`.

```powershell
git init
git add .
git commit -m "primeira versao do image to 3d event architect"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

## 6. Criar repositorio pelo GitHub CLI

Se voce instalar o GitHub CLI:

```powershell
winget install GitHub.cli
gh auth login
cd "D:\GERAÇÃO 3 D"
git init
git add .
git commit -m "primeira versao do image to 3d event architect"
gh repo create image-to-3d-event-architect --private --source . --remote origin --push
```
