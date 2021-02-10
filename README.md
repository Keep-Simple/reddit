# Reddit fullstack clone

## Tech stack
  - Backend
    - **Node.js + TypeScript + Express**
    - **Postgres + Typeorm + Redis**
    - **Apollo + Type-Graphql + DataLoader**
    
  - Frontend  
    - **Next.js + TypeScript** (React-based framework)
    - **Chakra-ui** (Component library with Styled-System under the hood)
    - **Apollo-client** (Making graphql requests to server + normalized caching)
    - **Graphql-codegen** (Generating TypeScript types from schema + custom react hooks)

## Build Backend

-   `cd ./backend && yarn`
-   `yarn build` to compile typescript to ./dist folder
-    install postgres and redis on your machine
-    create your own .env file from .env.example & enter your credentials
-   `yarn start` will start the server

## Build Frontend

-   `cd ./frontend && yarn`
-   `yarn build` 
-    create .env.local from .env.example.local 
-   `yarn start` will start next.js server
