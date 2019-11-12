const express = require('express');
const xss = require('xss');
const FolderService = require('./folders-service');

const folderRouter = express.Router();
const jsonParser = express.json();


const serializeFolder = folder => ({
    id: folder.id,
    folder_name: xss(folder.folder_name),
});


folderRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        FolderService
            .getAllFolders(knexInstance)
            .then(folders => {
                res.json(folders.map(serializeFolder));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { folder_name } = req.body;
        const newFolder = { folder_name };

        for( const [key, value] of Object.entries(newFolder))
            if( value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key} in request body`}
                });
        FolderService.insertFolder(
            req.app.get('db'),
            newFolder
        )
        .then(folder => {
            res
                .status(201)
                .location(`/folders/${folder.id}`)
                .json(serializeFolder(newFolder));
        })
        .catch(next);
    });

folderRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FolderService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
        .then( folder => {
            if(!folder){
                return res.status(404).json({
                    error: {message: 'Folder not found'}
                });
            }
            res.folder = folder;
            next();
        })
        .catch(next);
    })
    .get((req,res,next) => {
        res.json(serializeFolder(res.folder));
    })
    .delete((req, res, next) => {
        FolderService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(numRowsAffected => {
            res.status(204).end();
        })
        .catch(next);
    })
    .patch(jsonParser, (req,res,next) => {
        const { folder_name } = req.body;
        const updatedFolder = { folder_name };
        
        const numberOfValues = Object.values(updatedFolder).filter(Boolean).length;
        if(numberOfValues === 0 )
            return res.status(400).json({
                error: { message: 'Request body must contain Folder Name.'}
            });
        FolderService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            updatedFolder
        )
        .then(numRowsAffected => {
            res.status(204).end();
        });
        
    });

    module.exports = folderRouter;