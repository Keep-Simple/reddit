import { EntityManager } from '@mikro-orm/postgresql'
import argo2 from 'argon2'
import {
    Arg,
    Ctx,
    Field,
    InputType,
    Mutation,
    ObjectType,
    Query,
    Resolver,
} from 'type-graphql'
import { COOKIE_NAME } from '../constants'
import { User } from '../entities/User'
import { MyContext } from '../types'

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string
    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[]
    @Field(() => User, { nullable: true })
    user?: User
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(@Ctx() { req, em }: MyContext) {
        if (!req.session.userId) return null
        return em.findOne(User, { id: req.session.userId })
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ) {
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: 'length must be greater than 2',
                    },
                ],
            }
        }
        if (options.password.length <= 3) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'length must be greater than 3',
                    },
                ],
            }
        }
        const hashedPassword = await argo2.hash(options.password)
        let user
        try {
            user = (
                await (em as EntityManager)
                    .createQueryBuilder(User)
                    .getKnexQuery()
                    .insert({
                        username: options.username,
                        password: hashedPassword,
                        created_at: new Date(),
                        updated_at: new Date(),
                    })
                    .returning('*')
            )[0]
        } catch (e) {
            if (e.code === '23505') {
                return {
                    errors: [
                        {
                            field: 'username',
                            message: 'username already taken',
                        },
                    ],
                }
            }
        }
        req.session.userId = user.id
        return { user }
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ) {
        const user = await em.findOne(User, { username: options.username })
        if (!user) {
            return {
                errors: [
                    {
                        field: 'username',
                        message: "that username doesn't exist",
                    },
                ],
            }
        }
        const valid = await argo2.verify(user.password, options.password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: 'password',
                        message: 'incorrect password',
                    },
                ],
            }
        }

        req.session.userId = user.id

        return { user }
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        res.clearCookie(COOKIE_NAME)
        return new Promise((resolve) =>
            req.session.destroy((e) => (e ? resolve(false) : resolve(true)))
        )
    }
}
