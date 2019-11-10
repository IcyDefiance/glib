glib-frontend

# How to Run

    npm i
    npm run webpack
    npm start

A launch config for .vscode is also included.

Linux users need to run these commands to use the chrome sandbox inside the node_modules folder:

    chown root:root node_modules/electron/dist/chrome-sandbox
    chmod 4755 node_modules/electron/dist/chrome-sandbox
