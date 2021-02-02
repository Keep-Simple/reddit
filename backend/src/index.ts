import 'reflect-metadata'
// sticking envs and will fail if not all of them existing
import 'dotenv-safe/config'
import { createConnection } from 'typeorm'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import Redis from 'ioredis'
import { buildSchema } from 'type-graphql'
import { COOKIE_NAME, __prod__ } from './constants'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { Post } from './entities/Post'
import { User } from './entities/User'
import path from 'path'
import { Updoot } from './entities/Updoot'
import { createUserLoader } from './utils/createUserLoader'
import { createUpdootLoader } from './utils/createUpdootLoader'

const main = async () => {
    const dbConnection = await createConnection({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        logging: true,
        synchronize: true,
        entities: [User, Post, Updoot],
        migrations: [path.join(__dirname, './migrations/*')],
    })

    await dbConnection.runMigrations()

    const RedisStore = connectRedis(session)
    const redis = new Redis()

    const app = express()

    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    )

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({
                client: redis,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
                httpOnly: true,
                sameSite: 'lax', // csrf
                secure: __prod__, // only works in https in prod
            },
            secret: '98jldfgj14kjoasdfjasldk3',
            saveUninitialized: false,
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader(),
        }),
    })

    apolloServer.applyMiddleware({
        app,
        cors: false,
    })

    app.listen(process.env.PORT, () =>
        console.log('server started on port 3001')
    )
}
main()
