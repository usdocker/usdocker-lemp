'use strict';

const usdocker = require('@usdocker/usdocker');
const fs = require('fs');
const path = require('path');
const targz = require('targz');
const fsutil = usdocker.fsutil();

const SCRIPTNAME = 'lemp';

let config = usdocker.config(SCRIPTNAME);
let configGlobal = usdocker.configGlobal();
const CONTAINERNAME = SCRIPTNAME + configGlobal.get('container-suffix');

function getContainerDef() {

    let docker = usdocker.dockerRunWrapper(configGlobal);
    return docker
        .containerName(CONTAINERNAME)
        .port(config.get('port'), 80)
        .port(config.get('sslPort'), 443)
        .volume(path.join(config.get('folder'), 'sites'), '/srv/web')
        .volume(path.join(config.getUserDir('fpm'), 'fpmpool', 'zz-docker-2.conf'), '/usr/local/etc/php-fpm.d/zz-docker-2.conf')
        .volume(path.join(config.getUserDir('fpm'), 'php', 'custom.ini'), '/usr/local/etc/php/conf.d/custom.ini')
        .volume(path.join(config.getUserDir('nginx'), 'conf.d'), '/etc/nginx/conf.d/')
        .env('LEMP_DATA_FOLDER', config.get('folder'))
        .env('LEMP_PORT', config.get('port'))
        .env('LEMP_SSL_PORT', config.get('sslPort'))
        .env('APPLICATION_ENV', config.get('applicationEnv'))
        .env('TZ', configGlobal.get('timezone'))
        .isDetached(true)
        .isRemove(true)
        .imageName(config.get('image'))
    ;
}

module.exports = {
    setup: function(callback)
    {
        config.setEmpty('image', 'byjg/php7-fpm-nginx:alpine');
        config.setEmpty('folder', config.getDataDir());
        config.setEmpty('port', 80);
        config.setEmpty('sslPort', 443);
        config.setEmpty('applicationEnv', 'dev');

        config.copyToUserDir(path.join(__dirname, 'lemp', 'conf', 'fpm'));
        config.copyToUserDir(path.join(__dirname, 'lemp', 'conf', 'nginx'));

        config.copyToDataDir(path.join(__dirname, 'lemp', 'sites'));

        callback(null, 'setup loaded for ' + SCRIPTNAME);
    },

    domainAdd(callback, extraArgs) {
        if (extraArgs.length !== 1 && extraArgs.length !== 2) {
            throw new Error('domain-add requires two parameters: domain and template (optional .tar.gz file)');
        }

        let destFolder = path.join(config.get('folder'), 'sites', extraArgs[0]);
        if (fs.existsSync(destFolder)) {
            throw new Error('Domain "' + extraArgs[0] + '" already created');
        }

        if (extraArgs.length === 1) {
            let sourceFolder = path.join(config.get('folder'), 'sites', '.template');
            fsutil.copyFolderRecursiveSync(sourceFolder, destFolder);
            callback(null, 'Created domain "' + extraArgs[0] + '" from template');
        }

        if (extraArgs.length === 2) {
            targz.decompress({
                src: extraArgs[1],
                dest: destFolder
            }, function(err){
                if(err) {
                    callback(err);
                } else {
                    callback(null, 'Created domain "' + extraArgs[0] + '" from "' + extraArgs[1] + '"');
                }
            });
        }
    },

    export(callback, extraArgs) {
        if (extraArgs.length !== 2) {
            throw new Error('export requires two parameters: domain and the destination folder');
        }

        let sourceFolder = path.join(config.get('folder'), 'sites', extraArgs[0]);
        if (!fs.existsSync(sourceFolder)) {
            throw new Error('Domain "' + extraArgs[0] + '" does not exists.');
        }

        if (!fs.existsSync(extraArgs[1])) {
            throw new Error('Destination folder does not exists.');
        }
        let destFile = path.join(extraArgs[1], extraArgs[0] + '.tar.gz');
        if (fs.existsSync(destFile)) {
            throw new Error('Backup ' + destFile + ' file already exists');
        }

        targz.compress({
            src: sourceFolder,
            dest: destFile
        }, function(err){
            if(err) {
                callback(err);
            } else {
                callback(null, 'Backup of domain "' + extraArgs[0] + '" created at "' + destFile + '"');
            }
        });
    },

    domainDel(callback, extraArgs) {
        if (extraArgs.length !== 1) {
            throw new Error('domain-del requires one parameter: domain');
        }

        let destFolder = path.join(config.get('folder'), 'sites', extraArgs[0]);
        if (!fs.existsSync(destFolder)) {
            throw new Error('Domain "' + extraArgs[0] + '" does not exists');
        }

        usdocker.ask(
            'Are you sure you want to continue',
            false,
            this.options.yes,
            this.options.no,
            function() {
                fsutil.removeDirectoryRecursive(destFolder);
                callback(null, 'Domain removed!');
            },
            callback
        );
    },

    domainList(callback) {
        let destFolder = path.join(config.get('folder'), 'sites');
        let result = fsutil.getDirectories(destFolder);
        let resultVerb = [];
        for(let i=0; i<result.length; i++) {
            resultVerb.push(path.join(destFolder, result[i]));
        }

        callback(result.join('\n'), resultVerb.join('\n'));
    },

    debugcli(callback) {
        let result = usdocker.outputRaw('cli', getContainerDef());
        callback(result);
    },

    debugapi(callback) {
        let result = usdocker.outputRaw('api', getContainerDef());
        callback(result);
    },

    up: function(callback)
    {
        usdocker.up(CONTAINERNAME, getContainerDef(), callback);
    },

    status: function(callback) {
        usdocker.status(CONTAINERNAME, callback);
    },

    down: function(callback)
    {
        usdocker.down(CONTAINERNAME, callback);
    },

    restart: function(callback)
    {
        usdocker.restart(CONTAINERNAME, getContainerDef(), callback);
    }
};
