#!/bin/bash
cd /home/kavia/workspace/code-generation/noteease-3481-a4ad61f8/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

