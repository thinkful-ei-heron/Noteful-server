const express = require('express');
const xss = require('xss');
const NotesService = require('./notes-service');

const noteRouter = express.Router();
const jsonParser = express.json();


const serializeNote = note => ({
    id: note.id,
    title: xss(note.title),
    folder_id: note.folder_id,
    content: xss(note.content),
    date_added: new Date(),
});


noteRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        NotesService
            .getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializeNote));
            })
            .catch(next);
    })
    .post(jsonParser, (req, res, next) => {
        const { title, folder_id, content, date_added } = req.body;
        const newNote = { title, folder_id, content, date_added };

        for( const [key, value] of Object.entries(newNote))
            if( value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key} in request body`}
                });
        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
        .then(note => {
            res
                .status(201)
                .location(`/notes/${note.id}`)
                .json(serializeNote(newNote));
        })
        .catch(next);
    });

    noteRouter
    .route('/:note_id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.note_id
        )
        .then(note => {
            if(!note){
                return res.status(404).json({
                    error: {message: 'Note not found'}
                });
            }
            res.note = note;
            next();
        })
        .catch(next);
    })
    .get((req,res,next) => {
        res.json(serializeNote(res.note));
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
            req.app.get('db'),
            req.params.note_id
        )
        .then(numRowsAffected => {
            res.status(204).end();
        })
        .catch(next);
    })
    .patch(jsonParser, (req,res,next) => {
        const { title, folder_id, content, date_added } = req.body;
        const updatedNote = { title, folder_id, content, date_added };
        
        const numberOfValues = Object.values(updatedNote).filter(Boolean).length;
        if(numberOfValues === 0 )
            return res.status(400).json({
                error: { message: 'Request body must contain Title and Folder_id.'}
            });
        NotesService.updateNote(
            req.app.get('db'),
            req.params.note_id,
            updatedNote
        )
        .then(numRowsAffected => {
            res.status(204).end();
        });
    });

    module.exports = noteRouter;