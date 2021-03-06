# USDocker Generic LEMP Server

This Useful Script creates a really generic NGINX+PHP+MYSQL server from a Docker image.
You don't know docker to use this solution.  

The server will be recognize the domain and select dynamically the folder where this domain will be serve pages.

The default ROOT for the server is:

```
$HOME/.usdocker/data/lemp/sites
```

## Installing

```bash
npm install -g @usdocker/usdocker # Install it first
npm install -g @usdocker/mysql @usdocker/lemp
usdocker -r    # Update USDocker database
```

## Running

```bash
usdocker mysql up    # installed as dependency
usdocker lemp up
```

Check the status

```bash
usdocker lemp status
```

Down the server

```bash
usdocker lemp down
```

## Serving domains

If you wanna serve pages for domain "example.com" you just have to create a folder:

```bash
usdocker lemp domain-add example.com
```

And you will serve pages for this domain immediatelly. 
This script tries to find the follow directories to server web pages:

- web
- httpdocs
- public 

If found, the directory for the web pages will be, respectively:

```
$HOME/.usdocker/data/lemp/sites/example.com/web
or
$HOME/.usdocker/data/lemp/sites/example.com/httpdocs
or
$HOME/.usdocker/data/lemp/sites/example.com/public
```

If not found will serve the root directory directly

### Serve a domain with a previous specific content

Optionally, you can create a domain with a pre-defined content existing in a tar.gz file. 
 
To do this execute:

```bash
usdocker lemp domain-add example.com /path/to/file.tar.gz
```

### Remove a domain

```bash
usdocker lemp domain-del example.com
```

### List served domains

```bash
usdocker lemp domain-list
```

### Export/backup domains

```bash
usdocker lemp export [domain] [dest folder]
```

## Windows Know Problems

**Q: I am getting no error but the service is not started OR I am getting the error: "docker error userland proxy: Bind for 0.0.0.0:80: unexpected error Permission denied. windows"**

A: This error occured because the port 80 is already binded. Try to Shutdown the Skype and/or stop the "World Wide Web Service" (`net stop http`)

## Customize your Service

You can setup the variables by using:

```bash
usdocker lemp --set variable=value
```

Default values

 - image: "byjg/php:7-fpm-nginx",
 - folder: "$HOME/.usdocker/data/lemp",
 - port: 80,
 - sslPort: 443,
 - applicationEnv: "dev" (will set APPLICATION_ENV environment variable to PHP)
 - phpHandler: "/app.php"  (you can change to another or =404 for ignore phpHandler)
 - enableCors: 'true'
 - corsAllowOrigin: '*';
 - nginxDebugHeader: 'true'
 - phpDebugHeader: 'true'
