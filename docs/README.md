# Instalação e Configuração Inicial do Hyperledger Fabric 1.4.x

Este roteiro visa orientar o processo de instalação e configuração inicial de um serviço de blockchain para desenvolvimento de software, com base na plataforma [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/) da [Linux Foundation](https://www.linuxfoundation.org/), tendo como fonte de informação a documentação da própria plataforma que está disponível para consultas na Internet.

## Premissas

Sistema computacional disponível para uso dedicado com a seguinte configuração:

* Processador Single-Socket Quad-Core, equivalente a Intel Core i5;
* Memória RAM de 8 GB;
* Espaço em disco livre de 50 GB, preferencialmente equivalente a SSD; e
* Sistema operacional Linux Ubuntu versão 16.x ou superior, pré-instalado.

## Instalar Pré-requisitos

### Preparar Ambiente do Sistema Computacional

1. Conectar-se ao sistema através de uma console SSH:

    $> ssh (username)@(ip-address)

2. Criar usuário FABRIC:

    $> sudo adduser fabric

3. Adicionar FABRIC ao grupo SUDO:

    $> sudo usermod -aG sudo fabric

4. Executar os comandos como `fabric':

    $> su fabric

5. Verificar versão (16.x) do Ubuntu:

    $> lsb_release -a

6. Verificar espaço em disco:
[Disk Ref. A](https://www.cyberciti.biz/faq/linux-check-disk-space-command/);
[Disk Ref. B](https://www.howtogeek.com/409611/how-to-view-free-disk-space-and-disk-usage-from-the-linux-terminal/).

    $> df -h

7. Instalar auxiliar de visualização de espaço em disco:
[Disk Ref. C](https://lintut.com/ncdu-check-disk-usage/).

    $> sudo apt install ncdu

8. Instalar auxiliar para verificação de pacotes:

    $> sudo apt install aptitude

### Atualizar Sistema Operacional Ubuntu 16.x para versão 18.x

Esta fase de atualização do sistema pode demorar mais de 4 horas para realizar completamente, com intervenções do operador sempre que solicitado.
[Ubuntu Ref. A](https://linuxize.com/post/how-to-check-your-ubuntu-version/);
[Ubuntu Ref. B](https://www.zdnet.com/article/how-to-upgrade-from-ubuntu-linux-16-04-to-18-04/).

1. Atualizar pacotes do sistema:

    $> sudo apt update
    $> sudo apt upgrade

2. Preparar o upgrade do Ubuntu subindo a release do 16.x:

    $> sudo apt dist-upgrade
    $> sudo apt autoremove

3. Reiniciar o sistema inteiro para completar a instalação:

    $> sudo reboot

4. Fazer o upgrade para a versão 18.x:

    $> sudo do-release-upgrade

5. Remover pacotes obsoletos manualmente:
[Ubuntu Ref. C](https://www.cyberciti.biz/faq/ubuntu-18-04-remove-all-unused-old-kernels/);
[Ubuntu Ref. D](https://unix.stackexchange.com/questions/413942/how-to-handle-obsolete-packages-when-upgrading-distribution).

    $> sudo apt --purge autoremove
    $> sudo apt update
    $> sudo apt autoremove

6. Atualizar os pacotes do sistema:

    $> sudo apt upgrade
    $> sudo apt update

7. Verificar versão e release do Ubuntu:

    $> lsb_release -a

8. Instalar pacotes e pré-requisitos comuns de desenvolvimento de software:

    $> sudo apt install software-properties-common
    $> sudo apt install build-essential make unzip g++ libtool

9. Reiniciar o sistema inteiro para confirmar instalações:

    $> sudo reboot

### Instalar *bash auto completion*

1. [Como Instalar](https://www.cyberciti.biz/faq/add-bash-auto-completion-in-ubuntu-linux/):

    $> sudo apt update
    $> sudo apt install bash-completion
    $> cat /etc/profile.d/bash_completion.sh

2. Adicionar "/etc/profile.d/bash_completion.sh" em seu "~/.bashrc":

    $> echo "## bash auto completion configuration" >> ~/.bashrc
    $> echo "source /etc/profile.d/bash_completion.sh" >> ~/.bashrc
    $> echo "## " >>  ~/.bashrc
    $> source  ~/.bashrc

### Instalar *cURL*

* [Como Instalar](https://www.luminanetworks.com/docs-lsc-610/Topics/SDN_Controller_Software_Installation_Guide/Appendix/Installing_cURL_for_Ubuntu_1.html):

    $> sudo apt update
    $> sudo apt install curl
    $> curl --version

### Instalar *figlet* Para Uso Geral em Testes

* Instalar:

    $> sudo apt install figlet
    $> figlet hello hyperledger

### Instalar Git Client

* [Como Instalar](https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-18-04-quickstart):

    $> sudo apt update
    $> sudo apt install git git-doc git-el git-email
    $> git --version

### Verificar e/ou Instalar Python 3.x

1. Verificar:

    $> python --version

2. Se o Python não existir, instale usando o comando:

    $> sudo apt install python

3. Se já existe uma versão 2.7.x ou superior do Python, pode-se instalar a versão 3.7:

    $> sudo apt install python3.7
    $> python3 -v

### Instalar ou Atualizar PIP (Relativo ao Python)

1. [Como Instalar](https://pip.pypa.io/en/stable/installing/):

    $> sudo apt install python-pip

2. Atualizar:

    $> pip install -U pip

### Instalar Java OpenJDK

* Instalar:

    $> sudo apt update
    $> sudo apt install default-jre
    $> sudo apt install default-jdk
    $> java -version
    $> javac -version

### Instalar Maven

* [Como Instalar](https://linuxize.com/post/how-to-install-apache-maven-on-ubuntu-18-04/):

    $> sudo apt install maven
    $> mvn -version

### Instalar Go Lang 1.12.x SDK Programming

Ler as orientações disponíveis em sites na Internet:
[Ref. A](https://golang.org/dl/);
[Ref. B](https://tecadmin.net/install-go-on-ubuntu/).

1. Baixar e descompactar arquivos:

    $> cd  ~
    $> wget https://golang.org/dl/go1.12.10.linux-amd64.tar.gz
    $> tar -xvf go1.12.10.linux-amd64.tar.gz

2. Instalar pré-requisitos e preparar diretórios:

    $> sudo apt install -y libtool libltdl-dev
    $> mv go go1.12.10  
    $> sudo mv go1.12.10 /usr/local/
    $> sudo ln -s /usr/local/go1.12.10 /usr/local/go
    $> sudo chown -R fabric /usr/local/go
    $> sudo chgrp -R fabric /usr/local/go
    $> sudo chmod -R 755 /usr/local/go

3. Ajustar variáveis de ambiente:

    $> cd  ~
    $> mkdir  ~/go-work
    $> echo "# GO Language env begin" >>  ~/.profile
    $> echo "export GOROOT=/usr/local/go" >>  ~/.profile
    $> echo "export GOPATH=$HOME/go-work" >>  ~/.profile
    $> echo "export PATH=$GOROOT/bin:$GOPATH/bin:$PATH" >>  ~/.profile
    $> echo "# GO Language env end" >>  ~/.profile
    $> source  ~/.profile
    $> go version

## Instalar Virtualização de Sistemas

Ler as orientações disponíveis em sites na Internet:
[Docker Ref. A](https://docs.docker.com/install/linux/docker-ce/ubuntu/);
[Docker Ref. B](https://docs.docker.com/install/linux/linux-postinstall/);
[Docker Ref. C](https://www.uniwebb.com/blog/post/how-to-install-hyperledger-fabric-14-on-ubuntu-1804-lts/1766/).

### Instalar Docker

1. Desinstalar alguma versão antiga:

    $> sudo apt remove docker docker-engine docker.io containerd runc

2. Preparar repositório e verificar pré-requisitos:

    $> sudo apt install -y apt-transport-https ca-certificates
    $> sudo apt install -y gnupg-agent software-properties-common

3. Adicionar a chave GPG oficial:

    $> curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

4. Verificar a chave GPG:

    $> sudo apt-key fingerprint 0EBFCD88

    * A saída prevista para o comando acima é:

        *pub   rsa4096 2017-02-22 [SCEA]*
        *.        9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88*
        *uid           [ unknown] Docker Release (CE deb) < docker@docker.com>*
        *sub   rsa4096 2017-02-22 [S]*

5. Configurar repositório estável:

    $> sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

6. Atualizar o índice de pacotes

    $> sudo apt update

7. Instalar a última versão estável do __Docker__:

    $> sudo apt install docker-ce docker-ce-cli containerd.io

8. Verificar onde o Docker foi instalado:

    $> dpkg -L docker-ce

9. Verificar versões instaladas:

    $> docker -v

### Instalar Docker Compose

Ler a documentação disponível na Internet:
[Docker Install](https://docs.docker.com/compose/install/);
[HLF Pre-reqs](https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html).

1. Instalar a versão 1.24.1 do Docker-Compose

    $> sudo curl -L "https://github.com/docker/compose/releases/download/1.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    $>
    $> sudo apt install docker-compose

2. Configurar diretórios e usuários do Docker-Compose

    $> sudo chmod +x /usr/local/bin/docker-compose
    $> sudp apt upgrade

3. Verificar versões instaladas:

    $> docker-compose -v

### Docker Como Serviço

1. Executar Hello-World:

    $> docker run hello-world
    $> docker run busybox echo hello world
    $> docker ps -a
    $> docker images

2. Habilitar o Docker como um serviço no sistema:

    $> sudo systemctl enable docker

## Instalar Runtime de JavaScript

### Instalar Pré-requisitos para Node.js

* Recursos preliminares:

    $> sudo apt install build-essential libssl-dev
    $> sudo apt install openssl pkg-config
    $> sudo apt install gcc g++ make

### Instalar um Gerenciador de Versão do Node.js

* Antes de qualquer ação, verifique e trate possível versão anterior do NVM que pode já existir antes no sistema.
* Utilize os recursos disponíveis na Internet:
    [NVM Ref. A](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04-pt);
    [NVM Ref. B](https://www.liquidweb.com/kb/how-to-install-node-version-manager-on-ubuntu/);
    [NVM Ref. C](https://stackoverflow.com/questions/11542846/nvm-node-js-recommended-install-for-all-users).

1. Verificar última release estável do [NVM](https://github.com/nvm-sh/nvm/releases/latest).
Primeiro verifique qual é o identificador da versão mais recente, para poder alterar a URL utilizada com o comando abaixo.

2. Baixar script de instalação NVM. Altere a URL para a versão mais recente:

    $> cd  ~
    $> curl -sL "https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh" -o install_nvm.sh

3. Auditar o arquivo bash .SH antes de executar a instalação, porque você deve garantir que neste arquivo a codificação é confiável para executar como SUDO no ambiente. Você pode usar o editor NANO:

    $> nano install_nvm.sh

4. Executar o script bash.
    * O script instalará o software em um subdiretório do seu diretório home em  "~/.nvm", e também adicionará as linhas necessárias no seu arquivo  ~/.profile para usar o as variáveis de ambiente no sistema:

    $> bash install_nvm.sh

5. Efetuar logoff e em seguida login, para o sistema carregar as variáveis de ambiente a partir de *$HOME/.bashrc* automaticamente.

6. Recarregar suas variáveis de ambiente:

    $> source  ~/.profile

7. Verificar a versão instalada do NVM:

    $> nvm --version

### Instalar Node.js versão 8.x

* Consultar as referências sobre a instalação do Node.js que estão disponíveis na Internet:
    [Node Ref. A](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-18-04-pt)
    [Node Ref. B](https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/)
    [Node Ref. C](https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/)

1. Instalar as versões de Node.js isoladamente usando o NVM.
    * Para maiores informações sobre as versões do Node.js disponíveis, execute o comando e analise o conteúdo do arquivo .txt buscando pela melhor versão para seu propósito:

    $> nvm ls-remote > node-versions-actualdate.txt

2. Instalar Node.js 8.x:

    $> nvm install 8.17.0

3. Instruir o NVM para usar a versão instalada:

    $> nvm use 8.17.0

4. Verificar a versão do Node.js instalada:

    $> nvm ls

5. Tornar a versão instalada como a versão *default*:

    $> nvm alias default 8.17.0

6. Verificar Node.js:

    $> node -v

7. Verificar NPM:

    $> npm -v

### Configurar Node.js

1. Preparar módulos do `Node.js for Fabric' em um repositório local:

    $> cd ~
    $> mkdir ~/hyperledger
    $> cd ~/hyperledger
    $> npm init

    * _About to write to /home/fabric/hyperledger/package.json:_

    {
        "name":"hyperledger",
        "version":"1.0.0",
        "description":"NPM Modules for Hyperledger Fabric",
        "main":"index.js",
        "scripts":{
        "test":"npm -v",
        "keywords":[
        "hyperledger",
        "fabric",
        "node"
        ],
        "author":"",
        "license":"ISC"
        }
    }

2. Instalar GULP:

    $> npm install -y gulp

3. Instalar Pacotes Utilitários:

    $> npm install -y util http https tape

4. Instalar Log4JS (logging):

    $> npm install -y log4js

5. Instalar Mocha JavaScript test framework:

    $> npm install -y mocha

6. Instalar Gyp:

    $> npm install -y gyp

7. Instalar Node-Pre-Gyp:

    $> npm install -y node-pre-gyp

8. Instalar GRPC (tem que ser no repositório local):

    $> npm install -y grpc

### Componentes para Criptografia no Node.js

1. Instalar biblioteca JavaScript:[Elliptic](https://www.npmjs.com/package/elliptic):

    $> npm install elliptic

2. Instalar biblioteca JavaScript:[OpenPGP](https://openpgpjs.org/openpgpjs/doc):

    $> npm install openpgp

3. Instalar biblioteca JavaScript:[Forge](https://github.com/digitalbazaar/forge):

    $> npm install node-forge

4. Instalar biblioteca JavaScript:[File-Type](https://www.npmjs.com/package/file-type):

    $> npm install file-type

### Verificar Componentes Nativos de Criptografia do Node.js

Biblioteca [Crypto.js](https://nodejs.org/docs/latest-v10.x/api/crypto.html)

* Comandos em sequência para execução no prompt:

    $> node
            >
            > const crypto = require('crypto');
            > const ciphers = crypto.getCiphers();
            > console.log(ciphers);
            > .exit

## Instalar Utilitários

### Instalar JQuery

* Informações sobre o JQuery podem ser encontradas em sites na Internet:
[JQuery](https://jquery.com/);
[JQuery by IBM dev](https://developer.ibm.com/recipes/tutorials/developing-backend-application-with-hyperledger-fabric-through-sdk/).

* Comandos a serem executados:

    $> cd  ~
    $> sudo apt install -y jq
    $> jq --version

## Concluir a Configuração dos Pré-Requisitos

1. Atualizar referências dos pacotes:

    $> sudo apt update

2. Fazer upgrade dos pacotes:

    $> sudo apt upgrade

3. Limpar os pacotes desnecessários:

    $> sudo apt --purge autoremove

4. Reiniciar sistema:

    $> sudo reboot

## Configurar Hyperledger para Ambiente de Desenvolvimento

* Busque na Internet e revise as instruções de instalação do Hyperledger Fabric 1.4.x:
[HLF Install](https://hyperledger-fabric.readthedocs.io/en/latest/install.html);
[HLF devenv](https://hyperledger-fabric.readthedocs.io/en/release-1.4/dev-setup/devenv.html);
[HLF at Ubuntu](https://www.uniwebb.com/blog/post/how-to-install-hyperledger-fabric-14-on-ubuntu-1804-lts/1766/);
[HLF host create](https://medium.com/@kctheservant/setup-a-hyperledger-fabric-host-and-create-a-machine-image-682859fd58ba).

### Preparação do Fabric

1. Mover para o diretório para o repositório:

    $> cd  ~/hyperledger

2. Verificar e REMOVER as imagens Docker já existentes:

    $> docker images
    $> docker system prune -a

3. Recuperar o release de produção mais recente (1.4.5):

    $> curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.9 1.4.9 0.4.22

4. Reiniciar sistema:

    Installing hyperledger/fabric-samples repo
    (. . .)
    = = => List out hyperledger docker images

5. Verificar as imagens Docker baixadas:

    $> docker images

6. Checkout do Java OpenSDK a partir do [repositório no GitHub](https://github.com/hyperledger/fabric-sdk-java):

    $> cd  ~/hyperledger
    $> git clone https://github.com/hyperledger/fabric-sdk-java.git
    $> ls fabric-sdk-java

7. Checkout do Node.js SDK a partir do [repositório no GitHub](https://github.com/hyperledger/fabric-sdk-node). Informações adicionais estão em [SDK Node 1.4](https://fabric-sdk-node.github.io/release-1.4/index.html)

    $> cd  ~/hyperledger
    $> git clone https://github.com/hyperledger/fabric-sdk-node.git
    $> ls fabric-sdk-node

8. Verificar os diretórios principais baixados:

    $> ls fabric*
    $> ls fabric-samples/bin

### Configurar Variáveis de Ambiente

Dica: Edite o arquivo com o comando *nano .profile* para corrigir/ajustar o conteúdo das variáveis de ambiente.

* Comandos a serem executados:

    $> cd  ~
    $> echo "# HYPERLEDGER FABRIC env begin" >>  ~/.profile
    $> echo "export FABRICSAMPLES=$HOME/hyperledger/fabric-samples" >>  ~/.profile
    $> echo "export PATH=$FABRICSAMPLES/bin:$PATH" >>  ~/.profile
    $> echo "# HYPERLEDGER FABRIC env end" >>  ~/.profile
    $> source  ~/.profile

### Instalar Fabric-CA (server + client)

* Comandos a serem executados:

    $> cd  ~
    $> go get -u github.com/hyperledger/fabric-ca/cmd/

    *Aguarde algum tempo. Quando acabar de executar, vai devolver o prompt*

    *Verificar versões instaladas*

    $> fabric-ca-server version
    $> fabric-ca-client version

### Testar Exemplo:_First Network_

1. Testar Criação de um Bloco Gênesis com a _First Network_:

    $> cd  ~/hyperledger/fabric-samples/first-network
    $> ./byfn.sh generate
    $> ./byfn.sh up

2. Verificar os containers em execução:

    $> docker ps -a

3. Derrubar a _First Network_:

    $> ./byfn.sh down

### Testar Exemplo:_Basic Network_

1. Preparar (Leia as instruções do README.md do Hyperledger Fabric):

    $> cd  ~/hyperledger/fabric-samples/basic-network
    $> cat README.md

2. Iniciar a rede:

    $> ./start.sh

3. Verificar os containers:

    $> docker ps -a

4. Encerrar a rede:

    $> ./stop.sh

5. Verificar os containers:

    $> docker ps -a

6. Verificar a versão do executável Orderer:

    $> orderer version

7. Verificar a versão do executável Peer:

    $> peer version

8. Verificar a lista de imagens Docker que foram baixadas:

    $> docker images

9. Verificar a versão da ferramenta CRYPTOGEN:

    $> cryptogen version
    $> cryptogen showtemplate

10. Verificar a versão da ferramenta CONFIGTXGEN:

    $> configtxgen -version

11. Verificar a versão da ferramenta CONFIGTXLATOR:

    $> configtxlator version

12. Verificar a versão do Fabric CA Server:

    $> fabric-ca-server version

13. Verificar a versão do Fabric CA Client:

    $> fabric-ca-client version

### Hyperldeger Fabric API's

1. Instalar Hyperldeger Fabric API's, na home-area do usuário de operação do Hyperledger Fabric:

    $> npm install fabric-common
    $> npm install fabric-network
    $> npm install fabric-shim
    $> npm install fabric-contract-api

2. Reiniciar o sistema inteiro para salvar dados e confirmar a instalação:

    $> sudo reboot

## Fim
