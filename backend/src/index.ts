import { MikroORM } from '@mikro-orm/core'
import { ApolloServer } from 'apollo-server-express'
import connectRedis from 'connect-redis'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import redis from 'redis'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { COOKIE_NAME, __prod__ } from './constants'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import { MyContext } from './types'

const main = async () => {
    const orm = await MikroORM.init()
    const RedisStore = connectRedis(session)
    await orm.getMigrator().up()

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
                client: redis.createClient(),
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
        context: ({ req, res }: MyContext) => ({ em: orm.em, req, res }),
    })

    apolloServer.applyMiddleware({
        app,
        cors: false,
    })

    app.listen(3001, () => console.log('server started'))
}
main()
